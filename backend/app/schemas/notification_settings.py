from pydantic import BaseModel
from uuid import UUID


class NotificationSettingsBase(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    like_enabled: bool = True
    comment_enabled: bool = True
    follow_enabled: bool = True
    mention_enabled: bool = True


class NotificationSettingsCreate(NotificationSettingsBase):
    pass


class NotificationSettingsUpdate(NotificationSettingsBase):
    pass


class NotificationSettingsResponse(NotificationSettingsBase):
    user_id: UUID
    
    class Config:
        from_attributes = True