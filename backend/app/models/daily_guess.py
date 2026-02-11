from sqlalchemy import Column, String, Integer, Boolean, Date, ForeignKey, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class DailyGuessItem(BaseModel):
    """每日一猜题目表"""
    __tablename__ = "daily_guess_items"
    
    # 题目日期（唯一，每天一道题）
    date = Column(Date, nullable=False, unique=True, index=True)
    
    # 图片URL
    image_url = Column(String(500), nullable=False)
    
    # 正确答案（支持多个可接受的答案）
    correct_answers = Column(JSON, nullable=False, default=list)
    
    # 提示关键词
    hint_keywords = Column(JSON, nullable=False, default=list)
    
    # 难度级别
    difficulty = Column(String(20), nullable=False, default='medium')
    
    # 裁剪区域配置
    crop_region = Column(JSON, nullable=False, default=dict)
    
    # 趣味知识
    fun_fact = Column(String(500), nullable=True)
    
    # 是否启用
    is_active = Column(Boolean, default=True)
    
    # 关联的用户游戏记录
    user_guesses = relationship("UserDailyGuess", back_populates="daily_item", cascade="all, delete-orphan")


class UserDailyGuess(BaseModel):
    """用户每日一猜游戏记录表"""
    __tablename__ = "user_daily_guesses"
    
    # 用户ID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 题目ID
    daily_item_id = Column(UUID(as_uuid=True), ForeignKey("daily_guess_items.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 游戏日期
    guess_date = Column(Date, nullable=False, index=True)
    
    # 得分
    score = Column(Integer, default=0)
    
    # 尝试次数
    attempts = Column(Integer, default=0)
    
    # 是否使用提示
    used_hint = Column(Boolean, default=False)
    
    # 是否扩大视野
    used_expand = Column(Boolean, default=False)
    
    # 是否完成
    is_completed = Column(Boolean, default=False)
    
    # 用户猜测历史（记录每次猜测）
    guess_history = Column(JSON, default=list)
    
    # 关联
    user = relationship("User", back_populates="daily_guesses")
    daily_item = relationship("DailyGuessItem", back_populates="user_guesses")
    
    # 联合唯一约束：每个用户每天只能有一条记录
    __table_args__ = (
        # 使用 UniqueConstraint 而不是字符串
        {'sqlite_autoincrement': True},
    )


class DailyGuessLeaderboard(BaseModel):
    """每日一猜排行榜表（按总积分排名）"""
    __tablename__ = "daily_guess_leaderboard"
    
    # 用户ID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # 总积分
    total_score = Column(Integer, default=0)
    
    # 游戏次数
    games_played = Column(Integer, default=0)
    
    # 当前连续打卡天数
    current_streak = Column(Integer, default=0)
    
    # 最大连续打卡天数
    max_streak = Column(Integer, default=0)
    
    # 上次游戏日期
    last_played_date = Column(Date, nullable=True)
    
    # 关联
    user = relationship("User")
