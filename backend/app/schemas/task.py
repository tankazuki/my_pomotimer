"""タスクの入出力スキーマ。"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    estimated_pomodoros: int = Field(default=1, ge=1, le=99)


class TaskUpdate(BaseModel):
    # completed_pomodoros はサーバー側 (POST /api/sessions) のみが更新できる。
    # 二重カウント防止のため、このスキーマには含めない。
    title: str | None = Field(default=None, min_length=1, max_length=255)
    estimated_pomodoros: int | None = Field(default=None, ge=1, le=99)
    is_completed: bool | None = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    estimated_pomodoros: int
    completed_pomodoros: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
