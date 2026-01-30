from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FollowBase(BaseModel):
    pass


class FollowCreate(BaseModel):
    following_id: str


class FollowResponse(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FollowUserInfo(BaseModel):
    id: str
    username: str
    
    class Config:
        from_attributes = True


class FollowWithUserResponse(BaseModel):
    id: str
    follower_id: str
    following_id: str
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
