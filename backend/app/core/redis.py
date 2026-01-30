import redis
import json
import pickle
from typing import Optional, Any, Union
from app.config import settings

class RedisCache:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._redis: Optional[redis.Redis] = None
        self._enabled = settings.REDIS_ENABLED
        
        if self._enabled:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=False,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    health_check_interval=30
                )
                self._redis.ping()
                print("✅ Redis connected successfully")
            except Exception as e:
                print(f"⚠️ Redis connection failed: {e}")
                self._enabled = False
                self._redis = None
    
    @property
    def is_enabled(self) -> bool:
        return self._enabled and self._redis is not None
    
    def get(self, key: str) -> Optional[Any]:
        if not self.is_enabled:
            return None
        try:
            data = self._redis.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    def set(
        self, 
        key: str, 
        value: Any, 
        expire: Optional[int] = None,
        nx: bool = False
    ) -> bool:
        if not self.is_enabled:
            return False
        try:
            data = pickle.dumps(value)
            return self._redis.set(key, data, ex=expire, nx=nx)
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        if not self.is_enabled:
            return False
        try:
            return self._redis.delete(key) > 0
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        if not self.is_enabled:
            return False
        try:
            return self._redis.exists(key) > 0
        except Exception as e:
            print(f"Redis exists error: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        if not self.is_enabled:
            return None
        try:
            return self._redis.incrby(key, amount)
        except Exception as e:
            print(f"Redis increment error: {e}")
            return None
    
    def expire(self, key: str, seconds: int) -> bool:
        if not self.is_enabled:
            return False
        try:
            return self._redis.expire(key, seconds)
        except Exception as e:
            print(f"Redis expire error: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        if not self.is_enabled:
            return -2
        try:
            return self._redis.ttl(key)
        except Exception as e:
            print(f"Redis ttl error: {e}")
            return -2
    
    def keys(self, pattern: str) -> list:
        if not self.is_enabled:
            return []
        try:
            return [k.decode('utf-8') if isinstance(k, bytes) else k 
                    for k in self._redis.keys(pattern)]
        except Exception as e:
            print(f"Redis keys error: {e}")
            return []
    
    def delete_pattern(self, pattern: str) -> int:
        if not self.is_enabled:
            return 0
        try:
            keys = self._redis.keys(pattern)
            if keys:
                return self._redis.delete(*keys)
            return 0
        except Exception as e:
            print(f"Redis delete_pattern error: {e}")
            return 0
    
    def flush_all(self) -> bool:
        if not self.is_enabled:
            return False
        try:
            self._redis.flushall()
            return True
        except Exception as e:
            print(f"Redis flush_all error: {e}")
            return False
    
    # 集合操作
    def sadd(self, key: str, *members) -> int:
        if not self.is_enabled:
            return 0
        try:
            return self._redis.sadd(key, *members)
        except Exception as e:
            print(f"Redis sadd error: {e}")
            return 0
    
    def srem(self, key: str, *members) -> int:
        if not self.is_enabled:
            return 0
        try:
            return self._redis.srem(key, *members)
        except Exception as e:
            print(f"Redis srem error: {e}")
            return 0
    
    def smembers(self, key: str) -> set:
        if not self.is_enabled:
            return set()
        try:
            members = self._redis.smembers(key)
            return {m.decode('utf-8') if isinstance(m, bytes) else m for m in members}
        except Exception as e:
            print(f"Redis smembers error: {e}")
            return set()
    
    def sismember(self, key: str, member) -> bool:
        if not self.is_enabled:
            return False
        try:
            return self._redis.sismember(key, member)
        except Exception as e:
            print(f"Redis sismember error: {e}")
            return False
    
    def scard(self, key: str) -> int:
        if not self.is_enabled:
            return 0
        try:
            return self._redis.scard(key)
        except Exception as e:
            print(f"Redis scard error: {e}")
            return 0
    
    # 有序集合操作（用于排行榜）
    def zadd(self, key: str, mapping: dict) -> int:
        if not self.is_enabled:
            return 0
        try:
            return self._redis.zadd(key, mapping)
        except Exception as e:
            print(f"Redis zadd error: {e}")
            return 0
    
    def zincrby(self, key: str, amount: int, member: str) -> Optional[float]:
        if not self.is_enabled:
            return None
        try:
            return self._redis.zincrby(key, amount, member)
        except Exception as e:
            print(f"Redis zincrby error: {e}")
            return None
    
    def zrange(self, key: str, start: int, end: int, desc: bool = False, withscores: bool = False):
        if not self.is_enabled:
            return []
        try:
            result = self._redis.zrange(key, start, end, desc=desc, withscores=withscores)
            if withscores:
                return [(m.decode('utf-8') if isinstance(m, bytes) else m, s) 
                        for m, s in result]
            return [m.decode('utf-8') if isinstance(m, bytes) else m for m in result]
        except Exception as e:
            print(f"Redis zrange error: {e}")
            return []
    
    def zrevrange(self, key: str, start: int, end: int, withscores: bool = False):
        return self.zrange(key, start, end, desc=True, withscores=withscores)
    
    def zscore(self, key: str, member: str) -> Optional[float]:
        if not self.is_enabled:
            return None
        try:
            return self._redis.zscore(key, member)
        except Exception as e:
            print(f"Redis zscore error: {e}")
            return None
    
    def zrank(self, key: str, member: str) -> Optional[int]:
        if not self.is_enabled:
            return None
        try:
            return self._redis.zrank(key, member)
        except Exception as e:
            print(f"Redis zrank error: {e}")
            return None


# 全局缓存实例
redis_cache = RedisCache()


# 装饰器：缓存函数结果
def cache_result(key_prefix: str, expire: int = 300):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 生成缓存key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 尝试从缓存获取
            cached = redis_cache.get(cache_key)
            if cached is not None:
                return cached
            
            # 执行函数
            result = await func(*args, **kwargs)
            
            # 存入缓存
            redis_cache.set(cache_key, result, expire=expire)
            
            return result
        return wrapper
    return decorator


# 装饰器：清除缓存模式
def clear_cache_pattern(pattern: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            redis_cache.delete_pattern(pattern)
            return result
        return wrapper
    return decorator
