import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, Notification, NotificationType } from '../api/notifications';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../utils/time';
import toast from 'react-hot-toast';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 获取通知列表
  const loadNotifications = useCallback(async (reset = false) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await notificationsApi.getNotifications(currentPage, 10);
      
      if (reset) {
        setNotifications(response.data.data);
        setPage(2);
      } else {
        setNotifications(prev => [...prev, ...response.data.data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.data.data.length === 10);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  // 获取未读数量
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [isAuthenticated]);

  // 初始加载和轮询
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications(true);
      loadUnreadCount();
      
      // 每30秒轮询一次未读数量
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // 标记为已读
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('标记失败');
    }
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(`已标记 ${response.data.marked_count} 条通知为已读`);
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 删除通知
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    // 标记为已读
    if (!notification.is_read) {
      notificationsApi.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // 跳转到相关页面
    if (notification.resource_type && notification.resource_id) {
      switch (notification.resource_type) {
        case '记录':
          navigate(`/records/${notification.resource_id}`);
          break;
        case '经历':
          navigate(`/experiences/${notification.resource_id}`);
          break;
        case '收藏':
          navigate(`/collections/${notification.resource_id}`);
          break;
        case 'user':
          // navigate(`/users/${notification.resource_id}`);
          break;
      }
    }
    
    setIsOpen(false);
  };

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return '❤️';
      case NotificationType.COMMENT:
        return '💬';
      case NotificationType.FOLLOW:
        return '👥';
      case NotificationType.COLLECT:
        return '⭐';
      case NotificationType.SYSTEM:
        return '🔔';
      default:
        return '📌';
    }
  };

  // 格式化时间
  const formatTime = (time: string) => {
    return formatRelativeTime(time);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      {/* 通知按钮 */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications(true);
          }
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="通知中心"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* 未读数量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉面板 */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                通知中心
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  全部已读
                </button>
              )}
            </div>

            {/* 通知列表 */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p>暂无通知</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* 图标 */}
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                            
                            {/* 操作按钮 */}
                            <div className="flex items-center space-x-2">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  title="标记为已读"
                                >
                                  已读
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="删除"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* 未读指示器 */}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* 加载更多 */}
                  {hasMore && (
                    <button
                      onClick={() => loadNotifications()}
                      disabled={loading}
                      className="w-full py-3 text-sm text-blue-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700 transition-colors"
                    >
                      {loading ? '加载中...' : '加载更多'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
