from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.models.record import Record
from app.models.experience import Experience
from app.models.collection import Collection
from app.core.analytics import analytics_service
from app.core.redis import redis_cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/view/{content_type}/{content_id}")
async def record_view(
    content_type: str,
    content_id: str,
    visitor_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user)
):
    """记录内容浏览"""
    valid_types = ["record", "experience", "collection", "user"]
    if content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的内容类型，必须是: {', '.join(valid_types)}"
        )
    
    # 使用用户ID作为访客ID
    if current_user and not visitor_id:
        visitor_id = str(current_user.id)
    
    pv = analytics_service.record_page_view(content_type, content_id, visitor_id)
    
    return {
        "success": True,
        "page_view": pv
    }


@router.get("/stats/{content_type}/{content_id}")
async def get_content_stats(
    content_type: str,
    content_id: str
):
    """获取内容统计"""
    valid_types = ["record", "experience", "collection", "user"]
    if content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的内容类型，必须是: {', '.join(valid_types)}"
        )
    
    stats = analytics_service.get_content_stats(content_type, content_id)
    
    return {
        "success": True,
        "data": stats
    }


@router.get("/hot/records")
async def get_hot_records(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """获取热门记录排行"""
    hot_list = analytics_service.get_hot_records(limit)
    
    # 获取记录详情
    record_ids = [item["id"] for item in hot_list]
    records = db.query(Record).options(
        joinedload(Record.user)
    ).filter(Record.id.in_(record_ids)).all()
    
    record_map = {str(r.id): r for r in records}
    
    result = []
    for item in hot_list:
        record = record_map.get(item["id"])
        if record:
            result.append({
                "id": item["id"],
                "score": item["score"],
                "title": record.title,
                "author": record.user.username if record.user else None,
                "is_public": record.is_public
            })
    
    return {
        "success": True,
        "data": result
    }


@router.get("/hot/experiences")
async def get_hot_experiences(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """获取热门经历排行"""
    hot_list = analytics_service.get_hot_experiences(limit)
    
    exp_ids = [item["id"] for item in hot_list]
    experiences = db.query(Experience).options(
        joinedload(Experience.user)
    ).filter(Experience.id.in_(exp_ids)).all()
    
    exp_map = {str(e.id): e for e in experiences}
    
    result = []
    for item in hot_list:
        exp = exp_map.get(item["id"])
        if exp:
            result.append({
                "id": item["id"],
                "score": item["score"],
                "title": exp.title,
                "author": exp.user.username if exp.user else None,
                "is_public": exp.is_public
            })
    
    return {
        "success": True,
        "data": result
    }


@router.get("/hot/collections")
async def get_hot_collections(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """获取热门收藏排行"""
    hot_list = analytics_service.get_hot_collections(limit)
    
    coll_ids = [item["id"] for item in hot_list]
    collections = db.query(Collection).options(
        joinedload(Collection.user)
    ).filter(Collection.id.in_(coll_ids)).all()
    
    coll_map = {str(c.id): c for c in collections}
    
    result = []
    for item in hot_list:
        coll = coll_map.get(item["id"])
        if coll:
            result.append({
                "id": item["id"],
                "score": item["score"],
                "title": coll.title,
                "author": coll.user.username if coll.user else None,
                "is_public": coll.is_public
            })
    
    return {
        "success": True,
        "data": result
    }


@router.get("/hot/users")
async def get_hot_users(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """获取热门用户排行"""
    hot_list = analytics_service.get_hot_users(limit)
    
    user_ids = [item["id"] for item in hot_list]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    user_map = {str(u.id): u for u in users}
    
    result = []
    for item in hot_list:
        user = user_map.get(item["id"])
        if user:
            result.append({
                "id": item["id"],
                "score": item["score"],
                "username": user.username,
                "followers_count": user.followers_count
            })
    
    return {
        "success": True,
        "data": result
    }


@router.get("/total")
async def get_total_stats(
    current_admin: User = Depends(require_super_admin)
):
    """获取总体统计（仅管理员）"""
    stats = analytics_service.get_total_stats()
    
    return {
        "success": True,
        "data": stats
    }


@router.get("/redis/status")
async def get_redis_status(
    current_admin: User = Depends(require_super_admin)
):
    """获取Redis状态（仅管理员）"""
    return {
        "success": True,
        "data": {
            "enabled": redis_cache.is_enabled,
            "connected": redis_cache.is_enabled
        }
    }
