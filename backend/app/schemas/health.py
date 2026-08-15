"""ヘルスチェックの入出力スキーマ。"""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """GET /health のレスポンス。"""

    status: Literal["ok", "degraded"]
    app_name: str
    database: Literal["ok", "error"]
