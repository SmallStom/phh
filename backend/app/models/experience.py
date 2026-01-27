from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Integer, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class ExperienceCategory(str, enum.Enum):
    WORK = "work"
    PROJECT = "project"
    EDUCATION = "education"
    MILESTONE = "milestone"


class Experience(BaseModel):
    __tablename__ = "experiences"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    category = Column(SQLEnum(ExperienceCategory))
    tags = Column(ARRAY(String))
    source_record_id = Column(UUID(as_uuid=True), ForeignKey("records.id"))
    order_index = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    
    tenant = relationship("Tenant", back_populates="experiences")
    user = relationship("User", back_populates="experiences")
    source_record = relationship("Record", foreign_keys=[source_record_id])
