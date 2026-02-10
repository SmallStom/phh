from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class MentionBase(BaseModel):
    recipient_id: UUID
    content_type: str
    content_id: UUID


class MentionCreate(MentionBase):
    pass


class MentionResponse(MentionBase):
    id: UUID
    sender_id: UUID
    comment_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime
    sender_username: Optional[str] = None
    sender_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class MentionListResponse(BaseModel):
    data: list[MentionResponse]
    total: int
    page: int
    page_size: int
