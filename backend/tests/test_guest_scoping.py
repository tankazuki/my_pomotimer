"""ゲスト間のリソース分離 (他ゲストのリソースは404) のテスト。"""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def _other_guest_headers() -> dict[str, str]:
    return {"X-Guest-ID": str(uuid.uuid4())}


def test_other_guest_cannot_get_task(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Private task"}, headers=guest_headers
    ).json()

    response = client.get(f"/api/tasks/{task['id']}", headers=_other_guest_headers())

    assert response.status_code == 404


def test_other_guest_cannot_update_task(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Private task"}, headers=guest_headers
    ).json()

    response = client.patch(
        f"/api/tasks/{task['id']}",
        json={"title": "Hijacked"},
        headers=_other_guest_headers(),
    )

    assert response.status_code == 404


def test_other_guest_cannot_delete_task(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Private task"}, headers=guest_headers
    ).json()

    response = client.delete(f"/api/tasks/{task['id']}", headers=_other_guest_headers())

    assert response.status_code == 404


def test_other_guest_cannot_create_session_for_task(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Private task"}, headers=guest_headers
    ).json()
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=25)

    response = client.post(
        "/api/sessions",
        json={
            "task_id": task["id"],
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
        headers=_other_guest_headers(),
    )

    assert response.status_code == 404


def test_other_guest_sessions_not_listed(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    started_at = datetime.now(UTC)
    ended_at = started_at + timedelta(minutes=25)
    client.post(
        "/api/sessions",
        json={
            "task_id": None,
            "session_type": "WORK",
            "duration_minutes": 25,
            "status": "COMPLETED",
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
        headers=guest_headers,
    )

    other_headers = _other_guest_headers()
    response = client.get("/api/sessions", headers=other_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_other_guest_export_is_independent(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    client.post("/api/tasks", json={"title": "Private task"}, headers=guest_headers)

    other_headers = _other_guest_headers()
    response = client.get("/api/export", headers=other_headers)

    assert response.status_code == 200
    assert response.json()["tasks"] == []
