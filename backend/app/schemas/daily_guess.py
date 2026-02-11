from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID


class CropRegion(BaseModel):
    """裁剪区域配置"""
    x: float
    y: float
    width: float
    height: float


class DailyGuessItemBase(BaseModel):
    """每日题目基础 Schema"""
    image_url: str
    correct_answers: List[str]
    hint_keywords: List[str]
    difficulty: str = "medium"
    crop_region: CropRegion
    fun_fact: Optional[str] = None


class DailyGuessItemCreate(DailyGuessItemBase):
    """创建题目 Schema"""
    date: date


class DailyGuessItemResponse(BaseModel):
    """返回给前端的题目数据（不包含正确答案）"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    date: date
    image_url: str
    hint_keywords: List[str]
    difficulty: str
    crop_region: CropRegion
    fun_fact: Optional[str] = None


class DailyGuessItemAdminResponse(DailyGuessItemBase):
    """管理员查看的题目数据（包含正确答案）"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    date: date
    is_active: bool
    created_at: datetime


class GuessSubmitRequest(BaseModel):
    """提交答案请求"""
    guess: str


class GuessResultResponse(BaseModel):
    """猜测结果响应"""
    is_correct: bool
    similarity: float
    score: Optional[int] = None
    attempts: int
    is_completed: bool
    message: str


class UseHintRequest(BaseModel):
    """使用提示请求"""
    pass


class UseHintResponse(BaseModel):
    """使用提示响应"""
    success: bool
    hint_keywords: List[str]
    score_deduction: int = 30


class ExpandViewRequest(BaseModel):
    """扩大视野请求"""
    pass


class ExpandViewResponse(BaseModel):
    """扩大视野响应"""
    success: bool
    new_crop_region: CropRegion
    score_deduction: int = 10


class UserGameStats(BaseModel):
    """用户游戏统计"""
    current_streak: int
    max_streak: int
    total_score: int
    games_played: int
    today_completed: bool
    today_score: Optional[int] = None
    today_attempts: int = 0
    today_used_hint: bool = False
    today_used_expand: bool = False


class LeaderboardEntry(BaseModel):
    """排行榜条目"""
    rank: int
    user_id: UUID
    username: str
    avatar: Optional[str] = None
    total_score: int
    games_played: int
    current_streak: int


class LeaderboardResponse(BaseModel):
    """排行榜响应"""
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None
    total_players: int


class GameHistoryItem(BaseModel):
    """游戏历史记录项"""
    model_config = ConfigDict(from_attributes=True)
    
    date: date
    score: int
    attempts: int
    used_hint: bool
    used_expand: bool
    is_completed: bool


class GameHistoryResponse(BaseModel):
    """游戏历史响应"""
    history: List[GameHistoryItem]
    total_count: int
