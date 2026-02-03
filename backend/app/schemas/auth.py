from pydantic import BaseModel, EmailStr, field_validator, field_serializer
from datetime import datetime, timezone
from typing import Optional
from app.models.user import UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    tenant_slug: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: str
    role: UserRole
    created_at: datetime
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    
    @field_serializer('created_at')
    @classmethod
    def serialize_datetime(cls, dt: datetime) -> str:
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class UserProfileResponse(UserResponse):
    followers_count: int = 0
    following_count: int = 0
    records_count: int = 0
    experiences_count: int = 0
    collections_count: int = 0
    likes_received: int = 0
    comments_received: int = 0


class Token(BaseModel):
    token: str
    user: UserResponse
    tenant: TenantResponse
