# backend/app/routes/course_routes.py
from fastapi import APIRouter, Depends, Path
from typing import List
from app.models.course import CourseCreate, CourseUpdate, StudentEnrolledCourseResponse, CourseResponse
from app.models.enrollment import EnrollmentCreate
from app.services.course_service import CourseService
from app.dependencies.auth_dependencies import get_current_user
from fastapi import HTTPException, status

router = APIRouter(prefix="/courses", tags=["Courses"])


# Admin only 
@router.post("/", response_model=CourseResponse, dependencies=[Depends(lambda: None)])
def create_course(data: CourseCreate, current_user=Depends(get_current_user)):
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return CourseService.create_course(data)


@router.get("/", response_model=List[CourseResponse])
def list_courses(skip: int = 0, limit: int = 100):
    return CourseService.list_courses(skip=skip, limit=limit)


@router.get("/me")
def list_my_courses(current_user=Depends(get_current_user)):
    return CourseService.list_courses_for_user(current_user)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: str = Path(...)):
    return CourseService.get_course(course_id)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: str, data: CourseUpdate, current_user=Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return CourseService.update_course(course_id, data)


@router.delete("/{course_id}")
def delete_course(course_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return CourseService.delete_course(course_id)


# Enrollment endpoints
@router.post("/{course_id}/enroll")
def enroll_student(course_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student only")

    return CourseService.enroll_student(course_id, current_user["id"])


@router.delete("/{course_id}/students/{student_id}")
def unenroll_student(
    course_id: str, student_id: str, current_user=Depends(get_current_user)
):
    if current_user["role"] not in ("admin", "lecturer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Lecturer only"
        )
    return CourseService.unenroll_student(course_id, student_id)


@router.get("/{course_id}/students", response_model=List[dict])
def get_students(course_id: str):
    return CourseService.get_students_in_course(course_id)


@router.get("/{student_id}/courses", response_model=List[StudentEnrolledCourseResponse])
def get_student_courses(student_id: str):
    return CourseService.get_courses_of_student(student_id)



