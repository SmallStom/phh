import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../services/websocket';
import { notificationsApi } from '../../api/notifications';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // WebSocket连接
  const { lastMessage } = useWebSocket();

  // 初始加载未读数
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
    }
  }, [isAuthenticated]);

  // 监听WebSocket消息
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'notification':
        // 新通知到达，增加未读数
        setUnreadCount(prev => prev + 1);
        break;
      
      case 'unread_count':
        // 更新未读数
        if (typeof lastMessage.count === 'number') {
          setUnreadCount(lastMessage.count);
        }
        break;
      
      case 'refresh_unread_count':
        // 刷新未读数
        loadUnreadCount();
        break;
      
      case 'system':
      case 'ping':
      case 'pong':
        // 系统消息或心跳，忽略
        break;
    }
  }, [lastMessage]);

  // 从API加载未读数
  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // 处理通知中心关闭时刷新未读数
  const handleClose = () => {
    setIsOpen(false);
    // 延迟刷新，等待标记已读操作完成
    setTimeout(() => {
      loadUnreadCount();
    }, 500);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
};
