from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class FollowBase(BaseModel):
    pass


class FollowCreate(BaseModel):
    following_id: str


class FollowResponse(BaseModel):
    id: UUID
    follower_id: UUID
    following_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class FollowUserInfo(BaseModel):
    id: UUID
    username: str
    
    class Config:
        from_attributes = True


class FollowWithUserResponse(BaseModel):
    id: UUID
    follower_id: UUID
    following_id: UUID
    created_at: datetime
    follower: Optional[FollowUserInfo] = None
    following: Optional[FollowUserInfo] = None
    
    class Config:
        from_attributes = True


class FollowStats(BaseModel):
    following_count: int
    followers_count: int
    is_following: bool = False


class FollowListResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int
