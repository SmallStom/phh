from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional, List
from app.models.record import RecordStatus, RecordType


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


class RecordBase(BaseModel):
    title: Optional[str] = None
    content: str
    status: RecordStatus = RecordStatus.DRAFT
    record_type: RecordType = RecordType.NOTE
    parent_id: Optional[str] = None
    is_public: bool = False
    image_urls: Optional[List[str]] = []
    
    class Config:
        use_enum_values = True


class RecordCreate(RecordBase):
    tags: Optional[List[str]] = []


class RecordUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[RecordStatus] = None
    record_type: Optional[RecordType] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class RecordResponse(RecordBase):
    id: str
    tenant_id: str
    user_id: str
    user: Optional[UserInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    tags: List[str] = []
    image_urls: List[str] = []
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    
    @field_validator('image_urls', mode='before')
    @classmethod
    def validate_image_urls(cls, v):
        if v is None:
            return []
        return v
    
    @field_serializer('created_at', 'updated_at', 'published_at')
    @classmethod
    def serialize_datetime(cls, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    @field_validator('id', 'tenant_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class RecordListResponse(BaseModel):
    data: List[RecordResponse]
    total: int
    page: int
    page_size: int
