"""ルーター共通の依存性 (Guest識別)。"""

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import GuestProfile
from app.services.guest import get_or_create_guest


def get_guest(
    db: Annotated[Session, Depends(get_db)],
    x_guest_id: Annotated[str | None, Header(alias="X-Guest-ID")] = None,
) -> GuestProfile:
    """X-Guest-ID ヘッダーからゲストを解決する。

    認証ではなく識別子のため、有効なUUIDだが未登録の場合はその場で登録する
    (DBリセットやエクスポートからの復元でも動くようにするための仕様)。
    """
    if x_guest_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Guest-ID header is required",
        )

    try:
        guest_id = uuid.UUID(x_guest_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Guest-ID must be a valid UUID",
        ) from None

    return get_or_create_guest(db, guest_id)
