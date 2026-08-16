"""日次集計API (/api/stats/daily, /api/stats/day/{date}) のテスト。"""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

JST_OFFSET_MINUTES = 9 * 60


def _create_session(
    client: TestClient,
    headers: dict[str, str],
    *,
    started_at: datetime,
    duration_minutes: int = 25,
    session_type: str = "WORK",
    status: str = "COMPLETED",
    task_id: str | None = None,
) -> None:
    ended_at = started_at + timedelta(minutes=duration_minutes)
    response = client.post(
        "/api/sessions",
        json={
            "task_id": task_id,
            "session_type": session_type,
            "duration_minutes": duration_minutes,
            "status": status,
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
        headers=headers,
    )
    assert response.status_code == 201


def test_late_night_session_is_bucketed_into_local_next_day(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    # UTC 2026-08-15 23:30 -> JST (UTC+9) では 2026-08-16 08:30
    started_at = datetime(2026, 8, 15, 23, 30, tzinfo=UTC)
    _create_session(client, guest_headers, started_at=started_at)

    response = client.get(
        "/api/stats/daily",
        params={
            "start_date": "2026-08-15",
            "end_date": "2026-08-16",
            "tz_offset_minutes": JST_OFFSET_MINUTES,
        },
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    days = {d["date"]: d for d in body["days"]}
    assert days["2026-08-15"]["work_minutes"] == 0
    assert days["2026-08-16"]["work_minutes"] == 25


def test_sessions_outside_range_are_excluded(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    _create_session(
        client, guest_headers, started_at=datetime(2026, 8, 10, 12, 0, tzinfo=UTC)
    )
    _create_session(
        client, guest_headers, started_at=datetime(2026, 8, 20, 12, 0, tzinfo=UTC)
    )
    in_range = datetime(2026, 8, 15, 12, 0, tzinfo=UTC)
    _create_session(client, guest_headers, started_at=in_range)

    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-08-15", "end_date": "2026-08-15"},
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["days"]) == 1
    assert body["days"][0]["work_minutes"] == 25
    assert body["totals"]["work_minutes"] == 25


def test_daily_stats_zero_fills_days_with_no_sessions(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-08-01", "end_date": "2026-08-05"},
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["days"]) == 5
    assert [d["date"] for d in body["days"]] == [
        "2026-08-01",
        "2026-08-02",
        "2026-08-03",
        "2026-08-04",
        "2026-08-05",
    ]
    assert all(d["work_minutes"] == 0 for d in body["days"])
    assert body["totals"] == {
        "work_minutes": 0,
        "completed_work_sessions": 0,
        "active_days": 0,
    }


def test_daily_stats_range_over_92_days_returns_422(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-01-01", "end_date": "2026-04-15"},
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_daily_stats_end_before_start_returns_422(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-08-10", "end_date": "2026-08-01"},
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_daily_stats_includes_task_breakdown_and_due_task_count(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Focus", "due_date": "2026-08-15"},
        headers=guest_headers,
    ).json()
    _create_session(
        client,
        guest_headers,
        started_at=datetime(2026, 8, 15, 3, 0, tzinfo=UTC),
        task_id=task["id"],
    )

    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-08-15", "end_date": "2026-08-15"},
        headers=guest_headers,
    )

    assert response.status_code == 200
    day = response.json()["days"][0]
    assert day["due_task_count"] == 1
    assert len(day["tasks"]) == 1
    assert day["tasks"][0]["task_id"] == task["id"]
    assert day["tasks"][0]["work_minutes"] == 25
    assert day["tasks"][0]["completed_sessions"] == 1


def test_day_detail_returns_sessions_and_due_tasks(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Focus", "due_date": "2026-08-15"},
        headers=guest_headers,
    ).json()
    _create_session(
        client,
        guest_headers,
        started_at=datetime(2026, 8, 15, 1, 0, tzinfo=UTC),
        task_id=task["id"],
    )
    _create_session(
        client,
        guest_headers,
        started_at=datetime(2026, 8, 15, 2, 0, tzinfo=UTC),
        session_type="SHORT_BREAK",
        duration_minutes=5,
    )

    response = client.get(
        "/api/stats/day/2026-08-15",
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["work_minutes"] == 25
    assert len(body["sessions"]) == 2
    assert body["sessions"][0]["started_at"] < body["sessions"][1]["started_at"]
    assert body["sessions"][0]["task_title"] == "Focus"
    assert len(body["due_tasks"]) == 1
    assert body["due_tasks"][0]["id"] == task["id"]


def test_stats_are_scoped_per_guest(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    import uuid

    other_headers = {"X-Guest-ID": str(uuid.uuid4())}
    _create_session(
        client, guest_headers, started_at=datetime(2026, 8, 15, 3, 0, tzinfo=UTC)
    )

    response = client.get(
        "/api/stats/daily",
        params={"start_date": "2026-08-15", "end_date": "2026-08-15"},
        headers=other_headers,
    )

    assert response.status_code == 200
    assert response.json()["days"][0]["work_minutes"] == 0
