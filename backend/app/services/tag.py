"""タグに関するビジネスロジック。"""

import uuid

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Tag
from app.models.task_tag import task_tags
from app.schemas.tag import TagRead


def _find_tag(db: Session, user_id: uuid.UUID, normalized_name: str) -> Tag | None:
    stmt = select(Tag).where(
        Tag.user_id == user_id, Tag.normalized_name == normalized_name
    )
    return db.scalars(stmt).first()


def _get_or_create_tag(db: Session, user_id: uuid.UUID, name: str) -> Tag:
    """タグをget-or-createする。同時リクエストによるUniqueConstraint違反は再取得で吸収する。"""
    stripped_name = name.strip()
    normalized_name = stripped_name.lower()

    existing = _find_tag(db, user_id, normalized_name)
    if existing is not None:
        return existing

    tag = Tag(user_id=user_id, name=stripped_name, normalized_name=normalized_name)
    db.add(tag)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = _find_tag(db, user_id, normalized_name)
        if existing is None:
            raise
        return existing
    db.refresh(tag)
    return tag


def resolve_tags(db: Session, user_id: uuid.UUID, names: list[str]) -> list[Tag]:
    """タグ名のリストを取得または作成する。

    大文字小文字ゆれ (strip + lower) を含む重複は最初の1件だけを採用する。
    """
    tags: list[Tag] = []
    seen_normalized: set[str] = set()
    for raw_name in names:
        normalized_name = raw_name.strip().lower()
        if normalized_name in seen_normalized:
            continue
        seen_normalized.add(normalized_name)
        tags.append(_get_or_create_tag(db, user_id, raw_name))
    return tags


def list_tags(
    db: Session, user_id: uuid.UUID, *, q: str | None, limit: int
) -> list[TagRead]:
    """usage_count降順→name昇順でタグ一覧を返す。

    qが指定されていれば部分一致 (大文字小文字無視) で絞り込む。
    """
    stmt = select(Tag).where(Tag.user_id == user_id)
    if q:
        stmt = stmt.where(Tag.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Tag.usage_count.desc(), Tag.name.asc()).limit(limit)
    tags = db.scalars(stmt).all()
    return [TagRead.model_validate(tag) for tag in tags]


def delete_tag(db: Session, user_id: uuid.UUID, tag_id: uuid.UUID) -> bool:
    """タグを削除する。存在しない/他ゲストのものであれば何もせずFalseを返す。"""
    tag = db.scalars(
        select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
    ).first()
    if tag is None:
        return False

    db.execute(delete(task_tags).where(task_tags.c.tag_id == tag_id))
    db.delete(tag)
    db.commit()
    return True
