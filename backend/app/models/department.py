from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from app.models.object_id import PyObjectId

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    faculty: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    faculty: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: PyObjectId = Field(alias="_id")
    name: str
    code: str
    description: Optional[str]
    faculty: Optional[str] = None 
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}