from sqlalchemy import Column, ForeignKey, Text, DateTime, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel


class Comment(BaseModel):
    __tablename__ = "comments"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    
    # 嵌套回复相关字段
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    record = relationship("Record", back_populates="comments")
    user = relationship("User", back_populates="comments", foreign_keys=[user_id])
    parent = relationship("Comment", back_populates="replies", remote_side="Comment.id")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    reply_to_user = relationship("User", foreign_keys=[reply_to_user_id])
    mentions = relationship("Mention", back_populates="comment", cascade="all, delete-orphan")
