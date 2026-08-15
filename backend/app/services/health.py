"""ヘルスチェックのビジネスロジック。"""

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.schemas.health import HealthResponse


def check_health(db: Session) -> HealthResponse:
    """アプリとDBの疎通を確認する。

    SELECT 1 は SQLite / PostgreSQL のどちらでも通る最小のクエリ。
    """
    try:
        db.execute(text("SELECT 1"))
        database: str = "ok"
    except SQLAlchemyError:
        database = "error"

    return HealthResponse(
        status="ok" if database == "ok" else "degraded",
        app_name=get_settings().app_name,
        database="ok" if database == "ok" else "error",
    )
