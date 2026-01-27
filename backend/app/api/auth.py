from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, TenantResponse
from datetime import timedelta
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    tenant = db.query(Tenant).filter(Tenant.slug == user_data.tenant_slug).first()
    
    if not tenant:
        tenant = Tenant(
            name=user_data.tenant_slug.capitalize(),
            slug=user_data.tenant_slug
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
    
    user = User(
        tenant_id=tenant.id,
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        token=access_token,
        user=UserResponse.model_validate(user),
        tenant=TenantResponse.model_validate(tenant)
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    logger.info(f"Login attempt with email: {credentials.email}")
    logger.info(f"Request body: {await request.body()}")
    
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        logger.error(f"Login failed for email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    logger.info(f"Login successful for user: {user.username}")
    
    return Token(
        token=access_token,
        user=UserResponse.model_validate(user),
        tenant=TenantResponse.model_validate(tenant)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
