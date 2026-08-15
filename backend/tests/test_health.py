"""GET /health のテスト。"""

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert isinstance(body["app_name"], str)


def test_health_allows_frontend_origin(client: TestClient) -> None:
    """CORSでフロントエンドの開発オリジンが許可されていること。"""
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_health_rejects_unknown_origin(client: TestClient) -> None:
    """許可していないオリジンには CORS ヘッダを返さないこと。"""
    response = client.get("/health", headers={"Origin": "http://evil.example.com"})

    assert "access-control-allow-origin" not in response.headers
