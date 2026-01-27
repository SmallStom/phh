from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.collection import Collection, CollectionType
from app.models.record import Record
from app.models.experience import Experience
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionResponse, CollectionListResponse

def convert_collection_type_to_str(content_type: CollectionType) -> str:
    if content_type is None:
        return None
    if isinstance(content_type, str):
        return content_type.lower() if content_type.isupper() else content_type
    if hasattr(content_type, 'value'):
        return content_type.value
    return str(content_type)

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=CollectionListResponse)
async def get_collections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    content_type: Optional[CollectionType] = Query(None, alias="content_type"),
    is_favorite: Optional[bool] = Query(None),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Collection).filter(Collection.tenant_id == current_user.tenant_id)
    
    if content_type:
        query = query.filter(Collection.content_type == content_type)
    
    if is_favorite is not None:
        query = query.filter(Collection.is_favorite == is_favorite)
    
    if search:
        query = query.filter(
            (Collection.title.ilike(f"%{search}%")) | 
            (Collection.description.ilike(f"%{search}%"))
        )
    
    total = query.count()
    collections = query.order_by(Collection.order_index.asc(), Collection.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    data = []
    for col in collections:
        response_data = CollectionResponse.model_validate(col)
        
        if col.content_type == 'record' and col.content_id:
            record = db.query(Record).filter(
                Record.id == col.content_id,
                Record.tenant_id == current_user.tenant_id
            ).first()
            if record:
                response_data.title = record.title
                response_data.description = record.content
        elif col.content_type == 'experience' and col.content_id:
            experience = db.query(Experience).filter(
                Experience.id == col.content_id,
                Experience.tenant_id == current_user.tenant_id
            ).first()
            if experience:
                response_data.title = experience.title
                response_data.description = experience.description
        
        data.append(response_data)
    
    return CollectionListResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = Collection(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=collection_data.title,
        description=collection_data.description,
        url=collection_data.url,
        content_type=convert_collection_type_to_str(collection_data.content_type),
        content_id=collection_data.content_id,
        tags=collection_data.tags,
        is_favorite=collection_data.is_favorite,
        is_public=collection_data.is_public
    )
    
    db.add(collection)
    db.commit()
    db.refresh(collection)
    
    return CollectionResponse.model_validate(collection)


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    return CollectionResponse.model_validate(collection)


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    update_data = collection_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(collection, field, value)
    
    db.commit()
    db.refresh(collection)
    
    return CollectionResponse.model_validate(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    db.delete(collection)
    db.commit()
    
    return None


@router.post("/{collection_id}/favorite", response_model=CollectionResponse)
async def toggle_favorite(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    collection.is_favorite = not collection.is_favorite
    
    db.commit()
    db.refresh(collection)
    
    return CollectionResponse.model_validate(collection)


@router.get("/check/{content_type}/{content_id}")
async def check_collected(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.content_type == content_type,
        Collection.content_id == content_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    return {"is_collected": collection is not None, "collection_id": collection.id if collection else None}


@router.post("/collect/{content_type}/{content_id}", response_model=CollectionResponse)
async def collect_content(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Collection).filter(
        Collection.content_type == content_type,
        Collection.content_id == content_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already collected"
        )
    
    title = ""
    description = ""
    
    if content_type == "record":
        record = db.query(Record).filter(Record.id == content_id).first()
        if record:
            title = record.title or "无标题"
            description = record.content
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
    elif content_type == "experience":
        experience = db.query(Experience).filter(Experience.id == content_id).first()
        if experience:
            title = experience.title or "无标题"
            description = experience.description
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience not found"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type"
        )
    
    collection = Collection(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=title,
        description=description,
        content_type=content_type,
        content_id=content_id,
        is_favorite=True
    )
    
    db.add(collection)
    db.commit()
    db.refresh(collection)
    
    return CollectionResponse.model_validate(collection)


@router.delete("/uncollect/{content_type}/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def uncollect_content(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collection = db.query(Collection).filter(
        Collection.content_type == content_type,
        Collection.content_id == content_id,
        Collection.tenant_id == current_user.tenant_id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    db.delete(collection)
    db.commit()
    
    return None
