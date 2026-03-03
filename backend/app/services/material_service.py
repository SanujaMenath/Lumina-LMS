from datetime import datetime, timezone
from bson import ObjectId
from app.database.connection import get_database
from app.models.material import MaterialCreate, MaterialUpdate

db = get_database()

class MaterialService:

    @staticmethod
    def create_material(data: MaterialCreate, lecturer_id: str):
        material_doc = data.model_dump()
        
        material_doc["lecturer_id"] = ObjectId(lecturer_id)
        material_doc["course_id"] = ObjectId(data.course_id) 
        
        material_doc["created_at"] = datetime.now(timezone.utc)
        material_doc["updated_at"] = datetime.now(timezone.utc)

        result = db["materials"].insert_one(material_doc)
        return MaterialService.get_by_id(str(result.inserted_id))

    @staticmethod
    def get_by_id(material_id: str):
        material = db["materials"].find_one({"_id": ObjectId(material_id)})
        if material:
            material["_id"] = material["_id"] 
        return material

    @staticmethod
    def get_by_course(course_id: str):
  
        materials = list(db["materials"].find({"course_id": ObjectId(course_id)}))
        
        out = []
        for m in materials:
            m["id"] = str(m["_id"])
            m.pop("_id", None)
            
            if "course_id" in m and m["course_id"]:
                m["course_id"] = str(m["course_id"])
                
            if "lecturer_id" in m and m["lecturer_id"]:
                m["lecturer_id"] = str(m["lecturer_id"])
                
            out.append(m)
            
        return out

    @staticmethod
    def update(material_id: str, data: MaterialUpdate):
        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        
        if not update_data:
            return MaterialService.get_by_id(material_id)

        update_data["updated_at"] = datetime.now(timezone.utc)
        
        db["materials"].update_one(
            {"_id": ObjectId(material_id)},
            {"$set": update_data}
        )
        return MaterialService.get_by_id(material_id)

    @staticmethod
    def delete(material_id: str):
        db["materials"].delete_one({"_id": ObjectId(material_id)})
        return True