import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    
    # 修复 enum 类型和添加字段
    from sqlalchemy import text
    with engine.connect() as conn:
        # 检查 image_urls 字段是否存在
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'records' AND column_name = 'image_urls'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE records 
                ADD COLUMN image_urls VARCHAR[] DEFAULT ARRAY[]::VARCHAR[]
            """))
            conn.commit()
            logger.info("Added image_urls column to records table")
        else:
            logger.info("image_urls column already exists")
        
        # 修复 recordtype enum
        conn.execute(text("""
            DO $$
            DECLARE
                v_current_type TEXT;
            BEGIN
                -- 检查 enum 是否存在
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recordtype') THEN
                    -- 先转为 text 类型
                    ALTER TABLE records ALTER COLUMN record_type TYPE TEXT;
                    
                    -- 更新数据为小写
                    UPDATE records SET record_type = LOWER(record_type) 
                    WHERE record_type IS NOT NULL AND record_type != LOWER(record_type);
                    
                    -- 删除旧 enum
                    DROP TYPE IF EXISTS recordtype;
                END IF;
                
                -- 创建新的 enum（小写值）
                CREATE TYPE recordtype AS ENUM ('note', 'idea', 'log');
                
                -- 转换回 enum 类型
                ALTER TABLE records ALTER COLUMN record_type TYPE recordtype 
                    USING record_type::recordtype;
            EXCEPTION 
                WHEN duplicate_object THEN 
                    NULL;
            END $$;
        """))
        conn.commit()
        logger.info("Fixed recordtype enum")
        
        # 修复 recordstatus enum
        conn.execute(text("""
            DO $$
            BEGIN
                -- 检查 enum 是否存在
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recordstatus') THEN
                    -- 先转为 text 类型
                    ALTER TABLE records ALTER COLUMN status TYPE TEXT;
                    
                    -- 更新数据为小写
                    UPDATE records SET status = LOWER(status) 
                    WHERE status IS NOT NULL AND status != LOWER(status);
                    
                    -- 删除旧 enum
                    DROP TYPE IF EXISTS recordstatus;
                END IF;
                
                -- 创建新的 enum（小写值）
                CREATE TYPE recordstatus AS ENUM ('draft', 'published', 'archived');
                
                -- 转换回 enum 类型
                ALTER TABLE records ALTER COLUMN status TYPE recordstatus 
                    USING status::recordstatus;
            EXCEPTION 
                WHEN duplicate_object THEN 
                    NULL;
            END $$;
        """))
        conn.commit()
        logger.info("Fixed recordstatus enum")


def create_super_admin(db: Session):
    from sqlalchemy import text
    import uuid
    
    # 使用原生 SQL 查询，避免 enum 转换问题
    result = db.execute(text("SELECT id FROM users WHERE email = :email"), {
        "email": settings.SUPER_ADMIN_EMAIL
    })
    
    if result.fetchone():
        logger.info(f"Super admin already exists: {settings.SUPER_ADMIN_EMAIL}")
        return
    
    # 查询或创建租户
    result = db.execute(text("SELECT id FROM tenants WHERE slug = :slug"), {
        "slug": settings.SUPER_ADMIN_TENANT_SLUG
    })
    tenant_row = result.fetchone()
    
    if tenant_row:
        tenant_id = tenant_row[0]
        logger.info(f"Using existing tenant: {settings.SUPER_ADMIN_TENANT_SLUG}")
    else:
        tenant_id = uuid.uuid4()
        db.execute(text("""
            INSERT INTO tenants (id, name, slug, description, created_at)
            VALUES (:id, :name, :slug, :description, NOW())
        """), {
            "id": str(tenant_id),
            "name": "System",
            "slug": settings.SUPER_ADMIN_TENANT_SLUG,
            "description": "System tenant for super admin"
        })
        logger.info(f"Created system tenant: {settings.SUPER_ADMIN_TENANT_SLUG}")
    
    # 使用原生 SQL 创建超级管理员，确保 role 值正确
    user_id = uuid.uuid4()
    password_hash = get_password_hash(settings.SUPER_ADMIN_PASSWORD)
    
    db.execute(text("""
        INSERT INTO users (id, tenant_id, username, email, password_hash, role, created_at)
        VALUES (:id, :tenant_id, :username, :email, :password_hash, 'super_admin'::userrole, NOW())
    """), {
        "id": str(user_id),
        "tenant_id": str(tenant_id),
        "username": settings.SUPER_ADMIN_USERNAME,
        "email": settings.SUPER_ADMIN_EMAIL,
        "password_hash": password_hash
    })
    
    db.commit()
    
    logger.info(f"Created super admin: {settings.SUPER_ADMIN_EMAIL}")
    logger.info(f"Username: {settings.SUPER_ADMIN_USERNAME}")
    logger.info(f"Password: {settings.SUPER_ADMIN_PASSWORD}")
    logger.info("Please change the password after first login!")


def init_db():
    create_tables()
    
    db = SessionLocal()
    try:
        create_super_admin(db)
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
