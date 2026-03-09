from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.object_id import PyObjectId


class AssignmentCreate(BaseModel):
    course_id: PyObjectId
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_marks: Optional[int] = 100
    is_auto_generated: Optional[bool] = False
    metadata: Optional[dict] = None 


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[int] = None
    metadata: Optional[dict] = None


class AssignmentResponse(BaseModel):
    id: PyObjectId = Field(..., alias="id")
    course_id: PyObjectId
    title: str
    description: Optional[str]
    due_date: datetime
    max_marks: int
    is_auto_generated: bool
    metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }


class SubmissionCreate(BaseModel):
    student_id: PyObjectId
    notes: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: PyObjectId = Field(..., alias="id")
    assignment_id: PyObjectId
    student_id: PyObjectId
    file_path: Optional[str] = None  # server path / URL
    notes: Optional[str]
    submitted_at: datetime
    marks_obtained: Optional[float] = None
    grading_feedback: Optional[str] = None
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }
