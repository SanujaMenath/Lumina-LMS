from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.object_id import PyObjectId


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    description: Optional[str] = None
    department: Optional[str] = None
    credits: Optional[int] = 0
    year: Optional[int] = None
    semester: Optional[int] = None
    lecturer_id: Optional[PyObjectId] = None


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    credits: Optional[int] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    lecturer_id: Optional[PyObjectId] = None


class CourseListItem(BaseModel):
    id: str
    course_code: str
    course_name: str
    is_enrolled: Optional[bool] = None
    lecturer_id: Optional[str] = None

class StudentEnrolledCourseResponse(BaseModel):
    course_id: str
    course_code: str
    course_name: str
    description: Optional[str] = None
    credits: int
    semester: Optional[int] = None
    lecturer_name: str
    progress: int
    last_accessed: str

class CourseResponse(BaseModel):
    id: PyObjectId = Field(..., alias="id")
    course_code: str
    course_name: str
    description: Optional[str] = None
    department: Optional[str] = None
    credits: int
    year: Optional[int] = None
    semester: Optional[int] = None
    lecturer_id: Optional[PyObjectId] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }
