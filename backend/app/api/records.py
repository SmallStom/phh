from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.core.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.record import Record, RecordStatus, RecordType
from app.models.tag import Tag
from app.models.content_tag import ContentTag
from app.models.like import Like
from app.schemas.record import RecordCreate, RecordUpdate, RecordResponse, RecordListResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("/public", response_model=RecordListResponse)
async def get_public_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Record).options(
        joinedload(Record.user)
    ).filter(
        Record.status == RecordStatus.PUBLISHED,
        Record.is_public == True
    )
    
    if search:
        query = query.filter(
            (Record.title.ilike(f"%{search}%")) | 
            (Record.content.ilike(f"%{search}%"))
        )
    
    total = query.count()
    records = query.order_by(Record.published_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    record_responses = []
    for record in records:
        response = RecordResponse.model_validate(record)
        response.like_count = record.like_count
        response.comment_count = record.comment_count
        
        if current_user:
            existing_like = db.query(Like).filter(
                Like.record_id == record.id,
                Like.user_id == current_user.id
            ).first()
            response.is_liked = existing_like is not None
        
        record_responses.append(response)
    
    return RecordListResponse(
        data=record_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("", response_model=RecordListResponse)
async def get_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[RecordStatus] = Query(None, alias="status"),
    type_filter: Optional[RecordType] = Query(None, alias="type"),
    search: Optional[str] = None,
    date_from: Optional[datetime] = Query(None, alias="date_from"),
    date_to: Optional[datetime] = Query(None, alias="date_to"),
    sort_by: str = Query("newest", alias="sort"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取记录列表，支持高级筛选
    
    Args:
        sort_by: 排序方式，可选值：newest(最新), oldest(最早), popular(热门)
    """
    query = db.query(Record).filter(Record.tenant_id == current_user.tenant_id)
    
    # 状态筛选
    if status_filter:
        query = query.filter(Record.status == status_filter)
    
    # 类型筛选
    if type_filter:
        query = query.filter(Record.record_type == type_filter)
    
    # 搜索关键词
    if search:
        query = query.filter(
            (Record.title.ilike(f"%{search}%")) | 
            (Record.content.ilike(f"%{search}%"))
        )
    
    # 日期范围筛选
    if date_from:
        query = query.filter(Record.created_at >= date_from)
    if date_to:
        query = query.filter(Record.created_at <= date_to)
    
    # 排序
    if sort_by == "newest":
        query = query.order_by(Record.created_at.desc())
    elif sort_by == "oldest":
        query = query.order_by(Record.created_at.asc())
    elif sort_by == "popular":
        # 按点赞数+评论数排序
        query = query.outerjoin(Like).group_by(Record.id).order_by(
            (func.count(Like.id) + Record.comment_count).desc()
        )
    else:
        query = query.order_by(Record.created_at.desc())
    
    total = query.count()
    records = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return RecordListResponse(
        data=[RecordResponse.model_validate(record) for record in records],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    record_data: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = Record(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=record_data.title,
        content=record_data.content,
        status=record_data.status,
        record_type=record_data.record_type,
        parent_id=record_data.parent_id,
        is_public=record_data.is_public
    )
    
    if record_data.status == RecordStatus.PUBLISHED:
        record.published_at = datetime.now(timezone.utc)
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    if record_data.tags:
        for tag_name in record_data.tags:
            tag = db.query(Tag).filter(
                Tag.tenant_id == current_user.tenant_id,
                Tag.name == tag_name
            ).first()
            
            if not tag:
                tag = Tag(
                    tenant_id=current_user.tenant_id,
                    name=tag_name
                )
                db.add(tag)
                db.commit()
                db.refresh(tag)
            
            content_tag = ContentTag(
                tenant_id=current_user.tenant_id,
                tag_id=tag.id,
                content_type="record",
                content_id=record.id
            )
            db.add(content_tag)
        
        db.commit()
        db.refresh(record)
    
    return RecordResponse.model_validate(record)


@router.get("/public/{record_id}", response_model=RecordResponse)
async def get_public_record(
    record_id: str,
    db: Session = Depends(get_db)
):
    record = db.query(Record).options(
        joinedload(Record.user)
    ).filter(
        Record.id == record_id,
        Record.status == RecordStatus.PUBLISHED,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    response = RecordResponse.model_validate(record)
    response.like_count = record.like_count
    response.comment_count = record.comment_count
    return response


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.tenant_id == current_user.tenant_id
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    return RecordResponse.model_validate(record)


@router.put("/{record_id}", response_model=RecordResponse)
async def update_record(
    record_id: str,
    record_data: RecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.tenant_id == current_user.tenant_id
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    update_data = record_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field != 'tags':
            setattr(record, field, value)
    
    if record.status == RecordStatus.PUBLISHED and not record.published_at:
        record.published_at = datetime.now(timezone.utc)
    
    if record_data.tags is not None:
        db.query(ContentTag).filter(
            ContentTag.content_id == record.id,
            ContentTag.content_type == "record"
        ).delete()
        
        for tag_name in record_data.tags:
            tag = db.query(Tag).filter(
                Tag.tenant_id == current_user.tenant_id,
                Tag.name == tag_name
            ).first()
            
            if not tag:
                tag = Tag(
                    tenant_id=current_user.tenant_id,
                    name=tag_name
                )
                db.add(tag)
                db.commit()
                db.refresh(tag)
            
            content_tag = ContentTag(
                tenant_id=current_user.tenant_id,
                tag_id=tag.id,
                content_type="record",
                content_id=record.id
            )
            db.add(content_tag)
        
        db.commit()
    
    db.commit()
    db.refresh(record)
    
    return RecordResponse.model_validate(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.tenant_id == current_user.tenant_id
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    db.delete(record)
    db.commit()
    
    return None


@router.post("/{record_id}/publish", response_model=RecordResponse)
async def publish_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.tenant_id == current_user.tenant_id
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    record.status = RecordStatus.PUBLISHED
    record.is_public = True
    record.published_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(record)
    
    return RecordResponse.model_validate(record)
