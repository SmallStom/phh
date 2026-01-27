from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime, date, timezone
from typing import Optional, List
from app.models.experience import ExperienceCategory


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


class ExperienceBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    category: Optional[ExperienceCategory] = None
    tags: Optional[List[str]] = []
    source_record_id: Optional[str] = None
    is_public: bool = False
    
    class Config:
        use_enum_values = True


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    category: Optional[ExperienceCategory] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class ExperienceResponse(ExperienceBase):
    id: str
    tenant_id: str
    user_id: str
    user: Optional[UserInfo] = None
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
    
    @field_validator('id', 'tenant_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class ExperienceListResponse(BaseModel):
    data: List[ExperienceResponse]
    total: int
    page: int
    page_size: int
