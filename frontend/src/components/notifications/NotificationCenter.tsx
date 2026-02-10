import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, X, Heart, MessageCircle, UserPlus, 
  Check, Trash2, Settings, ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../services/websocket';
import { notificationsApi } from '../../api/notifications';
import { formatRelativeTime } from '../../utils/time';

export type NotificationType = 'like' | 'comment' | 'follow' | 'system' | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    avatar?: string;
  };
  target?: {
    id: string;
    type: 'record' | 'experience' | 'collection' | 'comment' | 'user';
    title?: string;
    commentId?: string; // 用于提及通知，跳转到具体评论
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-red-500" />,
  comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  follow: <UserPlus className="w-4 h-4 text-green-500" />,
  system: <Bell className="w-4 h-4 text-gray-500" />,
  mention: <MessageCircle className="w-4 h-4 text-purple-500" />,
};

const notificationColors: Record<NotificationType, string> = {
  like: 'bg-red-50 border-red-100',
  comment: 'bg-blue-50 border-blue-100',
  follow: 'bg-green-50 border-green-100',
  system: 'bg-gray-50 border-gray-100',
  mention: 'bg-purple-50 border-purple-100',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // WebSocket连接
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

  // 从API加载通知
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotificationsFromAPI();
    }
  }, [isOpen, isAuthenticated]);

  // 监听WebSocket消息
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'notification':
        // 新通知到达
        const newNotification = transformNotification(lastMessage.data);
        setNotifications(prev => [newNotification, ...prev]);
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
        refreshUnreadCount();
        break;
    }
  }, [lastMessage]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 禁用页面滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // 恢复页面滚动
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 从API加载通知
  const loadNotificationsFromAPI = async () => {
    try {
      const response = await notificationsApi.getNotifications({ page_size: 50 });
      const transformedNotifications = response.data.map(transformNotification);
      setNotifications(transformedNotifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // 刷新未读数
  const refreshUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  };

  // 资源类型映射（后端中文 -> 前端英文）
  const resourceTypeMap: Record<string, 'record' | 'experience' | 'collection' | 'comment' | 'user'> = {
    '记录': 'record',
    '经验': 'experience',
    '合集': 'collection',
    '评论': 'comment',
    '用户': 'user',
    'record': 'record',
    'experience': 'experience',
    'collection': 'collection',
    'comment': 'comment',
    'user': 'user',
  };

  // 转换后端通知格式为前端格式
  const transformNotification = (data: any): Notification => {
    const mappedType = data.resource_type ? resourceTypeMap[data.resource_type] : undefined;
    
    return {
      id: data.id,
      type: data.type as NotificationType,
      title: data.title,
      message: data.content || data.title,
      read: data.is_read,
      createdAt: data.created_at,
      actor: data.sender_id ? {
        id: data.sender_id,
        username: data.sender_username || '未知用户',
        avatar: data.sender_avatar,
      } : undefined,
      target: data.resource_id && mappedType ? {
        id: String(data.resource_id),
        type: mappedType,
        title: data.resource_title ? String(data.resource_title) : undefined,
        commentId: data.comment_id ? String(data.comment_id) : undefined,
      } : undefined,
    };
  };

  const markAsRead = async (id: string) => {
    // 乐观更新UI
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      // 通过WebSocket发送（如果连接）
      if (isConnected) {
        sendMessage({
          action: 'mark_read',
          notification_id: id,
        });
      } else {
        // 回退到HTTP API
        await notificationsApi.markAsRead(id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // 可以在这里添加错误恢复逻辑
    }
  };

  const markAllAsRead = async () => {
    // 乐观更新UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    try {
      // 通过WebSocket发送（如果连接）
      if (isConnected) {
        sendMessage({
          action: 'mark_all_read',
        });
      } else {
        // 回退到HTTP API
        await notificationsApi.markAllAsRead();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    // 先更新UI（乐观更新）
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(count => Math.max(0, count - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // 调用API删除
    try {
      await notificationsApi.deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // 可以在这里添加错误恢复逻辑
    }
  };

  const clearAll = async () => {
    // 调用API删除所有通知
    try {
      // 逐个删除所有通知（后端没有批量删除API）
      await Promise.all(
        notifications.map(n => notificationsApi.deleteNotification(n.id))
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // 先标记已读
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // 关闭面板
    onClose();

    // 延迟导航，让面板先关闭
    setTimeout(() => {
      // 导航到相关内容
      if (notification.target && notification.target.id) {
        const targetId = notification.target.id;
        const commentId = notification.target.commentId;
        
        switch (notification.target.type) {
          case 'record':
            // 提及通知需要跳转到具体评论位置
            if (notification.type === 'mention' && commentId) {
              navigate(`/records/${targetId}?commentId=${commentId}`);
            } else {
              navigate(`/records/${targetId}`);
            }
            break;
          case 'experience':
            navigate(`/experiences/${targetId}`);
            break;
          case 'collection':
            navigate(`/collections/${targetId}`);
            break;
          case 'comment':
            // 评论通知跳转到对应的记录/经验详情页，并定位到评论
            navigate(`/records/${targetId}?commentId=${targetId}`);
            break;
          case 'user':
            // 关注通知 - 跳转到用户主页
            navigate(`/users/${targetId}`);
            break;
          default:
            console.warn('Unknown notification target type:', notification.target.type);
        }
      }
    }, 100);
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const formatTime = (dateString: string) => {
    return formatRelativeTime(dateString);
  };

  const filters: { type: NotificationType | 'all'; label: string; count?: number }[] = [
    { type: 'all', label: '全部', count: notifications.length },
    { type: 'like', label: '点赞', count: notifications.filter(n => n.type === 'like' && !n.read).length || undefined },
    { type: 'comment', label: '评论', count: notifications.filter(n => n.type === 'comment' && !n.read).length || undefined },
    { type: 'follow', label: '关注', count: notifications.filter(n => n.type === 'follow' && !n.read).length || undefined },
    { type: 'mention', label: '提及', count: notifications.filter(n => n.type === 'mention' && !n.read).length || undefined },
  ];

  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ isolation: 'isolate' }}>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* 通知面板 */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
            {/* 头部 */}
            <div 
              className="flex items-center justify-between p-4 border-b flex-shrink-0"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell 
                    className="w-5 h-5" 
                    style={{ color: 'var(--text-primary)' }} 
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  通知中心
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    title="全部标记为已读"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title="清空所有通知"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 筛选器 */}
            <div 
              className="flex gap-2 p-4 border-b flex-shrink-0 overflow-hidden"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              {filters.map((filter) => (
                <button
                  key={filter.type}
                  onClick={() => setActiveFilter(filter.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeFilter === filter.type
                      ? 'text-white'
                      : 'hover:bg-[var(--bg-card)]'
                  }`}
                  style={{
                    backgroundColor: activeFilter === filter.type 
                      ? 'var(--accent-color)' 
                      : 'var(--bg-card)',
                    color: activeFilter === filter.type 
                      ? 'white' 
                      : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {filter.label}
                  {filter.count !== undefined && filter.count > 0 && (
                    <span 
                      className="px-1.5 py-0.5 text-xs rounded-full"
                      style={{
                        backgroundColor: activeFilter === filter.type 
                          ? 'rgba(255,255,255,0.2)' 
                          : 'var(--bg-secondary)'
                      }}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 通知列表 */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                minHeight: '200px'
              }}
            >
              {filteredNotifications.length === 0 ? (
                <div 
                  className="flex flex-col items-center justify-center h-full"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Bell className="w-16 h-16 mb-4 opacity-30" />
                  <p>暂无通知</p>
                </div>
              ) : (
                <div 
                  className="divide-y"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="group p-4 transition-colors cursor-pointer hover:bg-[var(--bg-secondary)]"
                      style={{
                        backgroundColor: !notification.read 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : 'transparent',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        {/* 图标 */}
                        <div 
                          className={`p-2 rounded-full flex-shrink-0 ${notificationColors[notification.type]}`}
                        >
                          {notificationIcons[notification.type]}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 
                                className="font-medium text-sm"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {notification.title}
                              </h4>
                              <p 
                                className="text-sm mt-0.5"
                                style={{ 
                                  color: 'var(--text-secondary)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {notification.message}
                              </p>
                              <span 
                                className="text-xs mt-1 block"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <span 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: 'var(--accent-color)' }}
                                ></span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-[var(--border-color)]"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部 */}
            <div 
              className="p-4 border-t flex-shrink-0"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <button 
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    navigate('/settings/notifications');
                  }, 100);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:bg-[var(--bg-card)] rounded-lg p-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Settings className="w-4 h-4" />
                通知设置
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
  );
};
