from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime, timezone
from typing import Optional, List
from app.models.object_id import PyObjectId

class MaterialCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    course_id: str 
    material_type: str  
    file_url: str     
    file_size: Optional[int] = None 
    tags: List[str] = []

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    material_type: Optional[str] = None
    file_url: Optional[str] = None
    tags: Optional[List[str]] = None

class MaterialResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    course_id: PyObjectId
    lecturer_id: PyObjectId  # To track who uploaded it
    title: str
    description: Optional[str]
    material_type: str
    file_url: str
    file_size: Optional[int]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }