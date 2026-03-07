import os
import json
import shutil
from datetime import datetime, timezone
from fastapi import HTTPException, UploadFile
from bson import ObjectId
from app.database.connection import get_database
from app.models.assessment import AssessmentCreate
from app.services.audit import notify_user, log_action

db = get_database()
assessments_col = db["assessments"]
submissions_col = db["submissions"]
courses_col = db["courses"]


class AssessmentService:
    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @staticmethod
    def _format_doc(doc: dict) -> dict:
        """Helper to centralize ObjectId to string conversions."""
        if not doc:
            return None

        doc["id"] = str(doc.pop("_id"))


        for field in ["course_id", "lecturer_id", "student_id", "assessment_id"]:
            if field in doc and doc[field]:
                doc[field] = str(doc[field])

        return doc

    @staticmethod
    def _safe_object_id(id_str: str) -> ObjectId:
        """Helper to safely parse an ObjectId."""
        if not ObjectId.is_valid(id_str):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        return ObjectId(id_str)

    @staticmethod
    async def create_assessment( 
        data: AssessmentCreate, lecturer_id: str, file: UploadFile = None
    ):
        doc = data.model_dump()
        doc["lecturer_id"] = ObjectId(lecturer_id)
        doc["course_id"] = ObjectId(data.course_id)
        doc["created_at"] = AssessmentService._now()
        doc["updated_at"] = AssessmentService._now()

        if data.assessment_type == "pdf" and file:
            upload_dir = "uploads/assessments"
            os.makedirs(upload_dir, exist_ok=True)

            file_location = f"{upload_dir}/{file.filename}"
            with open(file_location, "wb+") as f:
                shutil.copyfileobj(file.file, f)
            doc["file_url"] = f"/{file_location}"

        result = assessments_col.insert_one(doc)
        saved_doc = assessments_col.find_one({"_id": result.inserted_id})
        
        lecturer = db["users"].find_one({"_id": ObjectId(lecturer_id)})
        lecturer_name = lecturer.get("full_name", "Lecturer") if lecturer else "Lecturer"

        course = db["courses"].find_one({"_id": ObjectId(data.course_id)})
        course_name = course.get("course_name", course.get("name", "your course")) if course else "your course"
        course_dept_name = course.get("department") if course else None

        await log_action(
            actor_id=lecturer_id,
            actor_name=lecturer_name,
            role="lecturer",
            action="ASSESSMENT_CREATED",
            details=f"Created assessment '{data.title}' for course {data.course_id}"
        )
        
        if course_dept_name:
            dept_match_conditions = [
                {"department": course_dept_name},
                {"department_id": course_dept_name}
            ]
            
            dept_doc = db["departments"].find_one({"name": course_dept_name})
            
            if dept_doc:
                dept_id_str = str(dept_doc["_id"])
                dept_match_conditions.extend([
                    {"department": dept_id_str},
                    {"department_id": dept_id_str},
                    {"department_id": dept_doc["_id"]} 
                ])

            enrolled_students = list(db["students"].find({"$or": dept_match_conditions}))
            
            if len(enrolled_students) == 0:
                enrolled_students = list(db["users"].find({
                    "role": "student", 
                    "$or": dept_match_conditions
                }))

            print(f"DEBUG: Found {len(enrolled_students)} students to notify!")

            due_date_str = data.due_date.strftime('%Y-%m-%d %H:%M') if data.due_date else 'TBA'


            for student in enrolled_students:
                student_user_id = str(student.get("user_id", student.get("_id")))
                
                if student_user_id:
                    await notify_user(
                        recipient_id=student_user_id,
                        target_role="student",
                        title="New Assessment Published",
                        message=f"Prof. {lecturer_name} assigned '{data.title}' for {course_name}. Due: {due_date_str}.",
                        link=f"/student/courses/{data.course_id}" 
                    )

        return AssessmentService._format_doc(saved_doc)

    @staticmethod
    def list_assessments(course_id: str = None, skip: int = 0, limit: int = 100):
        query = {"course_id": ObjectId(course_id)} if course_id else {}
        cursor = assessments_col.find(query).skip(skip).limit(limit)
        return [AssessmentService._format_doc(doc) for doc in cursor]

    @staticmethod
    def get_assessment(assessment_id: str):
        if not ObjectId.is_valid(assessment_id):
            return None
        doc = assessments_col.find_one({"_id": ObjectId(assessment_id)})
        return AssessmentService._format_doc(doc)

    @staticmethod
    def update_assessment(assessment_id: str, payload):
        oid = AssessmentService._safe_object_id(assessment_id)
        update_doc = payload.model_dump(exclude_unset=True)
        if not update_doc:
            return AssessmentService.get_assessment(assessment_id)

        if "question_ids" in update_doc:
            update_doc["question_ids"] = [
                ObjectId(str(q)) for q in update_doc["question_ids"]
            ]

        update_doc["updated_at"] = AssessmentService._now()

        res = assessments_col.update_one({"_id": oid}, {"$set": update_doc})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Assessment not found")

        return AssessmentService.get_assessment(assessment_id)

    @staticmethod
    def delete_assessment(assessment_id: str):
        oid = AssessmentService._safe_object_id(assessment_id)
        res = assessments_col.delete_one({"_id": oid})

        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Assessment not found")

        submissions_col.delete_many({"assessment_id": oid})
        return {"message": "Assessment deleted"}

    @staticmethod
    def submit_assessment(
        assessment_id: str,
        student_id: str,
        answers: str = None,
        file: UploadFile = None,
    ):
        assessment = assessments_col.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            raise ValueError("Assessment not found")

        update_data = {"submitted_at": AssessmentService._now(), "status": "submitted"}

        if answers:
            try:
                parsed_answers = json.loads(answers)
                update_data["answers"] = parsed_answers

                if assessment.get("assessment_type") == "mcq" and assessment.get(
                    "content"
                ):
                    questions = json.loads(assessment["content"])
                    correct_count = 0

                    for q in questions:
                        q_id = str(q.get("id"))

                        if q_id not in parsed_answers:
                            continue

                        student_answer = int(parsed_answers[q_id])
                        correct_answer = int(q.get("correctIndex"))

                        if student_answer == correct_answer:
                            correct_count += 1

                    total_questions = len(questions)
                    max_score = assessment.get("total_marks")

                    if not max_score or max_score == 0:
                        max_score = total_questions

                    if total_questions > 0:
                        calculated_score = int(
                            (correct_count / total_questions) * 100
                        )
                        update_data["score"] = calculated_score
                        update_data["status"] = "graded"

            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format for answers")

        elif file:
            student_upload_dir = "uploads/submissions"
            os.makedirs(student_upload_dir, exist_ok=True)
            safe_filename = f"{student_id}_{assessment_id}_{file.filename}"
            file_location = f"{student_upload_dir}/{safe_filename}"

            with open(file_location, "wb+") as f:
                shutil.copyfileobj(file.file, f)
            update_data["file_url"] = f"/{file_location}"
            update_data["status"] = "submitted"
        else:
            raise ValueError("No submission data provided")

        filter_query = {
            "assessment_id": ObjectId(assessment_id),
            "student_id": ObjectId(student_id),
        }

        submissions_col.update_one(filter_query, {"$set": update_data}, upsert=True)
        return {"message": "Submission saved successfully!"}

    @staticmethod
    def get_assessment_submissions(assessment_id: str):
        if not ObjectId.is_valid(assessment_id):
            raise ValueError("Invalid assessment ID")

        submissions = list(
            submissions_col.find({"assessment_id": ObjectId(assessment_id)})
        )

        result = []
        for sub in submissions:
            formatted_sub = AssessmentService._format_doc(sub)
            student_id_str = formatted_sub["student_id"]

            user = db["users"].find_one({"_id": ObjectId(student_id_str)})

            if user:
                formatted_sub["student_name"] = user.get("full_name", "Unknown Student")

                student_profile = db["students"].find_one(
                    {"user_id": ObjectId(student_id_str)}
                )

                if student_profile and student_profile.get("student_id"):
                    formatted_sub["student_identifier"] = student_profile.get(
                        "student_id"
                    )
                elif user.get(
                    "student_id"
                ):  
                    formatted_sub["student_identifier"] = user.get("student_id")
                else:
                    formatted_sub["student_identifier"] = user.get("email", "")
            else:
                formatted_sub["student_name"] = "Unknown User"
                formatted_sub["student_identifier"] = student_id_str[-6:].upper()

            result.append(formatted_sub)

        return result

    @staticmethod
    def grade_submission(submission_id: str, score: int):
        if not ObjectId.is_valid(submission_id):
            raise ValueError("Invalid submission ID")

        res = submissions_col.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "score": score,
                    "status": "graded",
                    "updated_at": AssessmentService._now(),
                }
            },
        )
        if res.matched_count == 0:
            raise ValueError("Submission not found")
        return {"message": "Graded successfully"}

    @staticmethod
    def get_single_submission(assessment_id: str, student_id: str):
        if not ObjectId.is_valid(assessment_id) or not ObjectId.is_valid(student_id):
            return None

        doc = submissions_col.find_one(
            {
                "assessment_id": ObjectId(assessment_id),
                "student_id": ObjectId(student_id),
            }
        )
        return AssessmentService._format_doc(doc)

    @staticmethod
    def get_student_submissions(student_id: str):
        if not ObjectId.is_valid(student_id):
            raise ValueError("Invalid student ID format")

        cursor = submissions_col.find({"student_id": ObjectId(student_id)})
        return [AssessmentService._format_doc(sub) for sub in cursor]

    @staticmethod
    def get_student_course_grades(student_id: str):
        if not ObjectId.is_valid(student_id):
            raise ValueError("Invalid student ID")
            
        submissions = list(submissions_col.find({
            "student_id": ObjectId(student_id), 
            "status": "graded"
        }))

        course_totals = {} 

        for sub in submissions:
            assessment = assessments_col.find_one({"_id": sub["assessment_id"]})
            if not assessment:
                continue

            c_id = str(assessment["course_id"])
            
            raw_max = assessment.get("total_marks")
            max_score = int(raw_max) if raw_max else 100
            
            obtained_score = int(sub.get("score", 0))

            if c_id not in course_totals:
                course_totals[c_id] = {"obtained": 0, "max": 0}

            course_totals[c_id]["obtained"] += obtained_score
            course_totals[c_id]["max"] += max_score

        results = []
        for c_id, totals in course_totals.items():
            course = courses_col.find_one({"_id": ObjectId(c_id)})
            if not course:
                continue

            percentage = (totals["obtained"] / totals["max"]) * 100 if totals["max"] > 0 else 0
            
            if percentage >= 90: letter = "A+"
            elif percentage >= 85: letter = "A"
            elif percentage >= 80: letter = "A-"
            elif percentage >= 75: letter = "B+"
            elif percentage >= 70: letter = "B"
            elif percentage >= 65: letter = "C+"
            elif percentage >= 60: letter = "C"
            elif percentage >= 50: letter = "D"
            else: letter = "F"

            results.append({
                "id": c_id,
                "courseCode": course.get("course_code", course.get("code", "Unknown")),
                "courseName": course.get("course_name", course.get("name", "Unknown Course")),
                "credits": int(course.get("credits", 4)), 
                "score": round(percentage),
                "letterGrade": letter,
                "term": course.get("semester", course.get("term", "Semester 1"))
            })

        return results