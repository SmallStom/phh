from sqlalchemy import Column, ForeignKey, Text, DateTime, Index
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
    
    record = relationship("Record", back_populates="comments")
    user = relationship("User", back_populates="comments")
