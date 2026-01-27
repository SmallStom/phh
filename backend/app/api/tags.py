from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tag import Tag
from app.models.content_tag import ContentTag
from app.models.record import Record
from app.models.experience import Experience
from app.models.collection import Collection
from app.schemas.tag import (
    TagCreate, TagUpdate, TagResponse, 
    TagSuggestResponse, TagMergeRequest, TagMergeResponse, TagStatsResponse
)

router = APIRouter(prefix="/api/tags", tags=["tags"])

@router.get("", response_model=List[TagResponse])
async def get_tags(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Tag).filter(Tag.tenant_id == current_user.tenant_id)
    
    if search:
        query = query.filter(Tag.name.ilike(f"%{search}%"))
    
    subquery = (
        db.query(
            ContentTag.tag_id,
            func.count(ContentTag.id).label('use_count')
        )
        .filter(
            ContentTag.tenant_id == current_user.tenant_id,
            ContentTag.content_type.in_(['record', 'experience', 'collection'])
        )
        .group_by(ContentTag.tag_id)
        .subquery()
    )
    
    total = query.count()
    tags = (
        query
        .outerjoin(subquery, Tag.id == subquery.c.tag_id)
        .order_by(subquery.c.use_count.desc().nullslast(), Tag.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    result = []
    for tag in tags:
        use_count = db.query(ContentTag).filter(
            ContentTag.tag_id == tag.id,
            ContentTag.tenant_id == current_user.tenant_id
        ).count()
        result.append(TagResponse(
            id=tag.id,
            tenant_id=tag.tenant_id,
            name=tag.name,
            color=tag.color,
            use_count=use_count,
            created_at=tag.created_at,
            updated_at=tag.updated_at
        ))
    
    return result

@router.get("/suggest", response_model=TagSuggestResponse)
async def suggest_tags(
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tags = (
        db.query(Tag.name)
        .filter(
            Tag.tenant_id == current_user.tenant_id,
            Tag.name.ilike(f"%{q}%")
        )
        .order_by(Tag.name)
        .limit(limit)
        .all()
    )
    
    return TagSuggestResponse(tags=[t[0] for t in tags])

@router.get("/popular", response_model=List[dict])
async def get_popular_tags(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Tag.name,
            func.count(ContentTag.id).label('use_count')
        )
        .join(ContentTag, Tag.id == ContentTag.tag_id)
        .filter(
            ContentTag.tenant_id == current_user.tenant_id,
            ContentTag.content_type.in_(['record', 'experience', 'collection'])
        )
        .group_by(Tag.id, Tag.name)
        .order_by(func.count(ContentTag.id).desc())
        .limit(limit)
        .all()
    )
    
    return [{"name": r[0], "count": r[1]} for r in results]

@router.get("/stats", response_model=TagStatsResponse)
async def get_tag_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_tags = db.query(Tag).filter(Tag.tenant_id == current_user.tenant_id).count()
    
    total_uses = (
        db.query(ContentTag)
        .filter(
            ContentTag.tenant_id == current_user.tenant_id,
            ContentTag.content_type.in_(['record', 'experience', 'collection'])
        )
        .count()
    )
    
    popular = (
        db.query(
            Tag.name,
            func.count(ContentTag.id).label('use_count')
        )
        .join(ContentTag, Tag.id == ContentTag.tag_id)
        .filter(
            ContentTag.tenant_id == current_user.tenant_id,
            ContentTag.content_type.in_(['record', 'experience', 'collection'])
        )
        .group_by(Tag.id, Tag.name)
        .order_by(func.count(ContentTag.id).desc())
        .limit(10)
        .all()
    )
    
    return TagStatsResponse(
        total_tags=total_tags,
        total_uses=total_uses,
        popular_tags=[{"name": p[0], "count": p[1]} for p in popular]
    )

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Tag).filter(
        Tag.tenant_id == current_user.tenant_id,
        Tag.name == tag_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists"
        )
    
    tag = Tag(
        tenant_id=current_user.tenant_id,
        name=tag_data.name,
        color=tag_data.color
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return TagResponse(
        id=tag.id,
        tenant_id=tag.tenant_id,
        name=tag.name,
        color=tag.color,
        use_count=0,
        created_at=tag.created_at,
        updated_at=tag.updated_at
    )

@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.tenant_id == current_user.tenant_id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    if tag_data.name:
        existing = db.query(Tag).filter(
            Tag.tenant_id == current_user.tenant_id,
            Tag.name == tag_data.name,
            Tag.id != tag_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag name already exists"
            )
        
        old_name = tag.name
        tag.name = tag_data.name
    
    if tag_data.color:
        tag.color = tag_data.color
    
    db.commit()
    db.refresh(tag)
    
    use_count = db.query(ContentTag).filter(
        ContentTag.tag_id == tag.id,
        ContentTag.tenant_id == current_user.tenant_id
    ).count()
    
    return TagResponse(
        id=tag.id,
        tenant_id=tag.tenant_id,
        name=tag.name,
        color=tag.color,
        use_count=use_count,
        created_at=tag.created_at,
        updated_at=tag.updated_at
    )

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.tenant_id == current_user.tenant_id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    db.delete(tag)
    db.commit()
    
    return None

@router.post("/merge", response_model=TagMergeResponse)
async def merge_tags(
    merge_data: TagMergeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    source_tag = db.query(Tag).filter(
        Tag.tenant_id == current_user.tenant_id,
        Tag.name == merge_data.source_tag
    ).first()
    
    target_tag = db.query(Tag).filter(
        Tag.tenant_id == current_user.tenant_id,
        Tag.name == merge_data.target_tag
    ).first()
    
    if not source_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source tag '{merge_data.source_tag}' not found"
        )
    
    if not target_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target tag '{merge_data.target_tag}' not found"
        )
    
    if source_tag.id == target_tag.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot merge a tag with itself"
        )
    
    merged_count = (
        db.query(ContentTag)
        .filter(
            ContentTag.tenant_id == current_user.tenant_id,
            ContentTag.tag_id == source_tag.id
        )
        .update({"tag_id": target_tag.id})
    )
    
    db.delete(source_tag)
    db.commit()
    
    return TagMergeResponse(
        message=f"Merged '{merge_data.source_tag}' into '{merge_data.target_tag}'",
        merged_count=merged_count
    )
