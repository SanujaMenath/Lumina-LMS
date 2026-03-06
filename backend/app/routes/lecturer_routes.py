from fastapi import APIRouter, HTTPException
from app.models.lecturer import LecturerCreate, LecturerUpdate, LecturerResponse
from app.services.lecturer_service import LecturerService
from fastapi import Depends
from app.dependencies.auth_dependencies import require_role

router = APIRouter(prefix="/lecturers", tags=["Lecturers"])

@router.post("/", response_model=LecturerResponse)
def create_lecturer(data: LecturerCreate):
    try:
        return LecturerService.create_lecturer(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[LecturerResponse])
def get_all():
    return LecturerService.get_all()

@router.get("/{user_id}", response_model=LecturerResponse)
def get_by_id(user_id: str):
    lecturer = LecturerService.get_by_id(user_id)
    if not lecturer:
        raise HTTPException(status_code=404, detail="Lecturer not found")
    return lecturer

@router.put("/{user_id}", response_model=LecturerResponse)
def update(user_id: str, data: LecturerUpdate):
    return LecturerService.update_lecturer(user_id, data)

@router.delete("/{user_id}")
def delete(user_id: str):
    LecturerService.delete_lecturer(user_id)
    return {"message": "Lecturer deleted"}

@router.get("/{user_id}/dashboard")
def get_lecturer_dashboard(
    user_id: str, 
    current_user = Depends(require_role("lecturer")) 
):
    return LecturerService.get_dashboard_stats(user_id)