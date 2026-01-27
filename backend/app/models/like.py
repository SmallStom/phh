from sqlalchemy import Column, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel


class Like(BaseModel):
    __tablename__ = "likes"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    record = relationship("Record", back_populates="likes")
    user = relationship("User", back_populates="likes")
    
    __table_args__ = (
        Index('ix_likes_record_user', 'record_id', 'user_id', unique=True),
    )
