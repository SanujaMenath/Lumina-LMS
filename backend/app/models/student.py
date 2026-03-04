from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional
from app.models.object_id import PyObjectId


class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department: str
    year: int
    semester: int


class StudentUpdate(BaseModel):
    department: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None


class StudentResponse(BaseModel):
    user_id: PyObjectId
    student_id: Optional[str] = None
    full_name: str
    email: EmailStr
    department: str
    year: int
    semester: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }
