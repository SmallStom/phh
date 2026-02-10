from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.record import Record
from app.models.like import Like
from app.schemas.like import LikeResponse, LikeStatusResponse
from app.core.notification import notification_service
from app.core.analytics import analytics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/records", tags=["likes"])


@router.post("/{record_id}/like", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
async def like_record(
    record_id: str,
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
    
    existing_like = db.query(Like).filter(
        Like.record_id == record_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this record"
        )
    
    like = Like(
        tenant_id=current_user.tenant_id,
        record_id=record_id,
        user_id=current_user.id
    )
    
    db.add(like)
    db.commit()
    db.refresh(like)
    
    # 更新热门排行
    analytics_service._update_hot_ranking("record", record_id, 2)
    
    # 发送站内通知
    try:
        if record.user and record.user.id != current_user.id:
            notification_service.notify_like(
                db=db,
                recipient_id=str(record.user.id),
                sender_id=str(current_user.id),
                sender_name=current_user.username,
                content_type="记录",
                content_title=record.title or "无标题",
                content_id=record_id
            )
    except Exception as e:
        logger.error(f"Failed to create like notification: {e}")
    
    return LikeResponse.model_validate(like)


@router.delete("/{record_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    like = db.query(Like).filter(
        Like.record_id == record_id,
        Like.user_id == current_user.id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found"
        )
    
    db.delete(like)
    db.commit()
    
    return None


@router.get("/{record_id}/like/status", response_model=LikeStatusResponse)
async def get_like_status(
    record_id: str,
    current_user: User = Depends(get_current_user),
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
    
    existing_like = db.query(Like).filter(
        Like.record_id == record_id,
        Like.user_id == current_user.id
    ).first()
    
    like_count = db.query(Like).filter(
        Like.record_id == record_id
    ).count()
    
    return LikeStatusResponse(
        is_liked=existing_like is not None,
        like_count=like_count
    )


@router.get("/public/{record_id}/like/status", response_model=LikeStatusResponse)
async def get_public_like_status(
    record_id: str,
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
    
    like_count = db.query(Like).filter(
        Like.record_id == record_id
    ).count()
    
    return LikeStatusResponse(
        is_liked=False,
        like_count=like_count
    )


@router.get("/my/likes", response_model=dict)
async def get_my_likes(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户喜欢的记录列表"""
    from app.schemas.record import RecordResponse
    
    # 查询用户喜欢的记录
    likes_query = db.query(Like).filter(
        Like.user_id == current_user.id
    ).order_by(Like.created_at.desc())
    
    total = likes_query.count()
    likes = likes_query.offset((page - 1) * page_size).limit(page_size).all()
    
    # 获取记录详情
    record_ids = [like.record_id for like in likes]
    records = db.query(Record).filter(
        Record.id.in_(record_ids),
        Record.is_public == True
    ).all()
    
    # 构建响应
    record_map = {str(r.id): r for r in records}
    result = []
    for like in likes:
        record = record_map.get(str(like.record_id))
        if record:
            record_data = RecordResponse.model_validate(record)
            result.append({
                "like_id": str(like.id),
                "liked_at": like.created_at.isoformat(),
                "record": record_data
            })
    
    return {
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }
