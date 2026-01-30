from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.core.redis import redis_cache
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """访问统计服务"""
    
    # Redis key 前缀
    PAGE_VIEW_KEY = "analytics:pageview:{content_type}:{content_id}"
    DAILY_PAGE_VIEW_KEY = "analytics:daily:{date}:{content_type}:{content_id}"
    UNIQUE_VISITOR_KEY = "analytics:uv:{content_type}:{content_id}:{date}"
    TOTAL_PV_KEY = "analytics:total:pv"
    TOTAL_UV_KEY = "analytics:total:uv:{date}"
    
    # 排行榜 key
    HOT_RECORDS_KEY = "analytics:hot:records"
    HOT_EXPERIENCES_KEY = "analytics:hot:experiences"
    HOT_COLLECTIONS_KEY = "analytics:hot:collections"
    HOT_USERS_KEY = "analytics:hot:users"
    
    def __init__(self):
        self.enabled = redis_cache.is_enabled
    
    def _get_today(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")
    
    def record_page_view(
        self,
        content_type: str,  # record, experience, collection, user
        content_id: str,
        visitor_id: Optional[str] = None
    ) -> int:
        """记录页面浏览"""
        if not self.enabled:
            return 0
        
        try:
            today = self._get_today()
            
            # 总浏览量
            pv_key = self.PAGE_VIEW_KEY.format(content_type=content_type, content_id=content_id)
            current_pv = redis_cache.increment(pv_key)
            
            # 每日浏览量
            daily_key = self.DAILY_PAGE_VIEW_KEY.format(
                date=today, content_type=content_type, content_id=content_id
            )
            redis_cache.increment(daily_key)
            redis_cache.expire(daily_key, 7 * 24 * 3600)  # 保留7天
            
            # 独立访客
            if visitor_id:
                uv_key = self.UNIQUE_VISITOR_KEY.format(
                    content_type=content_type, content_id=content_id, date=today
                )
                redis_cache.sadd(uv_key, visitor_id)
                redis_cache.expire(uv_key, 7 * 24 * 3600)
            
            # 更新热门排行榜
            self._update_hot_ranking(content_type, content_id, 1)
            
            # 总PV统计
            redis_cache.increment(self.TOTAL_PV_KEY)
            
            return current_pv or 0
            
        except Exception as e:
            logger.error(f"Failed to record page view: {e}")
            return 0
    
    def _update_hot_ranking(self, content_type: str, content_id: str, score: int):
        """更新热门排行榜"""
        ranking_map = {
            "record": self.HOT_RECORDS_KEY,
            "experience": self.HOT_EXPERIENCES_KEY,
            "collection": self.HOT_COLLECTIONS_KEY,
            "user": self.HOT_USERS_KEY
        }
        
        ranking_key = ranking_map.get(content_type)
        if ranking_key:
            redis_cache.zincrby(ranking_key, score, content_id)
            # 设置过期时间（30天）
            redis_cache.expire(ranking_key, 30 * 24 * 3600)
    
    def get_page_view(self, content_type: str, content_id: str) -> int:
        """获取页面浏览量"""
        if not self.enabled:
            return 0
        
        try:
            pv_key = self.PAGE_VIEW_KEY.format(content_type=content_type, content_id=content_id)
            value = redis_cache.get(pv_key)
            return int(value) if value else 0
        except Exception as e:
            logger.error(f"Failed to get page view: {e}")
            return 0
    
    def get_daily_page_view(self, content_type: str, content_id: str, date: Optional[str] = None) -> int:
        """获取每日页面浏览量"""
        if not self.enabled:
            return 0
        
        try:
            if date is None:
                date = self._get_today()
            
            daily_key = self.DAILY_PAGE_VIEW_KEY.format(
                date=date, content_type=content_type, content_id=content_id
            )
            value = redis_cache.get(daily_key)
            return int(value) if value else 0
        except Exception as e:
            logger.error(f"Failed to get daily page view: {e}")
            return 0
    
    def get_unique_visitor_count(self, content_type: str, content_id: str, date: Optional[str] = None) -> int:
        """获取独立访客数"""
        if not self.enabled:
            return 0
        
        try:
            if date is None:
                date = self._get_today()
            
            uv_key = self.UNIQUE_VISITOR_KEY.format(
                content_type=content_type, content_id=content_id, date=date
            )
            return redis_cache.scard(uv_key)
        except Exception as e:
            logger.error(f"Failed to get unique visitor count: {e}")
            return 0
    
    def get_content_stats(self, content_type: str, content_id: str) -> Dict:
        """获取内容统计信息"""
        today = self._get_today()
        
        return {
            "total_views": self.get_page_view(content_type, content_id),
            "today_views": self.get_daily_page_view(content_type, content_id, today),
            "today_unique_visitors": self.get_unique_visitor_count(content_type, content_id, today)
        }
    
    def get_hot_contents(self, content_type: str, limit: int = 10) -> List[Dict]:
        """获取热门内容排行榜"""
        if not self.enabled:
            return []
        
        try:
            ranking_map = {
                "record": self.HOT_RECORDS_KEY,
                "experience": self.HOT_EXPERIENCES_KEY,
                "collection": self.HOT_COLLECTIONS_KEY,
                "user": self.HOT_USERS_KEY
            }
            
            ranking_key = ranking_map.get(content_type)
            if not ranking_key:
                return []
            
            results = redis_cache.zrevrange(ranking_key, 0, limit - 1, withscores=True)
            
            return [
                {"id": content_id, "score": int(score)}
                for content_id, score in results
            ]
        except Exception as e:
            logger.error(f"Failed to get hot contents: {e}")
            return []
    
    def get_hot_records(self, limit: int = 10) -> List[Dict]:
        """获取热门记录"""
        return self.get_hot_contents("record", limit)
    
    def get_hot_experiences(self, limit: int = 10) -> List[Dict]:
        """获取热门经历"""
        return self.get_hot_contents("experience", limit)
    
    def get_hot_collections(self, limit: int = 10) -> List[Dict]:
        """获取热门收藏"""
        return self.get_hot_contents("collection", limit)
    
    def get_hot_users(self, limit: int = 10) -> List[Dict]:
        """获取热门用户"""
        return self.get_hot_contents("user", limit)
    
    def get_total_stats(self) -> Dict:
        """获取总体统计"""
        if not self.enabled:
            return {"total_pv": 0, "today_pv": 0, "today_uv": 0}
        
        try:
            today = self._get_today()
            total_pv = redis_cache.get(self.TOTAL_PV_KEY) or 0
            today_uv = redis_cache.scard(self.TOTAL_UV_KEY.format(date=today))
            
            return {
                "total_pv": int(total_pv),
                "today_uv": today_uv
            }
        except Exception as e:
            logger.error(f"Failed to get total stats: {e}")
            return {"total_pv": 0, "today_pv": 0, "today_uv": 0}
    
    def record_user_visit(self, user_id: str):
        """记录用户访问（用于统计今日UV）"""
        if not self.enabled:
            return
        
        try:
            today = self._get_today()
            uv_key = self.TOTAL_UV_KEY.format(date=today)
            redis_cache.sadd(uv_key, user_id)
            redis_cache.expire(uv_key, 2 * 24 * 3600)  # 保留2天
        except Exception as e:
            logger.error(f"Failed to record user visit: {e}")


# 全局统计服务实例
analytics_service = AnalyticsService()
