from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Integer, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class CollectionType(str, enum.Enum):
    ARTICLE = "article"
    VIDEO = "video"
    BOOK = "book"
    TOOL = "tool"
    RESOURCE = "resource"
    RECORD = "record"
    EXPERIENCE = "experience"


class Collection(BaseModel):
    __tablename__ = "collections"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    url = Column(String(500))
    content_type = Column(String(50), index=True)
    content_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    content_data = Column(JSON, nullable=True)
    tags = Column(ARRAY(String))
    is_favorite = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    
    tenant = relationship("Tenant", back_populates="collections")
    user = relationship("User", back_populates="collections")
