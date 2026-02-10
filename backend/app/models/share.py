from sqlalchemy import Column, ForeignKey, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel


class Share(BaseModel):
    __tablename__ = "shares"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(50), nullable=False)  # record, experience, collection
    content_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # wechat, weibo, link, etc.
    share_count = Column(Integer, default=1)
    last_shared_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="shares")
    
    __table_args__ = (
        {'schema': None},
    )
