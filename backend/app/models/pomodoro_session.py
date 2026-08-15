"""ポモドーロセッションモデル。"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SessionType(enum.StrEnum):
    """セッション種別。"""

    WORK = "WORK"
    SHORT_BREAK = "SHORT_BREAK"
    LONG_BREAK = "LONG_BREAK"


class SessionStatus(enum.StrEnum):
    """セッションの完了状態。"""

    COMPLETED = "COMPLETED"
    INTERRUPTED = "INTERRUPTED"


class PomodoroSession(Base):
    """完了/中断した1回のポモドーロセッションの記録。"""

    __tablename__ = "pomodoro_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("guest_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # native_enum=False: PostgreSQLのネイティブENUM型はdowngradeを壊しやすいため
    # VARCHAR+CHECK制約として保存する (移植性優先)。
    session_type: Mapped[SessionType] = mapped_column(
        SAEnum(SessionType, native_enum=False, length=20), nullable=False
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus, native_enum=False, length=20), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
