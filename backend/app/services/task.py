"""タスクに関するビジネスロジック。"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Task
from app.schemas.task import TaskCreate, TaskUpdate


def list_tasks(
    db: Session, user_id: uuid.UUID, *, include_completed: bool
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user_id)
    if not include_completed:
        stmt = stmt.where(Task.is_completed.is_(False))
    stmt = stmt.order_by(Task.created_at)
    return list(db.scalars(stmt))


def create_task(db: Session, user_id: uuid.UUID, data: TaskCreate) -> Task:
    task = Task(
        user_id=user_id,
        title=data.title,
        estimated_pomodoros=data.estimated_pomodoros,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
    stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    return db.scalars(stmt).first()


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
