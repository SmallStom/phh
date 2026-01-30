from sqlalchemy.orm import Session
from typing import Optional
from app.models.notification import Notification, NotificationType
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """站内通知服务"""
    
    @staticmethod
    def create_notification(
        db: Session,
        recipient_id: str,
        type: NotificationType,
        title: str,
        content: Optional[str] = None,
        sender_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ) -> Notification:
        """创建通知"""
        notification = Notification(
            recipient_id=recipient_id,
            sender_id=sender_id,
            type=type,
            title=title,
            content=content,
            resource_type=resource_type,
            resource_id=resource_id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Notification created: {type} for user {recipient_id}")
        return notification
    
    @staticmethod
    def notify_like(
        db: Session,
        recipient_id: str,
        sender_id: str,
        sender_name: str,
        content_type: str,
        content_title: str,
        content_id: str
    ) -> Optional[Notification]:
        """发送点赞通知"""
        # 不给自己发通知
        if recipient_id == sender_id:
            return None
        
        title = f"{sender_name} 点赞了你的{content_type}"
        content = f"《{content_title}》"
        
        return NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            type=NotificationType.LIKE,
            title=title,
            content=content,
            sender_id=sender_id,
            resource_type=content_type,
            resource_id=content_id
        )
    
    @staticmethod
    def notify_comment(
        db: Session,
        recipient_id: str,
        sender_id: str,
        sender_name: str,
        content_type: str,
        content_title: str,
        comment_content: str,
        content_id: str
    ) -> Optional[Notification]:
        """发送评论通知"""
        # 不给自己发通知
        if recipient_id == sender_id:
            return None
        
        title = f"{sender_name} 评论了你的{content_type}"
        content = f"《{content_title}》：{comment_content[:100]}{'...' if len(comment_content) > 100 else ''}"
        
        return NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            type=NotificationType.COMMENT,
            title=title,
            content=content,
            sender_id=sender_id,
            resource_type=content_type,
            resource_id=content_id
        )
    
    @staticmethod
    def notify_follow(
        db: Session,
        recipient_id: str,
        sender_id: str,
        sender_name: str
    ) -> Optional[Notification]:
        """发送关注通知"""
        # 不给自己发通知
        if recipient_id == sender_id:
            return None
        
        title = f"{sender_name} 关注了你"
        
        return NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            type=NotificationType.FOLLOW,
            title=title,
            sender_id=sender_id,
            resource_type="user",
            resource_id=sender_id
        )
    
    @staticmethod
    def notify_collect(
        db: Session,
        recipient_id: str,
        sender_id: str,
        sender_name: str,
        content_type: str,
        content_title: str,
        content_id: str
    ) -> Optional[Notification]:
        """发送收藏通知"""
        # 不给自己发通知
        if recipient_id == sender_id:
            return None
        
        title = f"{sender_name} 收藏了你的{content_type}"
        content = f"《{content_title}》"
        
        return NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            type=NotificationType.COLLECT,
            title=title,
            content=content,
            sender_id=sender_id,
            resource_type=content_type,
            resource_id=content_id
        )
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        unread_only: bool = False
    ):
        """获取用户通知列表"""
        from sqlalchemy import desc
        
        query = db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_deleted == False
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        total = query.count()
        unread_count = db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
            Notification.is_deleted == False
        ).count()
        
        notifications = query.order_by(
            desc(Notification.created_at)
        ).offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "data": notifications,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: str,
        user_id: str
    ) -> bool:
        """标记通知为已读"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.mark_as_read()
        db.commit()
        return True
    
    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: str
    ) -> int:
        """标记所有通知为已读"""
        notifications = db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
            Notification.is_deleted == False
        ).all()
        
        count = 0
        for notification in notifications:
            notification.mark_as_read()
            count += 1
        
        db.commit()
        return count
    
    @staticmethod
    def delete_notification(
        db: Session,
        notification_id: str,
        user_id: str
    ) -> bool:
        """删除通知（软删除）"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.mark_as_deleted()
        db.commit()
        return True
    
    @staticmethod
    def get_unread_count(
        db: Session,
        user_id: str
    ) -> int:
        """获取未读通知数量"""
        return db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
            Notification.is_deleted == False
        ).count()


# 全局通知服务实例
notification_service = NotificationService()
