from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ContentTag(BaseModel):
    __tablename__ = "content_tags"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(String(50), nullable=False)
    content_id = Column(UUID(as_uuid=True), nullable=False)
    
    tag = relationship("Tag", back_populates="content_tags")
