from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Tag(BaseModel):
    __tablename__ = "tags"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    color = Column(String(7))
    
    tenant = relationship("Tenant", back_populates="tags")
    content_tags = relationship("ContentTag", back_populates="tag", cascade="all, delete-orphan")
