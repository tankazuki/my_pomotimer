"""タスク関連のルーター。ロジックは services/ に置く。"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_guest
from app.db import get_db
from app.models import GuestProfile
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services import task as task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskRead])
def list_tasks(
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
    include_completed: bool = True,
    tag_id: uuid.UUID | None = None,
) -> list[TaskRead]:
    tasks = task_service.list_tasks(
        db, guest.id, include_completed=include_completed, tag_id=tag_id
    )
    return [TaskRead.model_validate(task) for task in tasks]


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreate,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> TaskRead:
    task = task_service.create_task(db, guest.id, data)
    return TaskRead.model_validate(task)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> TaskRead:
    task = task_service.get_task(db, guest.id, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return TaskRead.model_validate(task)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> TaskRead:
    task = task_service.get_task(db, guest.id, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    task = task_service.update_task(db, task, data)
    return TaskRead.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> None:
    task = task_service.get_task(db, guest.id, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    task_service.delete_task(db, task)
