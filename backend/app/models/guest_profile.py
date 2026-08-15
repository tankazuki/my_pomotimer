"""ゲストプロフィールモデル。"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class GuestProfile(Base):
    """認証を持たないゲスト識別子 (localStorageのUUID) に対応するレコード。"""

    __tablename__ = "guest_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
