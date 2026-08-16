"""タスクの入出力スキーマ。"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.tag import TagRead

MAX_TAGS_PER_TASK = 10
TAG_NAME_MIN_LENGTH = 1
TAG_NAME_MAX_LENGTH = 32


def _validate_tag_names(value: list[str] | None) -> list[str] | None:
    """タグ名リストの共通バリデーション (作成/更新の両スキーマで使う)。"""
    if value is None:
        return None
    if len(value) > MAX_TAGS_PER_TASK:
        raise ValueError(f"tags must contain at most {MAX_TAGS_PER_TASK} items")
    for name in value:
        stripped = name.strip()
        if not (TAG_NAME_MIN_LENGTH <= len(stripped) <= TAG_NAME_MAX_LENGTH):
            raise ValueError(
                "each tag must be between "
                f"{TAG_NAME_MIN_LENGTH} and {TAG_NAME_MAX_LENGTH} characters"
            )
    return value


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    estimated_pomodoros: int = Field(default=1, ge=1, le=99)
    due_date: date | None = None
    tags: list[str] | None = None

    @field_validator("tags")
    @classmethod
    def _check_tags(cls, value: list[str] | None) -> list[str] | None:
        return _validate_tag_names(value)


class TaskUpdate(BaseModel):
    # completed_pomodoros はサーバー側 (POST /api/sessions) のみが更新できる。
    # 二重カウント防止のため、このスキーマには含めない。
    title: str | None = Field(default=None, min_length=1, max_length=255)
    estimated_pomodoros: int | None = Field(default=None, ge=1, le=99)
    is_completed: bool | None = None
    # None=クリア、キー未指定=変更なし (exclude_unsetで判定する)。
    due_date: date | None = None
    # 指定時は全置換、[]で全解除。キー未指定なら変更しない。
    tags: list[str] | None = None

    @field_validator("tags")
    @classmethod
    def _check_tags(cls, value: list[str] | None) -> list[str] | None:
        return _validate_tag_names(value)


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    estimated_pomodoros: int
    completed_pomodoros: int
    is_completed: bool
    due_date: date | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead]
