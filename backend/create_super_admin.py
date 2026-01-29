import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.security import get_password_hash
from app.config import settings
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_super_admin():
    try:
        password_hash = get_password_hash(settings.SUPER_ADMIN_PASSWORD)
        logger.info(f"Password hash generated")
        
        with engine.connect() as conn:
            conn.execute(text("BEGIN"))
            
            result = conn.execute(text("""
                SELECT id FROM tenants WHERE slug = :slug
            """), {"slug": settings.SUPER_ADMIN_TENANT_SLUG})
            
            tenant = result.fetchone()
            
            if not tenant:
                tenant_id = uuid.uuid4()
                conn.execute(text("""
                    INSERT INTO tenants (id, name, slug, description, created_at)
                    VALUES (:id, :name, :slug, :description, NOW())
                """), {
                    "id": tenant_id,
                    "name": "System",
                    "slug": settings.SUPER_ADMIN_TENANT_SLUG,
                    "description": "System tenant for super admin"
                })
                logger.info(f"Created system tenant: {settings.SUPER_ADMIN_TENANT_SLUG}")
            else:
                tenant_id = tenant[0]
                logger.info(f"Using existing tenant: {settings.SUPER_ADMIN_TENANT_SLUG}")
            
            result = conn.execute(text("""
                SELECT id FROM users WHERE email = :email
            """), {"email": settings.SUPER_ADMIN_EMAIL})
            
            existing_user = result.fetchone()
            
            if existing_user:
                logger.info(f"Super admin already exists: {settings.SUPER_ADMIN_EMAIL}")
            else:
                user_id = uuid.uuid4()
                conn.execute(text("""
                    INSERT INTO users (id, tenant_id, username, email, password_hash, role, created_at)
                    VALUES (:id, :tenant_id, :username, :email, :password_hash, CAST(:role AS userrole), NOW())
                """), {
                    "id": user_id,
                    "tenant_id": tenant_id,
                    "username": settings.SUPER_ADMIN_USERNAME,
                    "email": settings.SUPER_ADMIN_EMAIL,
                    "password_hash": password_hash,
                    "role": "super_admin"
                })
                logger.info(f"Created super admin: {settings.SUPER_ADMIN_EMAIL}")
                logger.info(f"Username: {settings.SUPER_ADMIN_USERNAME}")
                logger.info(f"Password: {settings.SUPER_ADMIN_PASSWORD}")
                logger.info("Please change the password after first login!")
            
            conn.execute(text("COMMIT"))
            logger.info("Super admin creation completed successfully")
            
    except Exception as e:
        logger.error(f"Error creating super admin: {e}")
        raise


if __name__ == "__main__":
    create_super_admin()
