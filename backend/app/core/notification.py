from sqlalchemy.orm import Session
from typing import Optional
import asyncio
import logging

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.notification_settings import NotificationSettings

logger = logging.getLogger(__name__)

# 延迟导入，避免循环依赖
manager = None

def get_websocket_manager():
    """获取WebSocket管理器（延迟导入）"""
    global manager
    if manager is None:
        from app.core.websocket import manager as ws_manager
        manager = ws_manager
    return manager


class NotificationService:
    """站内通知服务"""
    
    @staticmethod
    def _check_notification_enabled(
        db: Session,
        user_id: str,
        notification_type: NotificationType
    ) -> bool:
        """
        检查用户是否启用了特定类型的通知
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            notification_type: 通知类型
            
        Returns:
            bool: 是否启用通知
        """
        settings = db.query(NotificationSettings).filter(
            NotificationSettings.user_id == user_id
        ).first()
        
        if not settings:
            return True  # 默认启用
        
        # 根据通知类型检查对应的设置
        if notification_type == NotificationType.LIKE:
            return settings.like_enabled
        elif notification_type == NotificationType.COMMENT:
            return settings.comment_enabled
        elif notification_type == NotificationType.FOLLOW:
            return settings.follow_enabled
        elif notification_type == NotificationType.MENTION:
            return settings.mention_enabled
        elif notification_type == NotificationType.COLLECT:
            return True  # 收藏通知暂时没有开关
        else:
            return True  # 其他类型默认启用
    
    @staticmethod
    def create_notification(
        db: Session,
        recipient_id: str,
        type: NotificationType,
        title: str,
        content: Optional[str] = None,
        sender_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        comment_id: Optional[str] = None
    ) -> Notification:
        """创建通知"""
        notification = Notification(
            recipient_id=recipient_id,
            sender_id=sender_id,
            type=type,
            title=title,
            content=content,
            resource_type=resource_type,
            resource_id=resource_id,
            comment_id=comment_id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Notification created: {type} for user {recipient_id}")
        
        # 通过WebSocket推送实时通知
        asyncio.create_task(
            NotificationService._push_notification(notification)
        )
        
        return notification
    
    @staticmethod
    async def _push_notification(notification: Notification):
        """
        通过WebSocket推送通知给接收者
        
        Args:
            notification: 通知对象
        """
        try:
            ws_manager = get_websocket_manager()
            
            # 检查用户是否在线
            if not ws_manager.is_user_online(str(notification.recipient_id)):
                return
            
            # 构建通知消息
            message = {
                "type": "notification",
                "data": {
                    "id": str(notification.id),
                    "type": notification.type.value,
                    "title": notification.title,
                    "content": notification.content,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                    "sender_id": str(notification.sender_id) if notification.sender_id else None,
                    "resource_type": notification.resource_type,
                    "resource_id": str(notification.resource_id) if notification.resource_id else None,
                }
            }
            
            # 发送通知
            await ws_manager.send_personal_message(
                str(notification.recipient_id),
                message
            )
            
            # 同时更新未读数
            await NotificationService._push_unread_count(str(notification.recipient_id))
            
        except RuntimeError:
            # 连接已断开，忽略错误
            pass
        except Exception as e:
            logger.error(f"Failed to push notification: {e}")
    
    @staticmethod
    async def _push_unread_count(user_id: str):
        """
        推送未读通知数量更新
        
        Args:
            user_id: 用户ID
        """
        try:
            ws_manager = get_websocket_manager()
            
            # 检查用户是否在线
            if not ws_manager.is_user_online(user_id):
                return
            
            # 获取未读数（这里简化处理，实际应该从数据库查询）
            # 由于异步上下文没有db session，这里只发送刷新指令
            await ws_manager.send_personal_message(
                user_id,
                {"type": "refresh_unread_count"}
            )
            
        except RuntimeError:
            # 连接已断开，忽略错误
            pass
        except Exception as e:
            logger.error(f"Failed to push unread count: {e}")
    
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
        
        # 检查用户是否启用了点赞通知
        if not NotificationService._check_notification_enabled(db, recipient_id, NotificationType.LIKE):
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
        
        # 检查用户是否启用了评论通知
        if not NotificationService._check_notification_enabled(db, recipient_id, NotificationType.COMMENT):
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
    def notify_comment_reply(
        db: Session,
        recipient_id: str,
        sender_id: str,
        sender_name: str,
        content_type: str,
        content_title: str,
        comment_content: str,
        content_id: str,
        parent_comment_id: Optional[str] = None
    ) -> Optional[Notification]:
        """发送评论回复通知"""
        # 不给自己发通知
        if recipient_id == sender_id:
            return None
        
        title = f"{sender_name} 回复了你的评论"
        content = f"在《{content_title}》中：{comment_content[:100]}{'...' if len(comment_content) > 100 else ''}"
        
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
        
        # 检查用户是否启用了关注通知
        if not NotificationService._check_notification_enabled(db, recipient_id, NotificationType.FOLLOW):
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
