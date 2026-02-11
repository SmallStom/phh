import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';

// 支持 VITE_WS_URL 环境变量，如果没有则根据 VITE_API_URL 推断
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, 'ws');

export interface NotificationMessage {
  type: 'notification' | 'unread_count' | 'refresh_unread_count' | 'ping' | 'pong' | 'system';
  data?: any;
  count?: number;
  message?: string;
}

export interface WebSocketHook {
  isConnected: boolean;
  lastMessage: NotificationMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * WebSocket Hook for real-time notifications
 * 
 * Usage:
 * const { isConnected, lastMessage, sendMessage } = useWebSocket();
 * 
 * useEffect(() => {
 *   if (lastMessage?.type === 'notification') {
 *     // Handle new notification
 *     showToast(lastMessage.data.title);
 *   }
 * }, [lastMessage]);
 */
export function useWebSocket(): WebSocketHook {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<NotificationMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      // WebSocket: Not authenticated, skipping connection
      return;
    }

    // 避免重复连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${WS_URL}/ws/notifications?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // WebSocket: Connected
        setIsConnected(true);
        
        // 启动心跳
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'pong' }));
          }
        }, 30000); // 30秒心跳
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          setLastMessage(message);

          // 处理ping
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ action: 'pong' }));
          }
        } catch (error) {
          // WebSocket: Failed to parse message
        }
      };

      ws.onclose = (event) => {
        // WebSocket: Disconnected
        setIsConnected(false);
        
        // 清理定时器
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // 认证失败（Token过期），不重连，需要重新登录
        if (event.code === 4001 || event.code === 1008) {
          // WebSocket: Authentication failed
          return;
        }

        // 自动重连（非主动断开且非认证失败）
        if (event.code !== 1000 && event.code !== 1001) {
          // WebSocket: Reconnecting in 5s
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      ws.onerror = () => {
        // WebSocket: Error
      };

      wsRef.current = ws;
    } catch (error) {
      // WebSocket: Failed to connect
    }
  }, [token, isAuthenticated]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 组件挂载时连接，卸载时断开
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // 监听认证状态变化
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}

/**
 * 标记通知为已读（通过WebSocket）
 */
export function markNotificationAsRead(ws: WebSocketHook, notificationId: string) {
  ws.sendMessage({
    action: 'mark_read',
    notification_id: notificationId,
  });
}

/**
 * 标记所有通知为已读（通过WebSocket）
 */
export function markAllNotificationsAsRead(ws: WebSocketHook) {
  ws.sendMessage({
    action: 'mark_all_read',
  });
}
