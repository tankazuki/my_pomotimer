"""ポモドーロセッション関連のルーター。ロジックは services/ に置く。"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_guest
from app.db import get_db
from app.models import GuestProfile
from app.schemas.session import SessionCreate, SessionRead
from app.services import session as session_service
from app.services import task as task_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    data: SessionCreate,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> SessionRead:
    task = None
    if data.task_id is not None:
        task = task_service.get_task(db, guest.id, data.task_id)
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

    session = session_service.create_session(db, guest.id, data, task)
    return SessionRead.model_validate(session)


@router.get("", response_model=list[SessionRead])
def list_sessions(
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
    task_id: uuid.UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[SessionRead]:
    sessions = session_service.list_sessions(
        db, guest.id, task_id=task_id, limit=limit, offset=offset
    )
    return [SessionRead.model_validate(session) for session in sessions]
