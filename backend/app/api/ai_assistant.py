from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import io

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.core.ai_assistant import ai_assistant, process_image_upload
from app.config import settings
from app.core.security import decode_access_token

router = APIRouter(prefix="/api/ai-assistant", tags=["ai-assistant"])

# 使用 auto_error=False 来手动处理认证错误
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """可选的当前用户认证"""
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user


class ChatMessage(BaseModel):
    """聊天消息"""
    role: str  # "user" 或 "assistant"
    content: str


class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """聊天响应"""
    success: bool
    content: Optional[str] = None
    error: Optional[str] = None
    model: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    发送聊天消息（非流式）
    
    - **message**: 用户消息
    - **conversation_history**: 对话历史（可选）
    """
    # 检查 AI 是否配置
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is not configured"
        )
    
    # 转换对话历史格式
    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
    
    # 调用 AI
    result = await ai_assistant.chat(
        message=request.message,
        conversation_history=history
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    return ChatResponse(
        success=True,
        content=result["content"],
        model=result["model"]
    )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    发送聊天消息（流式）
    
    返回 SSE (Server-Sent Events) 流
    """
    # 检查 AI 是否配置
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is not configured"
        )
    
    # 转换对话历史格式
    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
    
    async def generate():
        async for chunk in ai_assistant.chat_stream(
            message=request.message,
            conversation_history=history
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/chat/with-image", response_model=ChatResponse)
async def chat_with_image(
    message: str = Form(...),
    image: UploadFile = File(...),
    conversation_history: Optional[str] = Form(None),  # JSON 字符串
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    发送带图片的聊天消息
    
    - **message**: 用户消息
    - **image**: 图片文件（jpeg/png/gif/webp）
    - **conversation_history**: 对话历史（JSON 字符串，可选）
    """
    # 检查 AI 是否配置
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is not configured"
        )
    
    # 验证图片类型
    allowed_types = settings.ALLOWED_IMAGE_TYPES
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type. Allowed: {', '.join(allowed_types)}"
        )
    
    # 验证图片大小（最大 5MB）
    max_size = 5 * 1024 * 1024  # 5MB
    image_bytes = await image.read()
    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image too large. Max size: 5MB"
        )
    
    # 处理图片
    image_data = await process_image_upload(image_bytes, image.content_type)
    
    # 解析对话历史
    history = None
    if conversation_history:
        import json
        try:
            history_data = json.loads(conversation_history)
            history = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in history_data
            ]
        except json.JSONDecodeError:
            pass
    
    # 调用 AI
    result = await ai_assistant.chat(
        message=message,
        conversation_history=history,
        image_data=image_data
    )
    
    if not result["success"]:
        # 直接返回 AI 核心模块的错误信息
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return ChatResponse(
        success=True,
        content=result["content"],
        model=result["model"]
    )


@router.get("/status")
async def get_status(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    获取 AI 助手状态
    不需要登录即可查看状态
    """
    return {
        "enabled": bool(settings.OPENROUTER_API_KEY),
        "model": settings.OPENROUTER_MODEL if settings.OPENROUTER_API_KEY else None,
    }


# 处理 CORS 预检请求
@router.options("/{path:path}")
async def options_handler(path: str):
    """处理 CORS 预检请求"""
    return {"message": "OK"}
