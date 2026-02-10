from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.mention import Mention
from app.schemas.mention import MentionListResponse, MentionResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mentions", tags=["mentions"])


@router.get("", response_model=MentionListResponse)
async def get_mentions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的提及通知列表"""
    query = db.query(Mention).filter(
        Mention.recipient_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(Mention.is_read == False)
    
    total = query.count()
    
    mentions = query.order_by(
        desc(Mention.created_at)
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    data = []
    for mention in mentions:
        response_data = {
            "id": mention.id,
            "sender_id": mention.sender_id,
            "recipient_id": mention.recipient_id,
            "content_type": mention.content_type,
            "content_id": mention.content_id,
            "comment_id": mention.comment_id,
            "is_read": mention.is_read,
            "created_at": mention.created_at,
            "sender_username": mention.sender.username if mention.sender else None,
            "sender_avatar": mention.sender.avatar if mention.sender else None,
        }
        data.append(MentionResponse(**response_data))
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/unread-count")
async def get_unread_mention_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取未读提及通知数量"""
    count = db.query(Mention).filter(
        Mention.recipient_id == current_user.id,
        Mention.is_read == False
    ).count()
    
    return {"count": count}


@router.post("/{mention_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_mention_as_read(
    mention_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记提及为已读"""
    mention = db.query(Mention).filter(
        Mention.id == mention_id,
        Mention.recipient_id == current_user.id
    ).first()
    
    if not mention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention not found"
        )
    
    mention.is_read = True
    db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_mentions_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记所有提及为已读"""
    db.query(Mention).filter(
        Mention.recipient_id == current_user.id,
        Mention.is_read == False
    ).update({"is_read": True})
    db.commit()
