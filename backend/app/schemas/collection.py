from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.models.collection import CollectionType


class CollectionBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    content_type: Optional[CollectionType] = None
    content_id: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []
    is_favorite: bool = False
    is_public: bool = False
    
    class Config:
        use_enum_values = True


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    content_type: Optional[CollectionType] = None
    content_id: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_public: Optional[bool] = None


class CollectionResponse(CollectionBase):
    id: str
    tenant_id: str
    user_id: str
    order_index: int
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
    
    @field_validator('id', 'tenant_id', 'user_id', 'content_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class CollectionListResponse(BaseModel):
    data: List[CollectionResponse]
    total: int
    page: int
    page_size: int
