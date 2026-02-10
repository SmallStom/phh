from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.models.base import BaseModel


class NotificationType(str, enum.Enum):
    LIKE = "like"           # 点赞
    COMMENT = "comment"     # 评论
    FOLLOW = "follow"       # 关注
    COLLECT = "collect"     # 收藏
    MENTION = "mention"     # 提及
    SYSTEM = "system"       # 系统通知


class Notification(BaseModel):
    __tablename__ = "notifications"
    
    # 接收者
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 发送者（可选，系统通知可能没有发送者）
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # 通知类型
    type = Column(SQLEnum(NotificationType), nullable=False)
    
    # 通知标题和内容
    title = Column(String(200), nullable=False)
    content = Column(Text)
    
    # 相关资源（可选）
    resource_type = Column(String(50))  # record, experience, collection, user
    resource_id = Column(UUID(as_uuid=True))
    
    # 评论ID（用于提及通知跳转到具体评论）
    comment_id = Column(UUID(as_uuid=True), nullable=True)
    
    # 是否已读
    is_read = Column(Boolean, default=False, index=True)
    
    # 是否已删除
    is_deleted = Column(Boolean, default=False)
    
    # 创建时间
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # 关系
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications")
    sender = relationship("User", foreign_keys=[sender_id])
    
    def mark_as_read(self):
        """标记为已读"""
        self.is_read = True
    
    def mark_as_deleted(self):
        """标记为已删除"""
        self.is_deleted = True
