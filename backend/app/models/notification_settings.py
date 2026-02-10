from sqlalchemy import Column, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class NotificationSettings(BaseModel):
    __tablename__ = "notification_settings"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True, primary_key=True)
    
    # 通知方式
    email_enabled = Column(Boolean, default=True, nullable=False)
    push_enabled = Column(Boolean, default=True, nullable=False)
    
    # 通知类型
    like_enabled = Column(Boolean, default=True, nullable=False)
    comment_enabled = Column(Boolean, default=True, nullable=False)
    follow_enabled = Column(Boolean, default=True, nullable=False)
    mention_enabled = Column(Boolean, default=True, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="notification_settings")
    
    __table_args__ = (
        UniqueConstraint('user_id', name='unique_user_notification_settings'),
    )