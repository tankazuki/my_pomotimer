"""日次集計関連のルーター。ロジックは services/ に置く。"""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_guest
from app.db import get_db
from app.models import GuestProfile
from app.schemas.stats import DailyStatsResponse, DayDetailResponse
from app.services import stats as stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])

MAX_RANGE_DAYS = 92
_TZ_OFFSET_MIN = -840
_TZ_OFFSET_MAX = 840


@router.get("/daily", response_model=DailyStatsResponse)
def get_daily_stats(
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
    start_date: date,
    end_date: date,
    tz_offset_minutes: Annotated[int, Query(ge=_TZ_OFFSET_MIN, le=_TZ_OFFSET_MAX)] = 0,
) -> DailyStatsResponse:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must not be earlier than start_date",
        )
    if (end_date - start_date).days + 1 > MAX_RANGE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"date range must be at most {MAX_RANGE_DAYS} days",
        )
    return stats_service.get_daily_stats(
        db, guest.id, start_date, end_date, tz_offset_minutes
    )


@router.get("/day/{target_date}", response_model=DayDetailResponse)
def get_day_detail(
    target_date: date,
    db: Annotated[Session, Depends(get_db)],
    guest: Annotated[GuestProfile, Depends(get_guest)],
    tz_offset_minutes: Annotated[int, Query(ge=_TZ_OFFSET_MIN, le=_TZ_OFFSET_MAX)] = 0,
) -> DayDetailResponse:
    return stats_service.get_day_detail(db, guest.id, target_date, tz_offset_minutes)
