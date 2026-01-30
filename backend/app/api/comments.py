from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.record import Record
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse, CommentListResponse
from app.core.notification import notification_service
from app.core.analytics import analytics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/records", tags=["comments"])


@router.post("/{record_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    record_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).options(
        joinedload(Record.user)
    ).filter(
        Record.id == record_id,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not public"
        )
    
    comment = Comment(
        tenant_id=current_user.tenant_id,
        record_id=record_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # 更新热门排行
    analytics_service._update_hot_ranking("record", record_id, 3)
    
    # 发送站内通知
    try:
        if record.user and record.user.id != current_user.id:
            notification_service.notify_comment(
                db=db,
                recipient_id=str(record.user.id),
                sender_id=str(current_user.id),
                sender_name=current_user.username,
                content_type="记录",
                content_title=record.title or "无标题",
                comment_content=comment_data.content,
                content_id=record_id
            )
    except Exception as e:
        logger.error(f"Failed to create comment notification: {e}")
    
    return CommentResponse.model_validate(comment)


@router.get("/{record_id}/comments", response_model=CommentListResponse)
async def get_comments(
    record_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not public"
        )
    
    query = db.query(Comment).options(
        joinedload(Comment.user)
    ).filter(
        Comment.record_id == record_id
    )
    
    total = query.count()
    comments = query.order_by(Comment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return CommentListResponse(
        data=[CommentResponse.model_validate(comment) for comment in comments],
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == current_user.id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    db.delete(comment)
    db.commit()
    
    return None
