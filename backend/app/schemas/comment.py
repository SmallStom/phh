from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional, List


class UserInfo(BaseModel):
    id: str
    username: str
    email: str
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None  # 回复哪条评论
    reply_to_user_id: Optional[str] = None  # 回复给哪个用户


class CommentResponse(BaseModel):
    id: str
    tenant_id: str
    record_id: str
    user_id: str
    user: Optional[UserInfo] = None
    content: str
    parent_id: Optional[str] = None
    reply_to_user_id: Optional[str] = None
    reply_to_user: Optional[UserInfo] = None  # 回复给哪个用户
    replies: List['CommentResponse'] = []  # 嵌套回复
    reply_count: int = 0  # 回复数量
    is_deleted: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at')
    @classmethod
    def serialize_datetime(cls, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    @field_validator('id', 'tenant_id', 'record_id', 'user_id', 'parent_id', 'reply_to_user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


# 解决循环引用
CommentResponse.model_rebuild()


class CommentListResponse(BaseModel):
    data: List[CommentResponse]
    total: int
    page: int
    page_size: int
