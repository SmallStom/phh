from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Union, Optional
import warnings
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/phh"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    CORS_ORIGINS: Union[str, list] = ["http://localhost:5173", "http://localhost:3000"]
    
    SUPER_ADMIN_USERNAME: str = "superadmin"
    SUPER_ADMIN_EMAIL: str = "superadmin@phh-system.com"
    SUPER_ADMIN_PASSWORD: str = "SuperAdmin123!"
    SUPER_ADMIN_TENANT_SLUG: str = "system"
    
    ENVIRONMENT: str = "development"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_FILE_TYPES: list = ["application/pdf", "text/plain", "application/json"]
    
    # AI 助手配置 (OpenRouter)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"  # 默认模型
    AI_MAX_TOKENS: int = 2000
    AI_TEMPERATURE: float = 0.7
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._check_security()
    
    def _check_security(self):
        if self.ENVIRONMENT == "production":
            warnings_list = []
            
            if self.SECRET_KEY == "your-secret-key-change-in-production":
                warnings_list.append("SECRET_KEY is using default value")
            
            if self.SUPER_ADMIN_PASSWORD == "SuperAdmin123!":
                warnings_list.append("SUPER_ADMIN_PASSWORD is using default value")
            
            if self.DATABASE_URL.startswith("postgresql://postgres:postgres@"):
                warnings_list.append("DATABASE_URL is using default credentials")
            
            if warnings_list:
                warning_msg = "SECURITY WARNING - Production environment is using default values:\n"
                warning_msg += "\n".join(f"  - {w}" for w in warnings_list)
                warning_msg += "\n\nPlease set these values via environment variables or .env file!"
                warnings.warn(warning_msg, RuntimeWarning)
    
    class Config:
        env_file = ".env"


settings = Settings()
