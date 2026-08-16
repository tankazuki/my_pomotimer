"""日次集計に関するビジネスロジック。"""

import uuid
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import PomodoroSession, SessionStatus, SessionType, Task
from app.schemas.stats import (
    DailyStat,
    DailyStatsResponse,
    DailyTaskBreakdown,
    DayDetailResponse,
    DaySessionRead,
)
from app.schemas.task import TaskRead

# セッションの取得範囲を広めに取るための日数。
# タイムゾーン変換で日付がずれても取りこぼさないようにするための余裕。
_QUERY_MARGIN_DAYS = 1


def _as_utc(dt: datetime) -> datetime:
    """DBから読んだdatetimeをUTC awareに正規化する。

    SQLiteはnaive datetimeを返しうるため、tzinfoがなければUTCとみなす
    (アプリはUTCで保存する運用のため)。タイムゾーン変換はこの関数の
    結果を経由してのみ行う。
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def _local_date(dt: datetime, tz_offset_minutes: int) -> date:
    """UTCのdatetimeを指定オフセット分ずらしたローカル日付に変換する。"""
    return (_as_utc(dt) + timedelta(minutes=tz_offset_minutes)).date()


def _date_range(start: date, end: date) -> Iterator[date]:
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


@dataclass
class _TaskBucket:
    title: str | None
    work_minutes: int = 0
    completed_sessions: int = 0


@dataclass
class _DayBucket:
    work_minutes: int = 0
    break_minutes: int = 0
    completed_work_sessions: int = 0
    interrupted_work_sessions: int = 0
    task_stats: dict[uuid.UUID | None, _TaskBucket] = field(default_factory=dict)


def _accumulate_session(
    bucket: _DayBucket, session: PomodoroSession, title: str | None
) -> None:
    if session.session_type != SessionType.WORK:
        bucket.break_minutes += session.duration_minutes
        return

    bucket.work_minutes += session.duration_minutes
    if session.status == SessionStatus.COMPLETED:
        bucket.completed_work_sessions += 1
    else:
        bucket.interrupted_work_sessions += 1

    task_bucket = bucket.task_stats.setdefault(
        session.task_id, _TaskBucket(title=title)
    )
    task_bucket.work_minutes += session.duration_minutes
    if session.status == SessionStatus.COMPLETED:
        task_bucket.completed_sessions += 1


def _task_breakdown(bucket: _DayBucket) -> list[DailyTaskBreakdown]:
    tasks = [
        DailyTaskBreakdown(
            task_id=task_id,
            title=task_bucket.title,
            work_minutes=task_bucket.work_minutes,
            completed_sessions=task_bucket.completed_sessions,
        )
        for task_id, task_bucket in bucket.task_stats.items()
    ]
    tasks.sort(key=lambda t: t.work_minutes, reverse=True)
    return tasks


def _task_titles(
    db: Session, user_id: uuid.UUID, task_ids: set[uuid.UUID]
) -> dict[uuid.UUID, str]:
    if not task_ids:
        return {}
    stmt = select(Task.id, Task.title).where(
        Task.user_id == user_id, Task.id.in_(task_ids)
    )
    return {row.id: row.title for row in db.execute(stmt)}


def _query_sessions(
    db: Session, user_id: uuid.UUID, query_start: datetime, query_end: datetime
) -> list[PomodoroSession]:
    stmt = (
        select(PomodoroSession)
        .where(PomodoroSession.user_id == user_id)
        .where(PomodoroSession.started_at >= query_start)
        .where(PomodoroSession.started_at < query_end)
        .order_by(PomodoroSession.started_at)
    )
    return list(db.scalars(stmt))


def _due_task_counts(
    db: Session, user_id: uuid.UUID, start_date: date, end_date: date
) -> dict[date, int]:
    stmt = (
        select(Task.due_date, func.count(Task.id))
        .where(
            Task.user_id == user_id,
            Task.due_date.is_not(None),
            Task.due_date >= start_date,
            Task.due_date <= end_date,
        )
        .group_by(Task.due_date)
    )
    return {row[0]: row[1] for row in db.execute(stmt)}


def get_daily_stats(
    db: Session,
    user_id: uuid.UUID,
    start_date: date,
    end_date: date,
    tz_offset_minutes: int,
) -> DailyStatsResponse:
    """指定期間 (ローカル日付) の日次集計を返す。期間内の全日を0埋めで含む。"""
    query_start = datetime.combine(
        start_date - timedelta(days=_QUERY_MARGIN_DAYS), time.min, tzinfo=UTC
    )
    query_end = datetime.combine(
        end_date + timedelta(days=_QUERY_MARGIN_DAYS + 1), time.min, tzinfo=UTC
    )
    sessions = _query_sessions(db, user_id, query_start, query_end)

    task_ids = {s.task_id for s in sessions if s.task_id is not None}
    titles = _task_titles(db, user_id, task_ids)

    buckets: dict[date, _DayBucket] = {
        d: _DayBucket() for d in _date_range(start_date, end_date)
    }
    for session in sessions:
        local_day = _local_date(session.started_at, tz_offset_minutes)
        bucket = buckets.get(local_day)
        if bucket is None:
            # 広めに取得した範囲のうち、対象期間外に落ちたセッションは無視する。
            continue
        title = titles.get(session.task_id) if session.task_id is not None else None
        _accumulate_session(bucket, session, title)

    due_counts = _due_task_counts(db, user_id, start_date, end_date)

    days = [
        DailyStat(
            date=d,
            work_minutes=buckets[d].work_minutes,
            break_minutes=buckets[d].break_minutes,
            completed_work_sessions=buckets[d].completed_work_sessions,
            interrupted_work_sessions=buckets[d].interrupted_work_sessions,
            due_task_count=due_counts.get(d, 0),
            tasks=_task_breakdown(buckets[d]),
        )
        for d in _date_range(start_date, end_date)
    ]

    totals = {
        "work_minutes": sum(day.work_minutes for day in days),
        "completed_work_sessions": sum(day.completed_work_sessions for day in days),
        "active_days": sum(1 for day in days if day.work_minutes > 0),
    }

    return DailyStatsResponse(
        start_date=start_date,
        end_date=end_date,
        tz_offset_minutes=tz_offset_minutes,
        totals=totals,
        days=days,
    )


def get_day_detail(
    db: Session,
    user_id: uuid.UUID,
    target_date: date,
    tz_offset_minutes: int,
) -> DayDetailResponse:
    """指定ローカル日付1日分のセッション明細と、その日が締切のタスクを返す。"""
    query_start = datetime.combine(
        target_date - timedelta(days=_QUERY_MARGIN_DAYS), time.min, tzinfo=UTC
    )
    query_end = datetime.combine(
        target_date + timedelta(days=_QUERY_MARGIN_DAYS + 1), time.min, tzinfo=UTC
    )
    all_sessions = _query_sessions(db, user_id, query_start, query_end)
    day_sessions = [
        s
        for s in all_sessions
        if _local_date(s.started_at, tz_offset_minutes) == target_date
    ]
    day_sessions.sort(key=lambda s: s.started_at)

    task_ids = {s.task_id for s in day_sessions if s.task_id is not None}
    titles = _task_titles(db, user_id, task_ids)

    bucket = _DayBucket()
    for session in day_sessions:
        title = titles.get(session.task_id) if session.task_id is not None else None
        _accumulate_session(bucket, session, title)

    sessions_read = [
        DaySessionRead(
            id=s.id,
            task_id=s.task_id,
            user_id=s.user_id,
            session_type=s.session_type,
            duration_minutes=s.duration_minutes,
            status=s.status,
            started_at=s.started_at,
            ended_at=s.ended_at,
            task_title=titles.get(s.task_id) if s.task_id is not None else None,
        )
        for s in day_sessions
    ]

    due_tasks = list(
        db.scalars(
            select(Task)
            .where(Task.user_id == user_id, Task.due_date == target_date)
            .order_by(Task.created_at)
        )
    )

    return DayDetailResponse(
        date=target_date,
        tz_offset_minutes=tz_offset_minutes,
        work_minutes=bucket.work_minutes,
        sessions=sessions_read,
        worked_tasks=_task_breakdown(bucket),
        due_tasks=[TaskRead.model_validate(t) for t in due_tasks],
    )
