from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationResponse, NotificationWithSenderResponse,
    NotificationListResponse, NotificationCountResponse,
    NotificationMarkReadRequest
)
from app.core.notification import notification_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的通知列表"""
    result = notification_service.get_user_notifications(
        db=db,
        user_id=str(current_user.id),
        page=page,
        page_size=page_size,
        unread_only=unread_only
    )
    
    # 添加发送者信息
    data = []
    for notification in result["data"]:
        item = NotificationWithSenderResponse.model_validate(notification)
        if notification.sender:
            item.sender_username = notification.sender.username
        data.append(item)
    
    return NotificationListResponse(
        data=data,
        total=result["total"],
        unread_count=result["unread_count"],
        page=result["page"],
        page_size=result["page_size"]
    )


@router.get("/count", response_model=NotificationCountResponse)
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取通知数量统计"""
    total = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_deleted == False
    ).count()
    
    unread = notification_service.get_unread_count(
        db=db,
        user_id=str(current_user.id)
    )
    
    return NotificationCountResponse(total=total, unread=unread)


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记单个通知为已读"""
    success = notification_service.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=str(current_user.id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在"
        )
    
    return {"success": True}


@router.put("/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记所有通知为已读"""
    count = notification_service.mark_all_as_read(
        db=db,
        user_id=str(current_user.id)
    )
    
    return {"success": True, "marked_count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除通知"""
    success = notification_service.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=str(current_user.id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在"
        )
    
    return {"success": True}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取未读通知数量（用于轮询）"""
    count = notification_service.get_unread_count(
        db=db,
        user_id=str(current_user.id)
    )
    
    return {"unread_count": count}
