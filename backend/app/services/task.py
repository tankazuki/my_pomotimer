"""タスクに関するビジネスロジック。"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Task
from app.models.task_tag import task_tags
from app.schemas.task import TaskCreate, TaskUpdate
from app.services import tag as tag_service


def list_tasks(
    db: Session,
    user_id: uuid.UUID,
    *,
    include_completed: bool,
    tag_id: uuid.UUID | None = None,
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user_id)
    if not include_completed:
        stmt = stmt.where(Task.is_completed.is_(False))
    if tag_id is not None:
        stmt = stmt.join(task_tags, task_tags.c.task_id == Task.id).where(
            task_tags.c.tag_id == tag_id
        )
    stmt = stmt.order_by(Task.created_at)
    return list(db.scalars(stmt))


def create_task(db: Session, user_id: uuid.UUID, data: TaskCreate) -> Task:
    # タグは先に解決 (get-or-create) しておく。
    # 関連付けは最後の1回のcommitでまとめて行う。
    tags = (
        tag_service.resolve_tags(db, user_id, data.tags)
        if data.tags is not None
        else []
    )

    task = Task(
        user_id=user_id,
        title=data.title,
        estimated_pomodoros=data.estimated_pomodoros,
        due_date=data.due_date,
        tags=tags,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
    stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    return db.scalars(stmt).first()


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    update_data = data.model_dump(exclude_unset=True)
    # tags はタグ名のリストであり Task.tags (Tag の関連) とは型が異なるため、
    # 汎用の setattr ループから外して個別に解決する。
    tag_names = update_data.pop("tags", None)

    for field, value in update_data.items():
        setattr(task, field, value)

    if tag_names is not None:
        task.tags = tag_service.resolve_tags(db, task.user_id, tag_names)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
