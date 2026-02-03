from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
import logging
import json

from app.core.websocket import manager
from app.core.notification import notification_service
from app.core.database import SessionLocal
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket通知连接端点
    
    连接方式: ws://host/ws/notifications?token=YOUR_JWT_TOKEN
    
    消息格式:
    - 服务器 -> 客户端:
      {
        "type": "notification",
        "data": { ...notification object... }
      }
    - 服务器 -> 客户端:
      {
        "type": "unread_count",
        "count": 5
      }
    - 服务器 -> 客户端:
      {
        "type": "ping"
      }
    
    - 客户端 -> 服务器:
      {
        "action": "mark_read",
        "notification_id": "..."
      }
    - 客户端 -> 服务器:
      {
        "action": "mark_all_read"
      }
    - 客户端 -> 服务器:
      {
        "action": "pong"
      }
    """
    user_id = None
    
    # 先验证 Token，避免在 WebSocket 握手阶段失败返回 HTTP 403
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Invalid token: no user_id")
    except JWTError as e:
        logger.error(f"WebSocket authentication failed: {e}")
        # 接受连接后立即关闭，让前端能收到关闭事件
        await websocket.accept()
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    try:
        # 接受连接
        await websocket.accept()
        
        # 注册连接到管理器
        manager.active_connections[user_id] = websocket
        manager.connection_users[websocket] = user_id
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        # 发送初始未读消息数
        db = SessionLocal()
        try:
            unread_count = notification_service.get_unread_count(db, user_id)
            try:
                await websocket.send_json({
                    "type": "unread_count",
                    "count": unread_count
                })
            except RuntimeError:
                # 连接已断开，退出处理
                db.close()
                return
        finally:
            db.close()
        
        # 保持连接，处理客户端消息
        while True:
            try:
                # 接收客户端消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                action = message.get("action")
                
                if action == "mark_read":
                    # 标记单个通知为已读
                    notification_id = message.get("notification_id")
                    if notification_id:
                        db = SessionLocal()
                        try:
                            success = notification_service.mark_as_read(
                                db, notification_id, user_id
                            )
                            if success:
                                # 发送更新后的未读数
                                unread_count = notification_service.get_unread_count(db, user_id)
                                try:
                                    await websocket.send_json({
                                        "type": "unread_count",
                                        "count": unread_count
                                    })
                                except RuntimeError:
                                    # 连接已断开，退出循环
                                    break
                        finally:
                            db.close()
                
                elif action == "mark_all_read":
                    # 标记所有通知为已读
                    db = SessionLocal()
                    try:
                        notification_service.mark_all_as_read(db, user_id)
                        try:
                            await websocket.send_json({
                                "type": "unread_count",
                                "count": 0
                            })
                        except RuntimeError:
                            # 连接已断开，退出循环
                            break
                    finally:
                        db.close()
                
                elif action == "pong":
                    # 心跳响应
                    logger.debug(f"Received pong from user {user_id}")
                
                else:
                    logger.warning(f"Unknown action from user {user_id}: {action}")
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from user {user_id}")
            except RuntimeError as e:
                # 连接已断开（如 "Cannot call 'receive' once a disconnect message has been received"）
                error_msg = str(e).lower()
                if "disconnect" in error_msg or "not connected" in error_msg or "closed" in error_msg:
                    logger.debug(f"WebSocket disconnected for user {user_id}, exiting message loop")
                    break
                else:
                    logger.error(f"Runtime error for user {user_id}: {e}")
            except Exception as e:
                logger.error(f"Error processing message from user {user_id}: {e}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        if user_id and websocket in manager.connection_users:
            manager.disconnect(websocket)


@router.websocket("/ws/public")
async def websocket_public(websocket: WebSocket):
    """
    公共WebSocket连接（无需认证）
    用于广播系统公告等公开信息
    """
    await websocket.accept()
    
    try:
        # 发送欢迎消息
        await websocket.send_json({
            "type": "system",
            "message": "Connected to PHH public WebSocket"
        })
        
        # 保持连接
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # 处理公共消息
                if message.get("action") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        logger.info("Public WebSocket disconnected")
    except Exception as e:
        logger.error(f"Public WebSocket error: {e}")
