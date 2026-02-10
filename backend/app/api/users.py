from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from typing import List
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.record import Record
from app.schemas.auth import UserProfileResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/activity")
async def get_my_activity(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的活动数据（用于热力图）
    
    Args:
        days: 获取最近多少天的数据，默认30天
    """
    try:
        # 计算日期范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 查询每天创建的记录数
        activity_data = db.query(
            cast(Record.created_at, Date).label('date'),
            func.count(Record.id).label('count')
        ).filter(
            Record.user_id == current_user.id,
            Record.created_at >= start_date,
            Record.created_at <= end_date
        ).group_by(
            cast(Record.created_at, Date)
        ).order_by(
            cast(Record.created_at, Date)
        ).all()
        
        # 转换为字典便于查找
        activity_dict = {str(item.date): item.count for item in activity_data}
        
        # 填充所有日期（包括没有活动的日期）
        result = []
        for i in range(days):
            date = (end_date - timedelta(days=days-1-i)).date()
            date_str = date.strftime('%Y-%m-%d')
            result.append({
                'date': date_str,
                'count': activity_dict.get(date_str, 0)
            })
        
        return {
            'success': True,
            'data': result,
            'total_contributions': sum(item['count'] for item in result)
        }
    except Exception as e:
        logger.error(f"Get activity data failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取活动数据失败"
        )


@router.get("/me/stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的统计数据"""
    try:
        from app.models.experience import Experience
        from app.models.collection import Collection
        from app.models.like import Like
        from app.models.comment import Comment
        
        # 基础统计
        records_count = db.query(Record).filter(Record.user_id == current_user.id).count()
        experiences_count = db.query(Experience).filter(Experience.user_id == current_user.id).count()
        collections_count = db.query(Collection).filter(Collection.user_id == current_user.id).count()
        
        # 获取用户所有记录ID
        user_records = db.query(Record).filter(Record.user_id == current_user.id).all()
        record_ids = [r.id for r in user_records]
        
        # 获赞数和评论数
        likes_received = 0
        comments_received = 0
        if record_ids:
            likes_received = db.query(Like).filter(Like.record_id.in_(record_ids)).count()
            comments_received = db.query(Comment).filter(Comment.record_id.in_(record_ids)).count()
        
        # 连续创作天数
        streak_days = calculate_streak_days(current_user.id, db)
        
        return {
            'success': True,
            'data': {
                'records_count': records_count,
                'experiences_count': experiences_count,
                'collections_count': collections_count,
                'likes_received': likes_received,
                'comments_received': comments_received,
                'followers_count': current_user.followers_count,
                'following_count': current_user.following_count,
                'streak_days': streak_days,
            }
        }
    except Exception as e:
        logger.error(f"Get user stats failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户统计失败"
        )


def calculate_streak_days(user_id: str, db: Session) -> int:
    """计算连续创作天数"""
    try:
        # 获取所有有创作的日期
        activity_dates = db.query(
            cast(Record.created_at, Date).label('date')
        ).filter(
            Record.user_id == user_id
        ).distinct().order_by(
            cast(Record.created_at, Date).desc()
        ).all()
        
        if not activity_dates:
            return 0
        
        # 计算连续天数
        streak = 0
        today = datetime.now().date()
        
        for i, item in enumerate(activity_dates):
            date = item.date
            expected_date = today - timedelta(days=i)
            
            if date == expected_date:
                streak += 1
            elif date == today - timedelta(days=i+1):
                # 跳过了一天，继续计算
                streak += 1
            else:
                break
        
        return streak
    except Exception as e:
        logger.error(f"Calculate streak days failed: {e}")
        return 0


@router.get("/suggested")
async def get_suggested_users(
    limit: int = Query(10, ge=1, le=20, description="返回数量限制"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取推荐用户（用于@提及功能）
    
    推荐优先级：
    1. 我关注的人
    2. 关注我的人（粉丝）
    3. 活跃用户（最近有创作记录）
    """
    try:
        from app.models.follow import Follow
        
        suggested_users = []
        user_ids = set()
        
        # 1. 获取我关注的人
        following = db.query(Follow).filter(
            Follow.follower_id == current_user.id
        ).all()
        
        for follow in following:
            if follow.following_id not in user_ids:
                user = db.query(User).filter(User.id == follow.following_id).first()
                if user:
                    suggested_users.append({
                        "id": str(user.id),
                        "username": user.username,
                        "avatar": user.avatar,
                        "relation": "已关注"
                    })
                    user_ids.add(follow.following_id)
        
        # 2. 获取关注我的人（粉丝）
        if len(suggested_users) < limit:
            followers = db.query(Follow).filter(
                Follow.following_id == current_user.id
            ).all()
            
            for follow in followers:
                if follow.follower_id not in user_ids:
                    user = db.query(User).filter(User.id == follow.follower_id).first()
                    if user:
                        suggested_users.append({
                            "id": str(user.id),
                            "username": user.username,
                            "avatar": user.avatar,
                            "relation": "粉丝"
                        })
                        user_ids.add(follow.follower_id)
        
        # 3. 获取活跃用户（最近7天有创作记录的用户）
        if len(suggested_users) < limit:
            from datetime import datetime, timedelta
            
            active_users = db.query(
                Record.user_id,
                func.count(Record.id).label('record_count')
            ).filter(
                Record.created_at >= datetime.now() - timedelta(days=7),
                Record.user_id != current_user.id
            ).group_by(Record.user_id).order_by(
                func.count(Record.id).desc()
            ).limit(limit - len(suggested_users)).all()
            
            for user_record in active_users:
                if user_record.user_id not in user_ids:
                    user = db.query(User).filter(User.id == user_record.user_id).first()
                    if user:
                        suggested_users.append({
                            "id": str(user.id),
                            "username": user.username,
                            "avatar": user.avatar,
                            "relation": "活跃用户"
                        })
                        user_ids.add(user_record.user_id)
        
        return {
            "success": True,
            "data": suggested_users[:limit]
        }
    except Exception as e:
        logger.error(f"Get suggested users failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取推荐用户失败"
        )


@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1, max_length=50, description="搜索关键词"),
    limit: int = Query(10, ge=1, le=20, description="返回数量限制"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """搜索用户（用于@提及功能）
    
    按字符匹配排序，返回最相关的前N个用户
    """
    try:
        # 获取所有匹配的用户
        users = db.query(User).filter(
            User.username.ilike(f"%{q}%"),
            User.id != current_user.id  # 排除当前用户
        ).all()
        
        # 按匹配度排序（完全匹配 > 开头匹配 > 包含匹配）
        def sort_key(user):
            username = user.username.lower()
            query = q.lower()
            if username == query:
                return (0, username)  # 完全匹配
            elif username.startswith(query):
                return (1, username)  # 开头匹配
            else:
                return (2, username)  # 包含匹配
        
        sorted_users = sorted(users, key=sort_key)
        
        return {
            "success": True,
            "data": [
                {
                    "id": str(user.id),
                    "username": user.username,
                    "avatar": user.avatar
                }
                for user in sorted_users[:limit]
            ]
        }
    except Exception as e:
        logger.error(f"Search users failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="搜索用户失败"
        )


@router.get("/by-username/{username}/profile", response_model=UserProfileResponse)
async def get_user_profile_by_username(
    username: str,
    db: Session = Depends(get_db)
):
    """通过用户名获取指定用户的公开资料"""
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        from app.models.experience import Experience
        from app.models.collection import Collection
        from app.models.like import Like
        from app.models.comment import Comment
        
        # 统计数据
        records_count = db.query(Record).filter(Record.user_id == user.id).count()
        experiences_count = db.query(Experience).filter(Experience.user_id == user.id).count()
        collections_count = db.query(Collection).filter(Collection.user_id == user.id).count()
        
        # 获取用户所有记录
        user_records = db.query(Record).filter(Record.user_id == user.id).all()
        record_ids = [r.id for r in user_records]
        
        # 获赞数和评论数
        likes_received = 0
        comments_received = 0
        if record_ids:
            likes_received = db.query(Like).filter(Like.record_id.in_(record_ids)).count()
            comments_received = db.query(Comment).filter(Comment.record_id.in_(record_ids)).count()
        
        return UserProfileResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            avatar=user.avatar,
            bio=user.bio,
            location=user.location,
            website=user.website,
            followers_count=user.followers_count,
            following_count=user.following_count,
            records_count=records_count,
            experiences_count=experiences_count,
            collections_count=collections_count,
            likes_received=likes_received,
            comments_received=comments_received
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user profile by username failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户资料失败"
        )


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """获取指定用户的公开资料"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        from app.models.experience import Experience
        from app.models.collection import Collection
        from app.models.like import Like
        from app.models.comment import Comment
        
        # 统计数据
        records_count = db.query(Record).filter(Record.user_id == user.id).count()
        experiences_count = db.query(Experience).filter(Experience.user_id == user.id).count()
        collections_count = db.query(Collection).filter(Collection.user_id == user.id).count()
        
        # 获取用户所有记录
        user_records = db.query(Record).filter(Record.user_id == user.id).all()
        record_ids = [r.id for r in user_records]
        
        # 获赞数和评论数
        likes_received = 0
        comments_received = 0
        if record_ids:
            likes_received = db.query(Like).filter(Like.record_id.in_(record_ids)).count()
            comments_received = db.query(Comment).filter(Comment.record_id.in_(record_ids)).count()
        
        return UserProfileResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            avatar=user.avatar,
            bio=user.bio,
            location=user.location,
            website=user.website,
            followers_count=user.followers_count,
            following_count=user.following_count,
            records_count=records_count,
            experiences_count=experiences_count,
            collections_count=collections_count,
            likes_received=likes_received,
            comments_received=comments_received
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user profile failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户资料失败"
        )
