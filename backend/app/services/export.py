"""エクスポート機能のビジネスロジック。"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import GuestProfile, PomodoroSession, Task
from app.schemas.export import ExportPayload
from app.schemas.guest import GuestRead
from app.schemas.session import SessionRead
from app.schemas.task import TaskRead


def build_export(db: Session, guest: GuestProfile) -> ExportPayload:
    tasks = list(
        db.scalars(
            select(Task).where(Task.user_id == guest.id).order_by(Task.created_at)
        )
    )
    sessions = list(
        db.scalars(
            select(PomodoroSession)
            .where(PomodoroSession.user_id == guest.id)
            .order_by(PomodoroSession.started_at.desc())
        )
    )
    return ExportPayload(
        schema_version=1,
        exported_at=datetime.now(UTC),
        guest_profile=GuestRead.model_validate(guest),
        tasks=[TaskRead.model_validate(task) for task in tasks],
        sessions=[SessionRead.model_validate(session) for session in sessions],
    )
