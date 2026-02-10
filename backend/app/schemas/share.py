from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class ShareBase(BaseModel):
    content_type: str
    content_id: UUID
    platform: str


class ShareCreate(ShareBase):
    pass


class ShareResponse(ShareBase):
    id: UUID
    user_id: UUID
    share_count: int
    last_shared_at: datetime
    
    class Config:
        from_attributes = True


class ShareStats(BaseModel):
    content_type: str
    content_id: UUID
    total_shares: int
    platform_stats: dict


class ShareUrlResponse(BaseModel):
    url: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None