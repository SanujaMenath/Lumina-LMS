from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, Path, Query, HTTPException, status, UploadFile, File, Form
)
from app.models.assessment import AssessmentCreate, AssessmentUpdate, AssessmentResponse, GradePayload
from app.services.assessment_service import AssessmentService
from app.dependencies.auth_dependencies import get_current_user

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("/", response_model=AssessmentResponse)
async def create_assessment(
    lecturer_id: str,
    title: str = Form(...),
    course_id: str = Form(...),
    assessment_type: str = Form(...),
    due_date: datetime = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        data = AssessmentCreate(
            title=title,
            course_id=course_id,
            assessment_type=assessment_type,
            due_date=due_date,
            content=content
        )

        return await AssessmentService.create_assessment(data, lecturer_id, file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[AssessmentResponse])
def list_assessments(
    course_id: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
):
    return AssessmentService.list_assessments(course_id=course_id, skip=skip, limit=limit)

@router.get("/submissions/student/{student_id}")
def get_student_submissions(student_id: str):
    try:
        return AssessmentService.get_student_submissions(student_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch student submissions.")
    
@router.get("/{assessment_id}/submission/student/{student_id}")
def get_single_submission(assessment_id: str, student_id: str):
    return AssessmentService.get_single_submission(assessment_id, student_id)

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: str = Path(...)):
    assessment = AssessmentService.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.put("/{assessment_id}", response_model=AssessmentResponse)
def update_assessment(
    assessment_id: str,
    payload: AssessmentUpdate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ("admin", "lecturer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Lecturer only")
    return AssessmentService.update_assessment(assessment_id, payload)

@router.delete("/{assessment_id}")
def delete_assessment(assessment_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("admin", "lecturer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Lecturer only")
    return AssessmentService.delete_assessment(assessment_id)

@router.post("/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: str,
    student_id: str,
    answers: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        return AssessmentService.submit_assessment(
            assessment_id=assessment_id,
            student_id=student_id,
            answers=answers,
            file=file,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred during submission.")
    

@router.get("/{assessment_id}/submissions")
def get_assessment_submissions(assessment_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Lecturers only")
    try:
        return AssessmentService.get_assessment_submissions(assessment_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.put("/submissions/{submission_id}/grade")
def grade_submission(submission_id: str, payload: GradePayload, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Lecturers only")
    try:
        return AssessmentService.grade_submission(submission_id, payload.score)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    
@router.get("/students/{student_id}/grades")
def get_student_course_grades(student_id: str):
    try:
        return AssessmentService.get_student_course_grades(student_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate grades.")