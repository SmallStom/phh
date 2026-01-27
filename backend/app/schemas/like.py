from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional


class LikeResponse(BaseModel):
    id: str
    tenant_id: str
    record_id: str
    user_id: str
    created_at: datetime
    
    @field_serializer('created_at')
    @classmethod
    def serialize_datetime(cls, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    @field_validator('id', 'tenant_id', 'record_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class LikeStatusResponse(BaseModel):
    is_liked: bool
    like_count: int
