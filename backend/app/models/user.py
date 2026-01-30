from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(BaseModel):
    __tablename__ = "users"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.USER)
    
    tenant = relationship("Tenant", back_populates="users")
    records = relationship("Record", back_populates="user")
    experiences = relationship("Experience", back_populates="user")
    collections = relationship("Collection", back_populates="user")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    
    # 关注关系
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan"
    )
    
    @property
    def following_count(self) -> int:
        return len(self.following) if self.following else 0
    
    @property
    def followers_count(self) -> int:
        return len(self.followers) if self.followers else 0
    
    # 通知关系
    notifications = relationship(
        "Notification",
        foreign_keys="Notification.recipient_id",
        back_populates="recipient",
        cascade="all, delete-orphan",
        order_by="desc(Notification.created_at)"
    )
    
    @property
    def unread_notification_count(self) -> int:
        """未读通知数量"""
        if not self.notifications:
            return 0
        return sum(1 for n in self.notifications if not n.is_read and not n.is_deleted)
