"""DB接続・セッション管理。

SQLite (開発) と PostgreSQL (本番) の両方で動くようにしておく。
SQLite固有の指定は接続URLを見て条件付きで適用する。
"""

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# check_same_thread は SQLite ドライバ固有のオプション。
# PostgreSQL に切り替えたときに渡すと接続エラーになるため条件分岐する。
connect_args: dict[str, Any] = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """SQLAlchemyモデルの基底クラス。models/ 配下でこれを継承する。"""


def get_db() -> Generator[Session, None, None]:
    """FastAPIの依存性注入で使うDBセッション。リクエストごとに開いて閉じる。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
