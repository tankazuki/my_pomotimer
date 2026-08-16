"""エクスポート機能の出力スキーマ。"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.guest import GuestRead
from app.schemas.session import SessionRead
from app.schemas.tag import TagRead
from app.schemas.task import TaskRead


class ExportPayload(BaseModel):
    schema_version: Literal[2] = 2
    exported_at: datetime
    guest_profile: GuestRead
    tasks: list[TaskRead]
    sessions: list[SessionRead]
    tags: list[TagRead]
