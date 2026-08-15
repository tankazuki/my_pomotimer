"""ポモドーロセッション記録のテスト。"""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def test_create_session_without_task(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=25)

    response = client.post(
        "/api/sessions",
        json={
            "task_id": None,
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    assert response.status_code == 201
    assert response.json()["task_id"] is None


def test_create_session_work_completed_increments_task_pomodoros(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Focus task"}, headers=guest_headers
    ).json()
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=25)

    client.post(
        "/api/sessions",
        json={
            "task_id": task["id"],
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    updated_task = client.get(f"/api/tasks/{task['id']}", headers=guest_headers).json()
    assert updated_task["completed_pomodoros"] == 1


def test_create_session_interrupted_does_not_increment(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Focus task"}, headers=guest_headers
    ).json()
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=10)

    client.post(
        "/api/sessions",
        json={
            "task_id": task["id"],
            "session_type": "WORK",
            "duration_minutes": 10,
            "status": "INTERRUPTED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    updated_task = client.get(f"/api/tasks/{task['id']}", headers=guest_headers).json()
    assert updated_task["completed_pomodoros"] == 0


def test_create_session_break_does_not_increment(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Focus task"}, headers=guest_headers
    ).json()
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=5)

    client.post(
        "/api/sessions",
        json={
            "task_id": task["id"],
            "session_type": "SHORT_BREAK",
            "duration_minutes": 5,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    updated_task = client.get(f"/api/tasks/{task['id']}", headers=guest_headers).json()
    assert updated_task["completed_pomodoros"] == 0


def test_create_session_long_break_does_not_increment(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Focus task"}, headers=guest_headers
    ).json()
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=15)

    client.post(
        "/api/sessions",
        json={
            "task_id": task["id"],
            "session_type": "LONG_BREAK",
            "duration_minutes": 15,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    updated_task = client.get(f"/api/tasks/{task['id']}", headers=guest_headers).json()
    assert updated_task["completed_pomodoros"] == 0


def test_create_session_unknown_task_returns_404(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=25)

    response = client.post(
        "/api/sessions",
        json={
            "task_id": str(uuid.uuid4()),
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    assert response.status_code == 404


def test_create_session_ended_before_started_returns_422(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    started_at = datetime.now(UTC)
    ended_at = started_at - timedelta(minutes=1)

    response = client.post(
        "/api/sessions",
        json={
            "task_id": None,
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": _iso(started_at),
            "ended_at": _iso(ended_at),
        },
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_list_sessions_ordered_desc_by_started_at(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    base = datetime.now(UTC)
    for i in range(3):
        started_at = base + timedelta(minutes=i)
        ended_at = started_at + timedelta(minutes=25)
        client.post(
            "/api/sessions",
            json={
                "task_id": None,
                "session_type": "WORK",
                "duration_minutes": 25,
                "status": "COMPLETED",
                "started_at": _iso(started_at),
                "ended_at": _iso(ended_at),
            },
            headers=guest_headers,
        )

    response = client.get("/api/sessions", headers=guest_headers)

    assert response.status_code == 200
    started_ats = [s["started_at"] for s in response.json()]
    assert started_ats == sorted(started_ats, reverse=True)
