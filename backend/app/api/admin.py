from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.dependencies import require_super_admin
from app.models.user import User
from app.models.record import Record, RecordStatus
from app.models.experience import Experience
from app.schemas.record import RecordResponse, RecordListResponse
from app.schemas.experience import ExperienceResponse, ExperienceListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/records", response_model=RecordListResponse)
async def get_all_public_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Record).options(
        joinedload(Record.user),
        joinedload(Record.tenant)
    ).filter(
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
        record_responses.append(response)
    
    return RecordListResponse(
        data=record_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/records/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    record = db.query(Record).options(
        joinedload(Record.user),
        joinedload(Record.tenant)
    ).filter(Record.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    response = RecordResponse.model_validate(record)
    response.like_count = record.like_count
    response.comment_count = record.comment_count
    return response


@router.put("/records/{record_id}/status", response_model=RecordResponse)
async def update_record_status(
    record_id: str,
    new_status: RecordStatus,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    old_status = record.status
    record.status = new_status
    
    if new_status == RecordStatus.PUBLISHED and not record.published_at:
        from datetime import datetime, timezone
        record.published_at = datetime.now(timezone.utc)
        record.is_public = True
    
    db.commit()
    db.refresh(record)
    
    logger.info(f"Record {record_id} status changed from {old_status} to {new_status} by super admin {current_admin.username}")
    
    response = RecordResponse.model_validate(record)
    response.like_count = record.like_count
    response.comment_count = record.comment_count
    return response


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    db.delete(record)
    db.commit()
    
    logger.info(f"Record {record_id} deleted by super admin {current_admin.username}")
    
    return None


@router.get("/experiences", response_model=ExperienceListResponse)
async def get_all_public_experiences(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Experience).options(
        joinedload(Experience.user),
        joinedload(Experience.tenant)
    ).filter(
        Experience.is_public == True
    )
    
    if search:
        query = query.filter(
            (Experience.title.ilike(f"%{search}%")) | 
            (Experience.description.ilike(f"%{search}%"))
        )
    
    total = query.count()
    experiences = query.order_by(Experience.start_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return ExperienceListResponse(
        data=[ExperienceResponse.model_validate(exp) for exp in experiences],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/experiences/{experience_id}", response_model=ExperienceResponse)
async def get_experience(
    experience_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).options(
        joinedload(Experience.user),
        joinedload(Experience.tenant)
    ).filter(Experience.id == experience_id).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return ExperienceResponse.model_validate(experience)


@router.delete("/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    experience = db.query(Experience).filter(Experience.id == experience_id).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    db.delete(experience)
    db.commit()
    
    logger.info(f"Experience {experience_id} deleted by super admin {current_admin.username}")
    
    return None


@router.get("/stats")
async def get_admin_stats(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    total_records = db.query(Record).filter(Record.is_public == True).count()
    total_experiences = db.query(Experience).filter(Experience.is_public == True).count()
    
    record_status_counts = {}
    for status in RecordStatus:
        count = db.query(Record).filter(
            Record.status == status,
            Record.is_public == True
        ).count()
        record_status_counts[status.value] = count
    
    return {
        "total_public_records": total_records,
        "total_public_experiences": total_experiences,
        "record_status_counts": record_status_counts
    }
