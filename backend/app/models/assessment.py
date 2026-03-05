from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    course_id: str
    assessment_type: str  # 'mcq', 'short_answer', 'pdf', 'AI_generated'
    due_date: datetime
    content: Optional[str] = None 
    file_url: Optional[str] = None
    
    description: Optional[str] = None
    total_marks: Optional[int] = 0

    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)
    module_id: Optional[str] = None

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    content: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[int] = None

class GradePayload(BaseModel):
    score: int

class AssessmentResponse(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None) 
    title: str
    course_id: str
    assessment_type: str
    due_date: datetime
    content: Optional[str] = None
    file_url: Optional[str] = None
    lecturer_id: str
    created_at: datetime
    updated_at: datetime
    
    module_id: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[int] = 0

    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)
    question_ids: Optional[List[str]] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }