"""ゲストプロフィールの入出力スキーマ。"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GuestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
