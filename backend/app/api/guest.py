"""ゲストプロフィール関連のルーター。ロジックは services/ に置く。"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.guest import GuestRead
from app.services.guest import create_guest

router = APIRouter(prefix="/api", tags=["guest"])


@router.post("/guest", response_model=GuestRead, status_code=status.HTTP_201_CREATED)
def create_guest_profile(db: Annotated[Session, Depends(get_db)]) -> GuestRead:
    guest = create_guest(db)
    return GuestRead.model_validate(guest)
