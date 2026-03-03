# backend/app/services/course_service.py
from app.database.connection import get_database
from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException

db = get_database()
courses_col = db["courses"]
course_students_col = db["course_students"]


class CourseService:

    @staticmethod
    def create_course(data):
        if courses_col.find_one({"course_code": data.course_code}):
            raise HTTPException(status_code=400, detail="course_code already exists")

        now = datetime.now(timezone.utc)
        doc = {
            "course_code": data.course_code,
            "course_name": data.course_name,
            "description": data.description,
            "department": data.department,
            "credits": data.credits or 0,
            "year": data.year,
            "semester": data.semester,
            "created_at": now,
            "updated_at": now,
            "lecturer_id": data.lecturer_id 
        }
        res = courses_col.insert_one(doc)
        doc["_id"] = res.inserted_id
        doc["id"] = str(res.inserted_id)
        return doc

    @staticmethod
    def list_courses(skip: int = 0, limit: int = 100):
        docs = courses_col.find().skip(skip).limit(limit)
        out = []
        for d in docs:
            d["id"] = str(d["_id"])
            d.pop("_id", None)
            out.append(d)
        return out

    @staticmethod
    def list_courses_for_user(user):
        if user["role"] == "admin":
            return CourseService.list_courses()

        elif user["role"] == "lecturer":
            docs = courses_col.find({"lecturer_id": ObjectId(user["id"])})
            out = []
            for d in docs:
                d["id"] = str(d["_id"])
                d["course_id"] = str(d["_id"])
                d.pop("_id", None)
                
                if "lecturer_id" in d and d["lecturer_id"]:
                    d["lecturer_id"] = str(d["lecturer_id"])
                
                course_dept_name = d.get("department")
                if course_dept_name:
                    d["department"] = str(course_dept_name)

                # --- NEW FIX: Reverse lookup the Department ID ---
                # Default match conditions (matching the exact string)
                dept_match_conditions = [
                    {"department": course_dept_name},
                    {"department_id": course_dept_name}
                ]
                
                # Try to find this department in the DB to get its ObjectId string
                dept_doc = db["departments"].find_one({"name": course_dept_name})
                if dept_doc:
                    dept_id_str = str(dept_doc["_id"])
                    # Add the ID to our match conditions
                    dept_match_conditions.extend([
                        {"department": dept_id_str},
                        {"department_id": dept_id_str}
                    ])
                # ------------------------------------------------

                try:
                    course_sem_int = int(d.get("semester", 1))
                except (ValueError, TypeError):
                    course_sem_int = 1

                # We use $and to combine the department match AND the semester match
                student_query = {
                    "$and": [
                        {"$or": dept_match_conditions},
                        {"$or": [
                            {"semester": {"$gte": course_sem_int}},
                            {"semester": {"$gte": str(course_sem_int)}} # Catch string "1"
                        ]}
                    ]
                }
                
                # Check both 'students' collection AND 'users' collection 
                # (depending on where your student registration logic saved them)
                enrolled_count = db["students"].count_documents(student_query)
                
                if enrolled_count == 0:
                    # Fallback just in case student metadata was saved directly in the 'users' collection
                    fallback_query = {"role": "student", **student_query}
                    enrolled_count = db["users"].count_documents(fallback_query)

                d["enrolled_students"] = enrolled_count
                
                out.append(d)
            return out

        elif user["role"] == "student":
            return CourseService.get_courses_of_student(user["id"])
            
        return []


    @staticmethod
    def get_course(course_id: str):
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course id")
        doc = courses_col.find_one({"_id": ObjectId(course_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Course not found")
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update_course(course_id: str, data):
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course id")
            
        update_doc = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        
        if not update_doc:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        update_doc["updated_at"] = datetime.now(timezone.utc)
        res = courses_col.update_one({"_id": ObjectId(course_id)}, {"$set": update_doc})
        
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Course not found")
            
        return CourseService.get_course(course_id)

    @staticmethod
    def delete_course(course_id: str):
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course id")
        # remove enrollments first (cascade)
        course_students_col.delete_many({"course_id": ObjectId(course_id)})
        res = courses_col.delete_one({"_id": ObjectId(course_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        return {"message": "Course deleted"}

    # Enrollment helpers
    @staticmethod
    def enroll_student(course_id: str, student_id: str):
        if not ObjectId.is_valid(course_id) or not ObjectId.is_valid(student_id):
            raise HTTPException(status_code=400, detail="Invalid IDs")

        course_oid = ObjectId(course_id)
        student_oid = ObjectId(student_id)

        # Check course exists
        course = courses_col.find_one({"_id": course_oid})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check student exists
        student = db["users"].find_one({"_id": student_oid})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check role
        if student.get("role") != "student":
            raise HTTPException(status_code=400, detail="User is not a student")

        # Check already enrolled
        exists = course_students_col.find_one(
            {"course_id": course_oid, "student_id": student_oid}
        )
        if exists:
            raise HTTPException(status_code=400, detail="Student already enrolled")

        now = datetime.now(timezone.utc)
        rec = {
            "course_id": ObjectId(course_id),
            "student_id": ObjectId(student_id),
            "enrolled_at": now,
            "status": "active",
        }

        res = course_students_col.insert_one(rec)

        return {
            "id": str(res.inserted_id),
            "course_id": course_id,
            "student_id": student_id,
            "enrolled_at": now,
            "status": "active",
        }

    @staticmethod
    def unenroll_student(course_id: str, student_id: str):
        # Validate ObjectId format
        if not ObjectId.is_valid(course_id) or not ObjectId.is_valid(student_id):
            raise HTTPException(status_code=400, detail="Invalid IDs")

        course_oid = ObjectId(course_id)
        student_oid = ObjectId(student_id)

        # Check course exists
        course = courses_col.find_one({"_id": course_oid})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check student exists
        student = db["users"].find_one({"_id": student_oid})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check user role
        if student.get("role") != "student":
            raise HTTPException(status_code=400, detail="User is not a student")

        # Check enrollment record exists
        enrollment = course_students_col.find_one(
            {"course_id": course_oid, "student_id": student_oid}
        )

        if not enrollment:
            raise HTTPException(
                status_code=404, detail="Student not enrolled in this course"
            )

        # Perform deletion
        course_students_col.delete_one(
            {"course_id": course_oid, "student_id": student_oid}
        )

        return {
            "message": "Student unenrolled successfully",
            "course_id": course_id,
            "student_id": student_id,
        }

    @staticmethod
    def get_students_in_course(course_id: str):
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course id")

        pipeline = [
            {"$match": {"course_id": ObjectId(course_id)}},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "student_id",
                    "foreignField": "user_id",
                    "as": "student_info",
                }
            },
            {"$unwind": "$student_info"},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "student_info.user_id",
                    "foreignField": "_id",
                    "as": "user_info",
                }
            },
            {"$unwind": "$user_info"},
            {
                "$project": {
                    "_id": 0,
                    "user_id": {"$toString": "$user_info._id"},
                    "full_name": "$user_info.full_name",
                    "email": "$user_info.email",
                    "department": "$student_info.department",
                    "year": "$student_info.year",
                    "semester": "$student_info.semester",
                    "enrolled_at": "$enrolled_at",
                    "status": "$status",
                }
            },
        ]

        return list(course_students_col.aggregate(pipeline))

    @staticmethod
    def get_courses_of_student(student_id: str):
        if not ObjectId.is_valid(student_id):
            raise HTTPException(status_code=400, detail="Invalid student id")

        # 1. Fetch from the students collection using user_id
        student_record = db["students"].find_one({"user_id": ObjectId(student_id)})
        
        if not student_record:
            student_record = db["users"].find_one({"_id": ObjectId(student_id)})

        if not student_record:
            raise HTTPException(status_code=404, detail="Student record not found")

        # 2. Get the department ID
        dept_identifier = student_record.get("department") or student_record.get("department_id")
        
        if not dept_identifier:
            return []

        # 3. Convert that ID into the Department Name 
        student_dept_name = dept_identifier
        
        if ObjectId.is_valid(str(dept_identifier)):
            # fetch the real name from the departments collection
            dept_doc = db["departments"].find_one({"_id": ObjectId(str(dept_identifier))})
            if dept_doc and "name" in dept_doc:
                student_dept_name = dept_doc["name"]

        # 4. Get Semester safely
        try:
            student_semester_int = int(student_record.get("semester", 1))
        except (ValueError, TypeError):
            student_semester_int = 1

        student_semester_str = str(student_semester_int)

        # 5. Execute Pipeline matching the NAME
        pipeline = [
            {
                "$match": {
                    "$and": [
                        # Match the resolved Department Name
                        {
                            "$or": [
                                {"department": student_dept_name},
                                {"department": dept_identifier} # fallback
                            ]
                        },
                        # Match Semester
                        {
                            "$or": [
                                {"semester": {"$lte": student_semester_int}},
                                {"semester": {"$lte": student_semester_str}}
                            ]
                        }
                    ]
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "lecturer_id",
                    "foreignField": "_id",
                    "as": "lecturer_info",
                }
            },
            {
                "$unwind": {
                    "path": "$lecturer_info",
                    "preserveNullAndEmptyArrays": True 
                }
            },
            {
                "$lookup": {
                    "from": "course_students",
                    "let": {"c_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$course_id", "$$c_id"]},
                                        {"$eq": ["$student_id", ObjectId(student_id)]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "enrollment_data"
                }
            },
            {
                "$unwind": {
                    "path": "$enrollment_data",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "course_id": {"$toString": "$_id"},
                    "course_code": "$course_code",
                    "course_name": "$course_name",
                    "description": "$description",
                    "credits": "$credits",
                    "semester": "$semester",
                    "lecturer_name": {"$ifNull": ["$lecturer_info.full_name", "TBA"]},
                    "progress": {"$ifNull": ["$enrollment_data.progress", 0]},
                    "last_accessed": {"$ifNull": ["$enrollment_data.last_accessed", "Never"]},
                }
            },
        ]

        return list(courses_col.aggregate(pipeline))
    
 

    
