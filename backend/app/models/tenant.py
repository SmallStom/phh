from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Tenant(BaseModel):
    __tablename__ = "tenants"
    
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text)
    
    users = relationship("User", back_populates="tenant")
    records = relationship("Record", back_populates="tenant")
    experiences = relationship("Experience", back_populates="tenant")
    collections = relationship("Collection", back_populates="tenant")
    tags = relationship("Tag", back_populates="tenant")
