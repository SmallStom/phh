from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.daily_guess import DailyGuessItem, UserDailyGuess
from app.schemas.daily_guess import (
    DailyGuessItemResponse,
    DailyGuessItemCreate,
    DailyGuessItemAdminResponse,
    GuessSubmitRequest,
    GuessResultResponse,
    UseHintResponse,
    ExpandViewResponse,
    UserGameStats,
    LeaderboardResponse,
    GameHistoryResponse,
    GameHistoryItem,
    CropRegion,
)
from app.core.daily_guess import (
    get_today_item,
    get_or_create_user_guess,
    check_answer,
    calculate_score,
    update_streak,
    update_leaderboard_score,
    expand_crop_region,
    get_leaderboard,
    get_user_rank,
    get_user_game_history,
    get_user_stats,
)

router = APIRouter(prefix="/api/daily-guess", tags=["daily-guess"])


@router.get("/today", response_model=DailyGuessItemResponse)
async def get_today_guess(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取今日题目
    返回题目信息，但不包含正确答案
    """
    today_item = get_today_item(db)
    
    if not today_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="今日题目尚未发布，请稍后再试"
        )
    
    # 获取或创建用户游戏记录
    get_or_create_user_guess(db, str(current_user.id), str(today_item.id))
    
    return DailyGuessItemResponse.model_validate(today_item)


@router.post("/submit", response_model=GuessResultResponse)
async def submit_guess(
    request: GuessSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    提交答案
    """
    today_item = get_today_item(db)
    
    if not today_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="今日题目尚未发布"
        )
    
    # 获取用户游戏记录
    user_guess = get_or_create_user_guess(db, str(current_user.id), str(today_item.id))
    
    # 如果已经完成，不允许再次提交
    if user_guess.is_completed:
        return GuessResultResponse(
            is_correct=True,
            similarity=100.0,
            score=user_guess.score,
            attempts=user_guess.attempts,
            is_completed=True,
            message="您已经完成今日挑战！"
        )
    
    # 检查答案
    is_correct, similarity = check_answer(request.guess, today_item.correct_answers)
    
    # 更新尝试次数
    user_guess.attempts += 1
    
    # 记录猜测历史
    if user_guess.guess_history is None:
        user_guess.guess_history = []
    
    user_guess.guess_history.append({
        "guess": request.guess,
        "similarity": similarity,
        "timestamp": date.today().isoformat()
    })
    
    score = None
    message = ""
    
    if is_correct:
        # 计算得分
        score = calculate_score(
            user_guess.attempts,
            user_guess.used_hint,
            user_guess.used_expand
        )
        
        # 更新游戏记录
        user_guess.score = score
        user_guess.is_completed = True
        
        # 更新连续打卡
        update_streak(db, str(current_user.id))
        
        # 更新排行榜
        update_leaderboard_score(db, str(current_user.id), score)
        
        if user_guess.attempts == 1:
            message = "太棒了！一次就猜对了！"
        elif user_guess.attempts <= 3:
            message = f"恭喜猜对了！用了 {user_guess.attempts} 次尝试"
        else:
            message = "终于猜对了！不容易啊！"
    else:
        if similarity >= 60:
            message = "很接近了！再想想..."
        elif similarity >= 40:
            message = "有点思路，但还不对..."
        else:
            message = "不对哦，再试试看！"
    
    db.commit()
    db.refresh(user_guess)
    
    return GuessResultResponse(
        is_correct=is_correct,
        similarity=similarity,
        score=score,
        attempts=user_guess.attempts,
        is_completed=user_guess.is_completed,
        message=message
    )


@router.post("/hint", response_model=UseHintResponse)
async def use_hint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    使用提示功能
    扣除30分，显示提示关键词
    """
    today_item = get_today_item(db)
    
    if not today_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="今日题目尚未发布"
        )
    
    user_guess = get_or_create_user_guess(db, str(current_user.id), str(today_item.id))
    
    # 如果已经完成，不允许使用提示
    if user_guess.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经完成今日挑战，无法使用提示"
        )
    
    # 如果已经使用过提示
    if user_guess.used_hint:
        return UseHintResponse(
            success=True,
            hint_keywords=today_item.hint_keywords,
            score_deduction=0
        )
    
    # 标记已使用提示
    user_guess.used_hint = True
    db.commit()
    
    return UseHintResponse(
        success=True,
        hint_keywords=today_item.hint_keywords,
        score_deduction=30
    )


@router.post("/expand", response_model=ExpandViewResponse)
async def expand_view(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    扩大视野功能
    扣除10分，扩大裁剪区域
    """
    today_item = get_today_item(db)
    
    if not today_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="今日题目尚未发布"
        )
    
    user_guess = get_or_create_user_guess(db, str(current_user.id), str(today_item.id))
    
    # 如果已经完成，不允许扩大视野
    if user_guess.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经完成今日挑战，无法扩大视野"
        )
    
    # 如果已经扩大过视野
    if user_guess.used_expand:
        original_crop = CropRegion(**today_item.crop_region)
        new_crop = expand_crop_region(original_crop)
        return ExpandViewResponse(
            success=True,
            new_crop_region=new_crop,
            score_deduction=0
        )
    
    # 标记已扩大视野
    user_guess.used_expand = True
    db.commit()
    
    # 计算新的裁剪区域
    original_crop = CropRegion(**today_item.crop_region)
    new_crop = expand_crop_region(original_crop)
    
    return ExpandViewResponse(
        success=True,
        new_crop_region=new_crop,
        score_deduction=10
    )


@router.get("/stats", response_model=UserGameStats)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户游戏统计
    """
    stats = get_user_stats(db, str(current_user.id))
    return UserGameStats(**stats)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard_data(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取排行榜
    """
    entries = get_leaderboard(db, limit)
    user_rank = get_user_rank(db, str(current_user.id))
    total_players = db.query(DailyGuessLeaderboard).count()
    
    return LeaderboardResponse(
        entries=entries,
        user_rank=user_rank,
        total_players=total_players
    )


@router.get("/history", response_model=GameHistoryResponse)
async def get_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户游戏历史
    """
    history = get_user_game_history(db, str(current_user.id), limit)
    
    history_items = [
        GameHistoryItem(
            date=item.guess_date,
            score=item.score,
            attempts=item.attempts,
            used_hint=item.used_hint,
            used_expand=item.used_expand,
            is_completed=item.is_completed
        )
        for item in history
    ]
    
    return GameHistoryResponse(
        history=history_items,
        total_count=len(history_items)
    )


# ==================== 管理后台接口 ====================

@router.post("/admin/items", response_model=DailyGuessItemAdminResponse)
async def create_item(
    item: DailyGuessItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建新题目（管理员）
    """
    # 检查权限
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问"
        )
    
    # 检查日期是否已存在
    existing = db.query(DailyGuessItem).filter(DailyGuessItem.date == item.date).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该日期已有题目"
        )
    
    new_item = DailyGuessItem(
        date=item.date,
        image_url=item.image_url,
        correct_answers=item.correct_answers,
        hint_keywords=item.hint_keywords,
        difficulty=item.difficulty,
        crop_region=item.crop_region.model_dump(),
        fun_fact=item.fun_fact,
        is_active=True
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return DailyGuessItemAdminResponse.model_validate(new_item)


@router.get("/admin/items", response_model=List[DailyGuessItemAdminResponse])
async def list_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取题目列表（管理员）
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问"
        )
    
    items = db.query(DailyGuessItem).order_by(DailyGuessItem.date.desc()).offset(skip).limit(limit).all()
    return [DailyGuessItemAdminResponse.model_validate(item) for item in items]


@router.put("/admin/items/{item_id}", response_model=DailyGuessItemAdminResponse)
async def update_item(
    item_id: str,
    item_update: DailyGuessItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新题目（管理员）
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问"
        )
    
    db_item = db.query(DailyGuessItem).filter(DailyGuessItem.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="题目不存在"
        )
    
    db_item.image_url = item_update.image_url
    db_item.correct_answers = item_update.correct_answers
    db_item.hint_keywords = item_update.hint_keywords
    db_item.difficulty = item_update.difficulty
    db_item.crop_region = item_update.crop_region.model_dump()
    db_item.fun_fact = item_update.fun_fact
    
    db.commit()
    db.refresh(db_item)
    
    return DailyGuessItemAdminResponse.model_validate(db_item)


@router.delete("/admin/items/{item_id}")
async def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除题目（管理员）
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问"
        )
    
    db_item = db.query(DailyGuessItem).filter(DailyGuessItem.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="题目不存在"
        )
    
    db.delete(db_item)
    db.commit()
    
    return {"message": "题目已删除"}
