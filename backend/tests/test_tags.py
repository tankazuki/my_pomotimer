"""タグ機能 (GET/DELETE /api/tags, タスクのタグ紐付け) のテスト。"""

import uuid

from fastapi.testclient import TestClient


def _other_guest_headers() -> dict[str, str]:
    return {"X-Guest-ID": str(uuid.uuid4())}


def test_create_task_with_tags_and_read_back(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Write report", "tags": ["Work", "Urgent"]},
        headers=guest_headers,
    )

    assert response.status_code == 201
    body = response.json()
    tag_names = sorted(t["name"] for t in body["tags"])
    assert tag_names == ["Urgent", "Work"]
    assert all(t["usage_count"] == 1 for t in body["tags"])

    get_response = client.get(f"/api/tasks/{body['id']}", headers=guest_headers)
    assert get_response.status_code == 200
    assert sorted(t["name"] for t in get_response.json()["tags"]) == [
        "Urgent",
        "Work",
    ]


def test_update_task_replaces_all_tags(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["a", "b"]},
        headers=guest_headers,
    ).json()

    response = client.patch(
        f"/api/tasks/{task['id']}",
        json={"tags": ["c"]},
        headers=guest_headers,
    )

    assert response.status_code == 200
    assert [t["name"] for t in response.json()["tags"]] == ["c"]


def test_update_task_with_empty_list_clears_tags(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["a", "b"]},
        headers=guest_headers,
    ).json()

    response = client.patch(
        f"/api/tasks/{task['id']}",
        json={"tags": []},
        headers=guest_headers,
    )

    assert response.status_code == 200
    assert response.json()["tags"] == []


def test_update_task_without_tags_key_does_not_change_tags(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["a", "b"]},
        headers=guest_headers,
    ).json()

    response = client.patch(
        f"/api/tasks/{task['id']}",
        json={"title": "Renamed"},
        headers=guest_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Renamed"
    assert sorted(t["name"] for t in body["tags"]) == ["a", "b"]


def test_tag_names_are_deduplicated_case_insensitively(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["Work", "work", " WORK "]},
        headers=guest_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["tags"]) == 1
    assert body["tags"][0]["name"] == "Work"


def test_reusing_existing_tag_reuses_same_tag_id(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task1 = client.post(
        "/api/tasks", json={"title": "First", "tags": ["shared"]}, headers=guest_headers
    ).json()
    task2 = client.post(
        "/api/tasks",
        json={"title": "Second", "tags": ["Shared"]},
        headers=guest_headers,
    ).json()

    assert task1["tags"][0]["id"] == task2["tags"][0]["id"]

    tags_response = client.get("/api/tags", headers=guest_headers)
    assert tags_response.status_code == 200
    body = tags_response.json()
    assert len(body) == 1
    assert body[0]["usage_count"] == 2


def test_task_create_rejects_too_many_tags(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": [f"t{i}" for i in range(11)]},
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_task_create_rejects_too_long_tag_name(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["x" * 33]},
        headers=guest_headers,
    )

    assert response.status_code == 422


def test_list_tags_excludes_other_guest_tags(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    client.post(
        "/api/tasks", json={"title": "Mine", "tags": ["mine"]}, headers=guest_headers
    )
    other_headers = _other_guest_headers()
    client.post(
        "/api/tasks",
        json={"title": "Theirs", "tags": ["theirs"]},
        headers=other_headers,
    )

    response = client.get("/api/tags", headers=other_headers)

    assert response.status_code == 200
    names = [t["name"] for t in response.json()]
    assert names == ["theirs"]


def test_list_tags_filters_by_query_case_insensitively(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    client.post(
        "/api/tasks",
        json={"title": "Task", "tags": ["Work", "Personal"]},
        headers=guest_headers,
    )

    response = client.get("/api/tags?q=WOR", headers=guest_headers)

    assert response.status_code == 200
    names = [t["name"] for t in response.json()]
    assert names == ["Work"]


def test_list_tags_orders_by_usage_count_desc_then_name(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    client.post(
        "/api/tasks", json={"title": "T1", "tags": ["zeta"]}, headers=guest_headers
    )
    client.post(
        "/api/tasks",
        json={"title": "T2", "tags": ["alpha", "zeta"]},
        headers=guest_headers,
    )

    response = client.get("/api/tags", headers=guest_headers)

    assert response.status_code == 200
    names = [t["name"] for t in response.json()]
    assert names == ["zeta", "alpha"]


def test_delete_tag_unlinks_from_tasks(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Task", "tags": ["temp"]}, headers=guest_headers
    ).json()
    tag_id = task["tags"][0]["id"]

    response = client.delete(f"/api/tags/{tag_id}", headers=guest_headers)
    assert response.status_code == 204

    get_response = client.get(f"/api/tasks/{task['id']}", headers=guest_headers)
    assert get_response.json()["tags"] == []

    tags_response = client.get("/api/tags", headers=guest_headers)
    assert tags_response.json() == []


def test_delete_tag_not_found(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    response = client.delete(f"/api/tags/{uuid.uuid4()}", headers=guest_headers)

    assert response.status_code == 404


def test_delete_other_guest_tag_returns_404(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks", json={"title": "Task", "tags": ["mine"]}, headers=guest_headers
    ).json()
    tag_id = task["tags"][0]["id"]

    response = client.delete(f"/api/tags/{tag_id}", headers=_other_guest_headers())

    assert response.status_code == 404
    still_there = client.get("/api/tags", headers=guest_headers)
    assert len(still_there.json()) == 1


def test_list_tasks_filters_by_tag_id(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    tagged = client.post(
        "/api/tasks",
        json={"title": "Tagged", "tags": ["important"]},
        headers=guest_headers,
    ).json()
    client.post("/api/tasks", json={"title": "Untagged"}, headers=guest_headers)
    tag_id = tagged["tags"][0]["id"]

    response = client.get(f"/api/tasks?tag_id={tag_id}", headers=guest_headers)

    assert response.status_code == 200
    titles = [t["title"] for t in response.json()]
    assert titles == ["Tagged"]


def test_due_date_set_and_clear(
    client: TestClient, guest_headers: dict[str, str]
) -> None:
    task = client.post(
        "/api/tasks",
        json={"title": "Task", "due_date": "2026-08-20"},
        headers=guest_headers,
    ).json()
    assert task["due_date"] == "2026-08-20"

    unchanged = client.patch(
        f"/api/tasks/{task['id']}",
        json={"title": "Renamed"},
        headers=guest_headers,
    ).json()
    assert unchanged["due_date"] == "2026-08-20"

    cleared = client.patch(
        f"/api/tasks/{task['id']}",
        json={"due_date": None},
        headers=guest_headers,
    ).json()
    assert cleared["due_date"] is None
