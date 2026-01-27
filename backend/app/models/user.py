from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    __tablename__ = "users"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    tenant = relationship("Tenant", back_populates="users")
    records = relationship("Record", back_populates="user")
    experiences = relationship("Experience", back_populates="user")
    collections = relationship("Collection", back_populates="user")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
