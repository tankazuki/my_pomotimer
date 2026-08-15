"""ポモドーロセッションに関するビジネスロジック。"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PomodoroSession, SessionStatus, SessionType, Task
from app.schemas.session import SessionCreate


def create_session(
    db: Session,
    user_id: uuid.UUID,
    data: SessionCreate,
    task: Task | None,
) -> PomodoroSession:
    """セッション記録を作成する。

    session_type=WORK かつ status=COMPLETED かつタスク紐付けありのときだけ、
    そのタスクの completed_pomodoros をサーバー側で +1 する
    (単一の真実の源をサーバーに置き、二重カウントを防ぐ)。
    """
    session = PomodoroSession(
        task_id=data.task_id,
        user_id=user_id,
        session_type=data.session_type,
        duration_minutes=data.duration_minutes,
        status=data.status,
        started_at=data.started_at,
        ended_at=data.ended_at,
    )
    db.add(session)

    if (
        task is not None
        and data.session_type == SessionType.WORK
        and data.status == SessionStatus.COMPLETED
    ):
        task.completed_pomodoros += 1

    db.commit()
    db.refresh(session)
    return session


def list_sessions(
    db: Session,
    user_id: uuid.UUID,
    *,
    task_id: uuid.UUID | None,
    limit: int,
    offset: int,
) -> list[PomodoroSession]:
    stmt = select(PomodoroSession).where(PomodoroSession.user_id == user_id)
    if task_id is not None:
        stmt = stmt.where(PomodoroSession.task_id == task_id)
    stmt = stmt.order_by(PomodoroSession.started_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt))
