import random
from datetime import datetime, timezone 
from bson import ObjectId
from app.database.connection import get_database
from app.models.user import StudentCreate

db = get_database()

class StudentService:

    @staticmethod
    def _generate_student_id() -> str:
        now = datetime.now(timezone.utc)
        
        # Safely format date as YYMMDD
        date_string = now.strftime("%y%m%d")
        date_prefix = f"st{date_string}"
        
        today_count = db["students"].count_documents({
            "student_id": {"$regex": f"^{date_prefix}"}
        })
        
        # Format the count as a 3-digit sequence (ex:- 001)
        sequence = f"{today_count + 1:03d}"
        
        return f"{date_prefix}{sequence}"
    
    @staticmethod
    def _create_student_profile(user_id, data: StudentCreate):
        student_doc = {
            "user_id": user_id,
            "student_id": StudentService._generate_student_id(),
            "department": data.department,
            "year": data.year,
            "semester": data.semester
        }
        db["students"].insert_one(student_doc)

    @staticmethod
    def get_by_id(user_id):
        user = db["users"].find_one({"_id": ObjectId(user_id)})
        profile = db["students"].find_one({"user_id": ObjectId(user_id)})

        if not user or not profile:
            return None

        user["user_id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password", None)
        user.update(profile)

        return user

    @staticmethod
    def update_student(user_id, data):
        update_doc = {
            **{k: v for k, v in data.model_dump(exclude_unset=True).items()},
            "updated_at": datetime.now(timezone.utc)
        }

        db["students"].update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": update_doc}
        )

        return StudentService.get_by_id(user_id)

    @staticmethod
    def delete_student(user_id):
        db["students"].delete_one({"user_id": ObjectId(user_id)})
        db["users"].delete_one({"_id": ObjectId(user_id)})

        return True