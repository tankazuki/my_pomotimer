"""ゲストプロフィールに関するビジネスロジック。"""

import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models import GuestProfile


def get_or_create_guest(db: Session, guest_id: uuid.UUID) -> GuestProfile:
    """指定IDのゲストプロフィールを取得する。無ければ新規作成する。

    DBリセットやエクスポートからの復元後も、既知のUUIDでリクエストされれば
    そのまま使えるようにするための仕様。
    """
    guest = db.get(GuestProfile, guest_id)
    if guest is not None:
        return guest

    guest = GuestProfile(id=guest_id, created_at=datetime.now(UTC))
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


def create_guest(db: Session) -> GuestProfile:
    """新規ゲストプロフィールを作成する (POST /api/guest 用)。"""
    guest = GuestProfile(id=uuid.uuid4(), created_at=datetime.now(UTC))
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest
