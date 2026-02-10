from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from uuid import UUID
import secrets
import urllib.parse

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.share import Share
from app.models.record import Record
from app.models.experience import Experience
from app.models.collection import Collection
from app.schemas.share import ShareCreate, ShareResponse, ShareStats, ShareUrlResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/share", tags=["share"])


def generate_short_code(length: int = 8) -> str:
    """生成短码"""
    return secrets.token_urlsafe(length)[:length]


def build_share_url(content_type: str, content_id: str, short_code: str = None) -> str:
    """构建分享URL"""
    base_url = "https://phh.app"  # 根据实际域名调整
    
    if short_code:
        return f"{base_url}/s/{short_code}"
    else:
        return f"{base_url}/{content_type}s/{content_id}"


@router.post("", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def create_share(
    share_data: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """记录一次分享"""
    # 验证内容存在
    content_model = None
    if share_data.content_type == "record":
        content_model = db.query(Record).filter(Record.id == share_data.content_id).first()
    elif share_data.content_type == "experience":
        content_model = db.query(Experience).filter(Experience.id == share_data.content_id).first()
    elif share_data.content_type == "collection":
        content_model = db.query(Collection).filter(Collection.id == share_data.content_id).first()
    
    if not content_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # 检查是否已存在分享记录
    existing_share = db.query(Share).filter(
        Share.user_id == current_user.id,
        Share.content_type == share_data.content_type,
        Share.content_id == share_data.content_id,
        Share.platform == share_data.platform
    ).first()
    
    if existing_share:
        existing_share.share_count += 1
        existing_share.last_shared_at = func.now()
        db.commit()
        db.refresh(existing_share)
        return ShareResponse.model_validate(existing_share)
    
    # 创建新的分享记录
    share = Share(
        user_id=current_user.id,
        content_type=share_data.content_type,
        content_id=share_data.content_id,
        platform=share_data.platform
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    logger.info(f"Share created: {share_data.content_type} {share_data.content_id} by user {current_user.id}")
    
    return ShareResponse.model_validate(share)


@router.get("/stats/{content_type}/{content_id}", response_model=ShareStats)
async def get_share_stats(
    content_type: str,
    content_id: str,
    db: Session = Depends(get_db)
):
    """获取内容的分享统计"""
    # 验证内容存在
    if content_type == "record":
        content = db.query(Record).filter(Record.id == content_id).first()
    elif content_type == "experience":
        content = db.query(Experience).filter(Experience.id == content_id).first()
    elif content_type == "collection":
        content = db.query(Collection).filter(Collection.id == content_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type"
        )
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # 获取各平台分享数
    platform_stats = {}
    platforms = ['link', 'wechat', 'weibo', 'twitter', 'facebook', 'copy']
    
    for platform in platforms:
        count = db.query(func.sum(Share.share_count)).filter(
            Share.content_type == content_type,
            Share.content_id == content_id,
            Share.platform == platform
        ).scalar()
        platform_stats[platform] = count or 0
    
    total_shares = sum(platform_stats.values())
    
    return ShareStats(
        content_type=content_type,
        content_id=content_id,
        total_shares=total_shares,
        platform_stats=platform_stats
    )


@router.get("/url/{content_type}/{content_id}", response_model=ShareUrlResponse)
async def get_share_url(
    content_type: str,
    content_id: str,
    db: Session = Depends(get_db)
):
    """获取分享链接"""
    # 验证内容存在
    if content_type == "record":
        content = db.query(Record).filter(Record.id == content_id).first()
    elif content_type == "experience":
        content = db.query(Experience).filter(Experience.id == content_id).first()
    elif content_type == "collection":
        content = db.query(Collection).filter(Collection.id == content_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type"
        )
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # 获取内容标题
    title = getattr(content, 'title', None) or getattr(content, 'name', '分享内容')
    description = getattr(content, 'bio', None) or getattr(content, 'description', None)
    image = getattr(content, 'cover', None) or getattr(content, 'cover_image', None)
    
    share_url = build_share_url(content_type, content_id)
    
    return ShareUrlResponse(
        url=share_url,
        title=title,
        description=description,
        image=image
    )


@router.post("/record/{content_type}/{content_id}")
async def record_share_and_get_url(
    content_type: str,
    content_id: str,
    platform: str = "link",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """记录分享并返回分享链接"""
    share_data = ShareCreate(
        content_type=content_type,
        content_id=content_id,
        platform=platform
    )
    
    # 调用创建分享
    await create_share(share_data, current_user, db)
    
    # 返回分享链接
    share_url = await get_share_url(content_type, content_id, db)
    
    return share_url
