import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from app.models.material import MaterialResponse, MaterialCreate, MaterialUpdate
from app.services.material_service import MaterialService

router = APIRouter(prefix="/materials", tags=["Materials"])

UPLOAD_DIR = "uploads/materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=MaterialResponse)
async def create_material(
    lecturer_id: str = Form(...),
    title: str = Form(...),
    course_id: str = Form(...),
    material_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    try:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        file_size = os.path.getsize(file_location)

        data = MaterialCreate(
            title=title,
            course_id=course_id,
            material_type=material_type,
            description=description,
            file_url=f"/{file_location}",
            file_size=file_size,
            tags=[],
        )

        return await MaterialService.create_material(data, lecturer_id, file.filename)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/course/{course_id}", response_model=List[MaterialResponse])
def get_materials_by_course(course_id: str):
    return MaterialService.get_by_course(course_id)


@router.get("/{material_id}", response_model=MaterialResponse)
def get_one(material_id: str):
    material = MaterialService.get_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: str, data: MaterialUpdate):
    updated = MaterialService.update(material_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Material not found")
    return updated


@router.delete("/{material_id}")
def delete_material(material_id: str):
    MaterialService.delete(material_id)
    return {"message": "Material deleted successfully"}
