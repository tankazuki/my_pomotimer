"""エクスポート関連のルーター。ロジックは services/ に置く。"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_guest
from app.db import get_db
from app.models import GuestProfile
from app.schemas.export import ExportPayload
from app.services.export import build_export

router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export", response_model=ExportPayload)
def export_data(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
) -> ExportPayload:
    payload = build_export(db, guest)
    filename = f"pomodoro-export-{datetime.now(UTC):%Y%m%d}.json"
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return payload
