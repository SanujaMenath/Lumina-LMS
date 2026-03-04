from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.object_id import PyObjectId


class BaseUser(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str


class LecturerCreate(BaseUser):
    department: str
    specialization: str


class StudentCreate(BaseUser):
    department: str
    year: int
    semester: int


class AdminCreate(BaseUser):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    student_id: Optional[str] = None
    full_name: str
    email: EmailStr
    role: str
    department_id: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            PyObjectId: str
        }
    }
