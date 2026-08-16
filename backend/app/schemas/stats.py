"""日次集計の入出力スキーマ。"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.pomodoro_session import SessionStatus, SessionType
from app.schemas.task import TaskRead


class DailyTaskBreakdown(BaseModel):
    task_id: uuid.UUID | None
    title: str | None
    work_minutes: int
    completed_sessions: int


class DailyStat(BaseModel):
    date: date
    work_minutes: int
    break_minutes: int
    completed_work_sessions: int
    interrupted_work_sessions: int
    due_task_count: int
    tasks: list[DailyTaskBreakdown]


class DailyStatsResponse(BaseModel):
    start_date: date
    end_date: date
    tz_offset_minutes: int
    totals: dict[str, int]  # {work_minutes, completed_work_sessions, active_days}
    days: list[DailyStat]


class DaySessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID | None
    user_id: uuid.UUID
    session_type: SessionType
    duration_minutes: int
    status: SessionStatus
    started_at: datetime
    ended_at: datetime
    task_title: str | None


class DayDetailResponse(BaseModel):
    date: date
    tz_offset_minutes: int
    work_minutes: int
    sessions: list[DaySessionRead]
    worked_tasks: list[DailyTaskBreakdown]
    due_tasks: list[TaskRead]
