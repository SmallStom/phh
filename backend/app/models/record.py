from sqlalchemy import Column, String, Text, ForeignKey, Boolean, DateTime, Enum as SQLEnum, and_, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import enum
from app.models.base import BaseModel


class RecordStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class RecordType(str, enum.Enum):
    NOTE = "note"
    IDEA = "idea"
    LOG = "log"


class Record(BaseModel):
    __tablename__ = "records"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200))
    content = Column(Text, nullable=False)
    status = Column(SQLEnum(RecordStatus), default=RecordStatus.DRAFT, index=True)
    record_type = Column(SQLEnum(RecordType), default=RecordType.NOTE, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("records.id"))
    is_public = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    image_urls = Column(ARRAY(String), default=list)  # 图片URL数组
    
    tenant = relationship("Tenant", back_populates="records")
    user = relationship("User", back_populates="records")
    parent = relationship("Record", remote_side="Record.id")
    children = relationship("Record", back_populates="parent")
    content_tags = relationship(
        "ContentTag", 
        cascade="all, delete-orphan",
        primaryjoin="and_(Record.id == foreign(ContentTag.content_id), ContentTag.content_type == 'record')"
    )
    likes = relationship("Like", back_populates="record", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="record", cascade="all, delete-orphan")
    
    @property
    def tags(self):
        return [ct.tag.name for ct in self.content_tags]
    
    @property
    def like_count(self):
        return len(self.likes)
    
    @property
    def comment_count(self):
        return len(self.comments)
