from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification_settings import NotificationSettings
from app.schemas.notification_settings import (
    NotificationSettingsCreate,
    NotificationSettingsUpdate,
    NotificationSettingsResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notification-settings", tags=["notification-settings"])


@router.get("", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的通知设置"""
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = NotificationSettings(
            user_id=current_user.id,
            email_enabled=True,
            push_enabled=True,
            like_enabled=True,
            comment_enabled=True,
            follow_enabled=True,
            mention_enabled=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return NotificationSettingsResponse.model_validate(settings)


@router.put("", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前用户的通知设置"""
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = NotificationSettings(
            user_id=current_user.id,
            email_enabled=settings_update.email_enabled,
            push_enabled=settings_update.push_enabled,
            like_enabled=settings_update.like_enabled,
            comment_enabled=settings_update.comment_enabled,
            follow_enabled=settings_update.follow_enabled,
            mention_enabled=settings_update.mention_enabled
        )
        db.add(settings)
    else:
        settings.email_enabled = settings_update.email_enabled
        settings.push_enabled = settings_update.push_enabled
        settings.like_enabled = settings_update.like_enabled
        settings.comment_enabled = settings_update.comment_enabled
        settings.follow_enabled = settings_update.follow_enabled
        settings.mention_enabled = settings_update.mention_enabled
    
    db.commit()
    db.refresh(settings)
    
    logger.info(f"User {current_user.id} updated notification settings")
    
    return NotificationSettingsResponse.model_validate(settings)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def reset_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重置当前用户的通知设置为默认值"""
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if settings:
        settings.email_enabled = True
        settings.push_enabled = True
        settings.like_enabled = True
        settings.comment_enabled = True
        settings.follow_enabled = True
        settings.mention_enabled = True
        
        db.commit()
    
    return None