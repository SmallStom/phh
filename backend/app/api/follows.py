from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.follow import Follow
from app.schemas.follow import (
    FollowCreate, FollowResponse, FollowWithUserResponse, 
    FollowStats, FollowListResponse, FollowUserInfo
)
from app.core.notification import notification_service
from app.core.analytics import analytics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/follows", tags=["follows"])


@router.post("", response_model=FollowResponse)
async def follow_user(
    follow_data: FollowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """关注用户"""
    # 不能关注自己
    if str(current_user.id) == follow_data.following_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能关注自己"
        )
    
    # 检查目标用户是否存在
    target_user = db.query(User).filter(User.id == follow_data.following_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查是否已关注
    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == follow_data.following_id
    ).first()
    
    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经关注该用户"
        )
    
    # 创建关注关系
    follow = Follow(
        follower_id=current_user.id,
        following_id=follow_data.following_id
    )
    db.add(follow)
    db.commit()
    db.refresh(follow)
    
    # 发送站内通知
    try:
        notification_service.notify_follow(
            db=db,
            recipient_id=str(target_user.id),
            sender_id=str(current_user.id),
            sender_name=current_user.username
        )
    except Exception as e:
        logger.error(f"Failed to create follow notification: {e}")
    
    return follow


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消关注"""
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未关注该用户"
        )
    
    db.delete(follow)
    db.commit()
    
    return None


@router.get("/stats/{user_id}", response_model=FollowStats)
async def get_follow_stats(
    user_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户关注统计"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    is_following = False
    if current_user and str(current_user.id) != user_id:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        ).first() is not None
    
    return FollowStats(
        following_count=user.following_count,
        followers_count=user.followers_count,
        is_following=is_following
    )


@router.get("/following/{user_id}", response_model=FollowListResponse)
async def get_following_list(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取用户的关注列表"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    query = db.query(Follow).options(
        joinedload(Follow.following)
    ).filter(Follow.follower_id == user_id)
    
    total = query.count()
    follows = query.order_by(Follow.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    data = []
    for follow in follows:
        item = FollowWithUserResponse.model_validate(follow)
        if follow.following:
            item.following = FollowUserInfo.model_validate(follow.following)
        data.append(item)
    
    return FollowListResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/followers/{user_id}", response_model=FollowListResponse)
async def get_followers_list(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取用户的粉丝列表"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    query = db.query(Follow).options(
        joinedload(Follow.follower)
    ).filter(Follow.following_id == user_id)
    
    total = query.count()
    follows = query.order_by(Follow.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    data = []
    for follow in follows:
        item = FollowWithUserResponse.model_validate(follow)
        if follow.follower:
            item.follower = FollowUserInfo.model_validate(follow.follower)
        data.append(item)
    
    return FollowListResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/check/{user_id}")
async def check_follow_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """检查是否关注了某用户"""
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first() is not None
    
    return {"is_following": is_following}
