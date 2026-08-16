"""タグモデル。"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    Uuid,
    func,
    select,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column

from app.db import Base
from app.models.task_tag import task_tags


class Tag(Base):
    """ゲストが作成するタスクタグ。"""

    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "normalized_name", name="uq_tags_user_id_normalized_name"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("guest_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # 表示用の元の文字列 (大文字小文字を保持する)。
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    # 重複判定用に strip + lower した文字列。ユーザーごとに一意。
    normalized_name: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # このタグが紐づくタスクの数。相関サブクエリで都度計算し、常に最新の値を返す。
    usage_count: Mapped[int] = column_property(
        select(func.count(task_tags.c.task_id))
        .where(task_tags.c.tag_id == id)
        .correlate_except(task_tags)
        .scalar_subquery()
    )
