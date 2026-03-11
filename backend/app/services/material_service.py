from datetime import datetime, timezone
from bson import ObjectId
from app.database.connection import get_database
from app.models.material import MaterialCreate, MaterialUpdate
from app.services.audit import notify_user, log_action

db = get_database()

class MaterialService:

    @staticmethod
    async def create_material(data: MaterialCreate, lecturer_id: str, original_filename: str):

        material_doc = data.model_dump()
        material_doc["lecturer_id"] = ObjectId(lecturer_id)
        material_doc["course_id"] = ObjectId(data.course_id) 
        material_doc["created_at"] = datetime.now(timezone.utc)
        material_doc["updated_at"] = datetime.now(timezone.utc)

        result = db["materials"].insert_one(material_doc)
        created_material = MaterialService.get_by_id(str(result.inserted_id))


        lecturer = db["users"].find_one({"_id": ObjectId(lecturer_id)})
        lecturer_name = lecturer.get("full_name", "Lecturer") if lecturer else "Lecturer"

        await log_action(
            actor_id=lecturer_id,
            actor_name=lecturer_name,
            role="lecturer",
            action="MATERIAL_UPLOADED",
            details=f"Uploaded '{data.title}' ({original_filename}) to course {data.course_id}"
        )


        course = db["courses"].find_one({"_id": ObjectId(data.course_id)})
        course_name = course.get("name", "your course") if course else "your course"


        enrolled_students = db["users"].find({
            "role": "student",
            "enrolled_courses": ObjectId(data.course_id) 
        })

        for student in enrolled_students:
            await notify_user(
                recipient_id=str(student["_id"]),
                target_role="student",
                title="New Study Material",
                message=f"Prof. {lecturer_name} uploaded '{data.title}' for {course_name}.",
                link=f"/student/courses/{str(data.course_id)}"
            )

        return created_material

    @staticmethod
    def get_by_id(material_id: str):
        material = db["materials"].find_one({"_id": ObjectId(material_id)})
        if material:
            material["_id"] = str(material["_id"]) 
            if "lecturer_id" in material:
                material["lecturer_id"] = str(material["lecturer_id"])
            if "course_id" in material:
                material["course_id"] = str(material["course_id"])
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