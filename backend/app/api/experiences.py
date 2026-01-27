from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.experience import Experience, ExperienceCategory
from app.schemas.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse, ExperienceListResponse

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


@router.get("", response_model=ExperienceListResponse)
async def get_experiences(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[ExperienceCategory] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Experience).options(
        joinedload(Experience.user)
    ).filter(Experience.tenant_id == current_user.tenant_id)
    
    if category:
        query = query.filter(Experience.category == category)
    
    if year:
        from sqlalchemy import extract
        query = query.filter(extract('year', Experience.start_date) == year)
    
    total = query.count()
    experiences = query.order_by(Experience.start_date.desc(), Experience.order_index.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return ExperienceListResponse(
        data=[ExperienceResponse.model_validate(exp) for exp in experiences],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/public/{experience_id}", response_model=ExperienceResponse)
async def get_public_experience(
    experience_id: str,
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).options(
        joinedload(Experience.user)
    ).filter(
        Experience.id == experience_id,
        Experience.is_public == True
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return ExperienceResponse.model_validate(experience)


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    experience_data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    experience = Experience(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=experience_data.title,
        description=experience_data.description,
        start_date=experience_data.start_date,
        end_date=experience_data.end_date,
        is_current=experience_data.is_current,
        category=experience_data.category,
        tags=experience_data.tags,
        source_record_id=experience_data.source_record_id,
        is_public=experience_data.is_public
    )
    
    db.add(experience)
    db.commit()
    db.refresh(experience)
    
    return ExperienceResponse.model_validate(experience)


@router.get("/{experience_id}", response_model=ExperienceResponse)
async def get_experience(
    experience_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.tenant_id == current_user.tenant_id
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return ExperienceResponse.model_validate(experience)


@router.put("/{experience_id}", response_model=ExperienceResponse)
async def update_experience(
    experience_id: str,
    experience_data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.tenant_id == current_user.tenant_id
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    update_data = experience_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(experience, field, value)
    
    db.commit()
    db.refresh(experience)
    
    return ExperienceResponse.model_validate(experience)


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.tenant_id == current_user.tenant_id
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    db.delete(experience)
    db.commit()
    
    return None


@router.post("/from-record/{record_id}", response_model=ExperienceResponse)
async def create_experience_from_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.record import Record
    
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.tenant_id == current_user.tenant_id
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    experience = Experience(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=record.title or "Untitled",
        description=record.content,
        start_date=record.created_at.date(),
        source_record_id=record.id,
        is_public=record.is_public
    )
    
    db.add(experience)
    db.commit()
    db.refresh(experience)
    
    return ExperienceResponse.model_validate(experience)
