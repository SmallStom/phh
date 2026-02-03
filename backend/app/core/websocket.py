import json
import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from app.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        # 用户ID到WebSocket连接的映射
        self.active_connections: Dict[str, WebSocket] = {}
        # WebSocket到用户ID的映射
        self.connection_users: Dict[WebSocket, str] = {}
    
    async def connect(self, websocket: WebSocket, token: str) -> str:
        """
        建立WebSocket连接并验证用户
        
        Args:
            websocket: WebSocket连接对象
            token: JWT认证token
            
        Returns:
            user_id: 连接成功的用户ID
            
        Raises:
            JWTError: token验证失败
        """
        try:
            # 验证JWT token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            
            if not user_id:
                raise JWTError("Invalid token: no user_id")
            
            # 接受连接
            await websocket.accept()
            
            # 如果用户已有连接，先断开旧连接
            if user_id in self.active_connections:
                old_ws = self.active_connections[user_id]
                try:
                    await old_ws.close()
                except:
                    pass
                if old_ws in self.connection_users:
                    del self.connection_users[old_ws]
            
            # 保存新连接
            self.active_connections[user_id] = websocket
            self.connection_users[websocket] = user_id
            
            logger.info(f"User {user_id} connected via WebSocket")
            return user_id
            
        except JWTError as e:
            logger.error(f"WebSocket authentication failed: {e}")
            await websocket.close(code=4001, reason="Authentication failed")
            raise
    
    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        user_id = self.connection_users.get(websocket)
        
        if user_id:
            # 从映射中移除
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            del self.connection_users[websocket]
            
            logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """
        向指定用户发送消息
        
        Args:
            user_id: 目标用户ID
            message: 消息内容（会被序列化为JSON）
        """
        websocket = self.active_connections.get(user_id)
        if not websocket:
            return
        
        # 检查连接是否已关闭 - 检查 client_state 属性
        try:
            # FastAPI/WebSocket 的 client_state 表示连接状态
            if hasattr(websocket, 'client_state'):
                from starlette.websockets import WebSocketState
                if websocket.client_state == WebSocketState.DISCONNECTED:
                    # 连接已断开，清理并返回
                    self.disconnect(websocket)
                    return
        except Exception:
            # 如果无法检查状态，继续尝试发送
            pass
        
        # 尝试发送消息
        try:
            await websocket.send_json(message)
            logger.debug(f"Sent message to user {user_id}: {message}")
        except RuntimeError as e:
            # 连接已关闭，静默清理
            error_msg = str(e).lower()
            if "not connected" in error_msg or "disconnect" in error_msg or "closed" in error_msg:
                # 静默清理，不打印错误日志
                self._safe_disconnect(websocket)
            else:
                logger.error(f"Runtime error sending message to user {user_id}: {e}")
                self._safe_disconnect(websocket)
        except Exception as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
            # 发送失败，清理连接
            self._safe_disconnect(websocket)
    
    def _safe_disconnect(self, websocket: WebSocket):
        """安全地断开连接，避免重复清理"""
        try:
            user_id = self.connection_users.get(websocket)
            if user_id:
                self.active_connections.pop(user_id, None)
                self.connection_users.pop(websocket, None)
                logger.debug(f"Cleaned up disconnected WebSocket for user {user_id}")
        except Exception:
            # 忽略清理过程中的任何错误
            pass
    
    async def broadcast(self, message: dict, exclude_user_id: str = None):
        """
        广播消息给所有连接的用户
        
        Args:
            message: 消息内容
            exclude_user_id: 排除的用户ID（可选）
        """
        disconnected = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to user {user_id}: {e}")
                disconnected.append(websocket)
        
        # 清理断开的连接
        for websocket in disconnected:
            self.disconnect(websocket)
    
    def is_user_online(self, user_id: str) -> bool:
        """检查用户是否在线"""
        return user_id in self.active_connections
    
    def get_online_users(self) -> Set[str]:
        """获取所有在线用户ID"""
        return set(self.active_connections.keys())


# 全局连接管理器实例
manager = ConnectionManager()
