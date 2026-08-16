"""タスクとタグの多対多関連テーブル。"""

from sqlalchemy import Column, ForeignKey, Table, Uuid

from app.db import Base

task_tags = Table(
    "task_tags",
    Base.metadata,
    Column(
        "task_id",
        Uuid(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
