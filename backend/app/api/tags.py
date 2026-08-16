"""タグ関連のルーター。ロジックは services/ に置く。"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_guest
from app.db import get_db
from app.models import GuestProfile
from app.schemas.tag import TagRead
from app.services import tag as tag_service

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
def list_tags(
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[TagRead]:
    return tag_service.list_tags(db, guest.id, q=q, limit=limit)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> None:
    deleted = tag_service.delete_tag(db, guest.id, tag_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )
