from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, TenantResponse, UserUpdate, UserProfileResponse
from datetime import timedelta
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已经注册，请直接登录"
        )
    
    # 检查用户名是否已存在（全局唯一）
    existing_username = db.query(User).filter(
        User.username == user_data.username
    ).first()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在，请使用其他名称"
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


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    # 检查用户名是否已被其他用户使用
    if user_data.username and user_data.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == user_data.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # 更新用户信息
    if user_data.username is not None:
        current_user.username = user_data.username
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.location is not None:
        current_user.location = user_data.location
    if user_data.website is not None:
        current_user.website = user_data.website
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的完整资料（包含统计数据）"""
    from app.models.record import Record
    from app.models.experience import Experience
    from app.models.collection import Collection
    from app.models.like import Like
    from app.models.comment import Comment
    
    # 统计数据
    records_count = db.query(Record).filter(Record.user_id == current_user.id).count()
    experiences_count = db.query(Experience).filter(Experience.user_id == current_user.id).count()
    collections_count = db.query(Collection).filter(Collection.user_id == current_user.id).count()
    
    # 获取用户所有记录
    user_records = db.query(Record).filter(Record.user_id == current_user.id).all()
    record_ids = [r.id for r in user_records]
    
    # 获赞数和评论数
    likes_received = 0
    comments_received = 0
    if record_ids:
        likes_received = db.query(Like).filter(Like.record_id.in_(record_ids)).count()
        comments_received = db.query(Comment).filter(Comment.record_id.in_(record_ids)).count()
    
    return UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
        avatar=current_user.avatar,
        bio=current_user.bio,
        location=current_user.location,
        website=current_user.website,
        followers_count=current_user.followers_count,
        following_count=current_user.following_count,
        records_count=records_count,
        experiences_count=experiences_count,
        collections_count=collections_count,
        likes_received=likes_received,
        comments_received=comments_received
    )
