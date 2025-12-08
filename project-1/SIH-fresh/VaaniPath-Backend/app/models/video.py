from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DomainType(str, Enum):
    AGRICULTURE = "agriculture"
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    BUSINESS = "business"
    OTHER = "other"

class VideoUpload(BaseModel):
    title: str
    description: Optional[str] = None
    domain: str
    source_language: str = "en"
    target_languages: List[str]
    tutor_gender: Optional[str] = "male"

class VideoResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    domain: str
    source_language: str
    target_languages: List[str]
    tutor_gender: Optional[str] = None
    file_url: Optional[str] = None  # Changed from cloudinary_url to match database
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    uploaded_by: str
    created_at: datetime
    status: str = "processing"
    content_type: Optional[str] = None  # video, audio, or document
    views: int = 0
    subtitles: Optional[dict] = None  # 🚀 NEW: Subtitles mapping {lang: url}

    @field_validator('target_languages', mode='before')
    def parse_target_languages(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v

class VideoProgress(BaseModel):
    video_id: str
    progress_percentage: float
    last_watched_at: datetime

class VideoList(BaseModel):
    videos: List[VideoResponse]
    total: int
    page: int
    page_size: int

class WatchProgress(BaseModel):
    progress_percentage: float
    last_position: Optional[float] = None
    
class DubbingFeedbackCreate(BaseModel):
    video_id: str
    language: str
    rating: int
    issues: List[str]
    comment: Optional[str] = None
