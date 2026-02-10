from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationType(str, Enum):
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    COLLECT = "collect"
    MENTION = "mention"
    SYSTEM = "system"


class NotificationBase(BaseModel):
    pass


class NotificationCreate(BaseModel):
    recipient_id: str
    type: NotificationType
    title: str
    content: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    sender_id: Optional[str] = None
    type: NotificationType
    title: str
    content: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    comment_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def model_validate(cls, obj):
        # 将 UUID 转换为字符串
        data = {
            "id": str(obj.id),
            "recipient_id": str(obj.recipient_id),
            "sender_id": str(obj.sender_id) if obj.sender_id else None,
            "type": obj.type,
            "title": obj.title,
            "content": obj.content,
            "resource_type": obj.resource_type,
            "resource_id": str(obj.resource_id) if obj.resource_id else None,
            "comment_id": str(obj.comment_id) if obj.comment_id else None,
            "is_read": obj.is_read,
            "created_at": obj.created_at,
        }
        return cls(**data)


class NotificationWithSenderResponse(NotificationResponse):
    sender_username: Optional[str] = None
    sender_avatar: Optional[str] = None


class NotificationListResponse(BaseModel):
    data: list
    total: int
    unread_count: int
    page: int
    page_size: int


class NotificationCountResponse(BaseModel):
    total: int
    unread: int


class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[list] = None  # 不传则标记所有为已读
