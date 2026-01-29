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


def create_super_admin(db: Session):
    existing_admin = db.query(User).filter(
        User.email == settings.SUPER_ADMIN_EMAIL
    ).first()
    
    if existing_admin:
        logger.info(f"Super admin already exists: {settings.SUPER_ADMIN_EMAIL}")
        return existing_admin
    
    tenant = db.query(Tenant).filter(
        Tenant.slug == settings.SUPER_ADMIN_TENANT_SLUG
    ).first()
    
    if not tenant:
        tenant = Tenant(
            name="System",
            slug=settings.SUPER_ADMIN_TENANT_SLUG,
            description="System tenant for super admin"
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        logger.info(f"Created system tenant: {settings.SUPER_ADMIN_TENANT_SLUG}")
    
    super_admin = User(
        tenant_id=tenant.id,
        username=settings.SUPER_ADMIN_USERNAME,
        email=settings.SUPER_ADMIN_EMAIL,
        password_hash=get_password_hash(settings.SUPER_ADMIN_PASSWORD),
        role=UserRole.SUPER_ADMIN
    )
    
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    
    logger.info(f"Created super admin: {settings.SUPER_ADMIN_EMAIL}")
    logger.info(f"Username: {settings.SUPER_ADMIN_USERNAME}")
    logger.info(f"Password: {settings.SUPER_ADMIN_PASSWORD}")
    logger.info("Please change the password after first login!")
    
    return super_admin


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
