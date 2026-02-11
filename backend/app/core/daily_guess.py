"""
每日一猜游戏核心逻辑模块
"""
from difflib import SequenceMatcher
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.daily_guess import DailyGuessItem, UserDailyGuess, DailyGuessLeaderboard
from app.models.user import User
from app.schemas.daily_guess import CropRegion


def calculate_similarity(a: str, b: str) -> float:
    """
    计算两个字符串的相似度（0-100）
    使用 SequenceMatcher 进行模糊匹配
    """
    a = a.lower().strip()
    b = b.lower().strip()
    
    # 完全匹配
    if a == b:
        return 100.0
    
    # 包含关系
    if a in b or b in a:
        return 85.0
    
    # 使用 SequenceMatcher 计算相似度
    similarity = SequenceMatcher(None, a, b).ratio() * 100
    return round(similarity, 1)


def check_answer(user_guess: str, correct_answers: List[str]) -> Tuple[bool, float]:
    """
    检查用户答案是否正确
    
    Args:
        user_guess: 用户的猜测
        correct_answers: 正确答案列表
        
    Returns:
        (是否正确, 最高相似度)
    """
    max_similarity = 0.0
    
    for answer in correct_answers:
        similarity = calculate_similarity(user_guess, answer)
        max_similarity = max(max_similarity, similarity)
        
        # 相似度超过 80% 认为是正确的
        if similarity >= 80:
            return True, similarity
    
    return False, max_similarity


def calculate_score(attempts: int, used_hint: bool, used_expand: bool) -> int:
    """
    计算游戏得分
    
    基础分：100分
    - 第1次猜对：+0分
    - 第2次猜对：-10分
    - 第3次猜对：-20分
    - 第4次及以上：-30分
    
    扣分项：
    - 使用提示：-30分
    - 扩大视野：-10分
    
    最低分：10分
    """
    base_score = 100
    
    # 根据尝试次数扣分
    if attempts == 1:
        attempt_penalty = 0
    elif attempts == 2:
        attempt_penalty = 10
    elif attempts == 3:
        attempt_penalty = 20
    else:
        attempt_penalty = 30
    
    # 使用道具扣分
    hint_penalty = 30 if used_hint else 0
    expand_penalty = 10 if used_expand else 0
    
    final_score = base_score - attempt_penalty - hint_penalty - expand_penalty
    
    # 最低10分
    return max(final_score, 10)


def get_today_item(db: Session) -> Optional[DailyGuessItem]:
    """获取今日题目"""
    today = date.today()
    return db.query(DailyGuessItem).filter(
        DailyGuessItem.date == today,
        DailyGuessItem.is_active == True
    ).first()


def get_or_create_user_guess(
    db: Session, 
    user_id: str, 
    daily_item_id: str
) -> UserDailyGuess:
    """
    获取或创建用户今日游戏记录
    """
    today = date.today()
    
    user_guess = db.query(UserDailyGuess).filter(
        UserDailyGuess.user_id == user_id,
        UserDailyGuess.guess_date == today
    ).first()
    
    if not user_guess:
        user_guess = UserDailyGuess(
            user_id=user_id,
            daily_item_id=daily_item_id,
            guess_date=today,
            score=0,
            attempts=0,
            used_hint=False,
            used_expand=False,
            is_completed=False,
            guess_history=[]
        )
        db.add(user_guess)
        db.commit()
        db.refresh(user_guess)
    
    return user_guess


def update_streak(db: Session, user_id: str) -> int:
    """
    更新用户连续打卡天数
    返回新的连续打卡天数
    """
    leaderboard = db.query(DailyGuessLeaderboard).filter(
        DailyGuessLeaderboard.user_id == user_id
    ).first()
    
    if not leaderboard:
        leaderboard = DailyGuessLeaderboard(
            user_id=user_id,
            total_score=0,
            games_played=0,
            current_streak=1,
            max_streak=1,
            last_played_date=date.today()
        )
        db.add(leaderboard)
        db.commit()
        return 1
    
    today = date.today()
    last_date = leaderboard.last_played_date
    
    if last_date:
        diff_days = (today - last_date).days
        
        if diff_days == 1:
            # 连续打卡
            leaderboard.current_streak += 1
        elif diff_days > 1:
            # 中断后重新开始
            leaderboard.current_streak = 1
        # diff_days == 0 表示今天已经玩过了，不更新
    else:
        leaderboard.current_streak = 1
    
    # 更新最大连续天数
    leaderboard.max_streak = max(leaderboard.max_streak, leaderboard.current_streak)
    leaderboard.last_played_date = today
    
    db.commit()
    db.refresh(leaderboard)
    
    return leaderboard.current_streak


def update_leaderboard_score(db: Session, user_id: str, score: int):
    """
    更新用户排行榜积分
    """
    leaderboard = db.query(DailyGuessLeaderboard).filter(
        DailyGuessLeaderboard.user_id == user_id
    ).first()
    
    if not leaderboard:
        leaderboard = DailyGuessLeaderboard(
            user_id=user_id,
            total_score=score,
            games_played=1,
            current_streak=1,
            max_streak=1,
            last_played_date=date.today()
        )
        db.add(leaderboard)
    else:
        leaderboard.total_score += score
        leaderboard.games_played += 1
    
    db.commit()


def expand_crop_region(original: CropRegion) -> CropRegion:
    """
    扩大裁剪区域（各边减少10%）
    """
    return CropRegion(
        x=max(0, original.x - 10),
        y=max(0, original.y - 10),
        width=min(100, original.width + 20),
        height=min(100, original.height + 20)
    )


def get_leaderboard(db: Session, limit: int = 100) -> List[dict]:
    """
    获取排行榜数据
    """
    results = db.query(
        DailyGuessLeaderboard,
        User.username,
        User.avatar
    ).join(
        User, DailyGuessLeaderboard.user_id == User.id
    ).order_by(
        DailyGuessLeaderboard.total_score.desc()
    ).limit(limit).all()
    
    leaderboard = []
    for rank, (entry, username, avatar) in enumerate(results, 1):
        leaderboard.append({
            "rank": rank,
            "user_id": entry.user_id,
            "username": username,
            "avatar": avatar,
            "total_score": entry.total_score,
            "games_played": entry.games_played,
            "current_streak": entry.current_streak
        })
    
    return leaderboard


def get_user_rank(db: Session, user_id: str) -> Optional[int]:
    """
    获取用户排名
    """
    user_score = db.query(DailyGuessLeaderboard).filter(
        DailyGuessLeaderboard.user_id == user_id
    ).first()
    
    if not user_score:
        return None
    
    # 计算排名（分数更高的用户数 + 1）
    rank = db.query(DailyGuessLeaderboard).filter(
        DailyGuessLeaderboard.total_score > user_score.total_score
    ).count() + 1
    
    return rank


def get_user_game_history(
    db: Session, 
    user_id: str, 
    limit: int = 30
) -> List[UserDailyGuess]:
    """
    获取用户游戏历史
    """
    return db.query(UserDailyGuess).filter(
        UserDailyGuess.user_id == user_id,
        UserDailyGuess.is_completed == True
    ).order_by(
        UserDailyGuess.guess_date.desc()
    ).limit(limit).all()


def get_user_stats(db: Session, user_id: str) -> dict:
    """
    获取用户游戏统计
    """
    leaderboard = db.query(DailyGuessLeaderboard).filter(
        DailyGuessLeaderboard.user_id == user_id
    ).first()
    
    today = date.today()
    today_guess = db.query(UserDailyGuess).filter(
        UserDailyGuess.user_id == user_id,
        UserDailyGuess.guess_date == today
    ).first()
    
    return {
        "current_streak": leaderboard.current_streak if leaderboard else 0,
        "max_streak": leaderboard.max_streak if leaderboard else 0,
        "total_score": leaderboard.total_score if leaderboard else 0,
        "games_played": leaderboard.games_played if leaderboard else 0,
        "today_completed": today_guess.is_completed if today_guess else False,
        "today_score": today_guess.score if today_guess else None,
        "today_attempts": today_guess.attempts if today_guess else 0,
        "today_used_hint": today_guess.used_hint if today_guess else False,
        "today_used_expand": today_guess.used_expand if today_guess else False,
    }
