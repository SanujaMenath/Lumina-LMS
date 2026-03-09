from fastapi import APIRouter
from app.models.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.services.department_service import DepartmentService

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate):
    return DepartmentService.create_dept(dept)

@router.get("/", response_model=list[DepartmentResponse])
def list_departments():
    return DepartmentService.get_all()

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: str, dept: DepartmentUpdate):
    update_data = dept.model_dump(exclude_unset=True) 
    return DepartmentService.update_dept(dept_id, update_data)

@router.delete("/{dept_id}")
def delete_department(dept_id: str):
    DepartmentService.delete_dept(dept_id)
    return {"message": "Department deleted"}