from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
import json

from app.core.websocket import manager
from app.core.notification import notification_service
from app.core.database import SessionLocal
from app.config import settings

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = Query(...)):
    user_id = None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Invalid token: no user_id")
    except JWTError:
        await websocket.accept()
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    try:
        await websocket.accept()
        
        manager.active_connections[user_id] = websocket
        manager.connection_users[websocket] = user_id
        
        db = SessionLocal()
        try:
            unread_count = notification_service.get_unread_count(db, user_id)
            try:
                await websocket.send_json({
                    "type": "unread_count",
                    "count": unread_count
                })
            except RuntimeError:
                db.close()
                return
        finally:
            db.close()
        
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                action = message.get("action")
                
                if action == "mark_read":
                    notification_id = message.get("notification_id")
                    if notification_id:
                        db = SessionLocal()
                        try:
                            success = notification_service.mark_as_read(
                                db, notification_id, user_id
                            )
                            if success:
                                unread_count = notification_service.get_unread_count(db, user_id)
                                try:
                                    await websocket.send_json({
                                        "type": "unread_count",
                                        "count": unread_count
                                    })
                                except RuntimeError:
                                    break
                        finally:
                            db.close()
                
                elif action == "mark_all_read":
                    db = SessionLocal()
                    try:
                        notification_service.mark_all_as_read(db, user_id)
                        try:
                            await websocket.send_json({
                                "type": "unread_count",
                                "count": 0
                            })
                        except RuntimeError:
                            break
                    finally:
                        db.close()
                    
            except json.JSONDecodeError:
                pass
            except RuntimeError as e:
                error_msg = str(e).lower()
                if "disconnect" in error_msg or "not connected" in error_msg or "closed" in error_msg:
                    break
            except Exception:
                break
                
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if user_id and websocket in manager.connection_users:
            manager.disconnect(websocket)


@router.websocket("/ws/public")
async def websocket_public(websocket: WebSocket):
    await websocket.accept()
    
    try:
        await websocket.send_json({
            "type": "system",
            "message": "Connected to PHH public WebSocket"
        })
        
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("action") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
