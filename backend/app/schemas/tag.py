from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime, timezone

class TagBase(BaseModel):
    name: str
    color: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagUpdate(TagBase):
    name: Optional[str] = None
    color: Optional[str] = None

class TagResponse(TagBase):
    id: str
    tenant_id: str
    use_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at')
    @classmethod
    def serialize_datetime(cls, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    class Config:
        from_attributes = True

class TagSuggestResponse(BaseModel):
    tags: List[str]

class TagMergeRequest(BaseModel):
    source_tag: str
    target_tag: str

class TagMergeResponse(BaseModel):
    message: str
    merged_count: int

class TagStatsResponse(BaseModel):
    total_tags: int
    total_uses: int
    popular_tags: List[dict]
