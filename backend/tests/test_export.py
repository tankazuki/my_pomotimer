"""GET /api/export のテスト。"""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_export_contains_all_tables_and_download_header(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Exported task"}, headers=guest_headers
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
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
        headers=guest_headers,
    )

    response = client.get("/api/export", headers=guest_headers)

    assert response.status_code == 200
    assert "attachment" in response.headers["content-disposition"]
    assert "pomodoro-export-" in response.headers["content-disposition"]

    body = response.json()
    assert body["schema_version"] == 1
    assert body["guest_profile"]["id"] == guest_headers["X-Guest-ID"]
    assert len(body["tasks"]) == 1
    assert body["tasks"][0]["id"] == task["id"]
    assert len(body["sessions"]) == 1
