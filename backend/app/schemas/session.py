"""ポモドーロセッションの入出力スキーマ。"""

import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.pomodoro_session import SessionStatus, SessionType


class SessionCreate(BaseModel):
    task_id: uuid.UUID | None = None
    session_type: SessionType
    duration_minutes: int = Field(ge=1, le=180)
    status: SessionStatus
    started_at: datetime
    ended_at: datetime

    @model_validator(mode="after")
    def _check_ended_after_started(self) -> Self:
        if self.ended_at < self.started_at:
            raise ValueError("ended_at must not be earlier than started_at")
        return self


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID | None
    user_id: uuid.UUID
    session_type: SessionType
    duration_minutes: int
    status: SessionStatus
    started_at: datetime
    ended_at: datetime
