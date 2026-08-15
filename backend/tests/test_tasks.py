"""タスクCRUDのテスト。"""

import uuid

from fastapi.testclient import TestClient

from app.schemas.task import TaskUpdate


def test_create_task(client: TestClient, guest_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Write report", "estimated_pomodoros": 3},
        headers=guest_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Write report"
    assert body["estimated_pomodoros"] == 3
    assert body["completed_pomodoros"] == 0
    assert body["is_completed"] is False


def test_create_task_missing_guest_header_returns_401(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "No header"})

    assert response.status_code == 401
    assert response.json()["detail"] == "X-Guest-ID header is required"


def test_create_task_invalid_guest_header_returns_400(client: TestClient) -> None:
    response = client.post(
        "/api/tasks", json={"title": "Bad header"}, headers={"X-Guest-ID": "not-a-uuid"}
    )

    assert response.status_code == 400


def test_unregistered_guest_id_is_auto_registered(client: TestClient) -> None:
    new_guest_id = str(uuid.uuid4())

    response = client.get("/api/tasks", headers={"X-Guest-ID": new_guest_id})

    assert response.status_code == 200
    assert response.json() == []


def test_create_task_invalid_body_returns_422(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "", "estimated_pomodoros": 3},
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_list_tasks_filters_completed_by_default(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    client.post("/api/tasks", json={"title": "Active task"}, headers=guest_headers)
    done = client.post(
        "/api/tasks", json={"title": "Done task"}, headers=guest_headers
    ).json()
    client.patch(
        f"/api/tasks/{done['id']}", json={"is_completed": True}, headers=guest_headers
    )

    response = client.get("/api/tasks?include_completed=false", headers=guest_headers)

    assert response.status_code == 200
    titles = [task["title"] for task in response.json()]
    assert titles == ["Active task"]


def test_get_task(client: TestClient, guest_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/tasks", json={"title": "Read book"}, headers=guest_headers
    ).json()

    response = client.get(f"/api/tasks/{created['id']}", headers=guest_headers)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_task_not_found(client: TestClient, guest_headers: dict[str, str]) -> None:
    response = client.get(f"/api/tasks/{uuid.uuid4()}", headers=guest_headers)

    assert response.status_code == 404


def test_update_task(client: TestClient, guest_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/tasks", json={"title": "Old title"}, headers=guest_headers
    ).json()

    response = client.patch(
        f"/api/tasks/{created['id']}",
        json={"title": "New title", "estimated_pomodoros": 5},
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "New title"
    assert body["estimated_pomodoros"] == 5


def test_update_task_cannot_set_completed_pomodoros(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    created = client.post(
        "/api/tasks", json={"title": "Task"}, headers=guest_headers
    ).json()

    response = client.patch(
        f"/api/tasks/{created['id']}",
        json={"completed_pomodoros": 99},
        headers=guest_headers,
    )

    assert response.status_code == 200
    assert response.json()["completed_pomodoros"] == 0


def test_delete_task(client: TestClient, guest_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/tasks", json={"title": "To delete"}, headers=guest_headers
    ).json()

    response = client.delete(f"/api/tasks/{created['id']}", headers=guest_headers)
    assert response.status_code == 204

    get_response = client.get(f"/api/tasks/{created['id']}", headers=guest_headers)
    assert get_response.status_code == 404


def test_delete_task_not_found(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.delete(f"/api/tasks/{uuid.uuid4()}", headers=guest_headers)

    assert response.status_code == 404


def test_task_update_schema_has_no_completed_pomodoros_field() -> None:
    """completed_pomodoros はサーバー側 (POST /api/sessions) のみが更新できる。

    二重カウント防止のため、TaskUpdateスキーマ自体に存在しないことを確認する
    (test_update_task_cannot_set_completed_pomodoros は送信しても無視される
    ことを確認しているが、こちらはスキーマ定義そのものを確認する)。
    """
    assert "completed_pomodoros" not in TaskUpdate.model_fields
