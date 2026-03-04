import os
import json
import shutil
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from bson import ObjectId

from app.database.connection import get_database
from app.models.assessment import AssessmentCreate

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

        # Convert any known relationship IDs to strings
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
    def create_assessment(
        data: AssessmentCreate, lecturer_id: str, file: UploadFile = None
    ):
        doc = data.model_dump()
        doc["lecturer_id"] = ObjectId(lecturer_id)
        doc["course_id"] = ObjectId(data.course_id)
        doc["created_at"] = AssessmentService._now()
        doc["updated_at"] = AssessmentService._now()

        # Handle PDF uploads directly in the service
        if data.assessment_type == "pdf" and file:
            upload_dir = "uploads/assessments"
            os.makedirs(upload_dir, exist_ok=True)

            file_location = f"{upload_dir}/{file.filename}"
            with open(file_location, "wb+") as f:
                shutil.copyfileobj(file.file, f)
            doc["file_url"] = f"/{file_location}"

        result = assessments_col.insert_one(doc)
        saved_doc = assessments_col.find_one({"_id": result.inserted_id})
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

        # Cascade delete from the correct collection
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

        # Handle MCQ Answers & AUTO-GRADING
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
                        if q_id in parsed_answers and parsed_answers[q_id] == q.get(
                            "correctIndex"
                        ):
                            correct_count += 1

                    total_questions = len(questions)
                    max_score = assessment.get("total_marks", 100)

                    # Calculate final score
                    if total_questions > 0:
                        calculated_score = int(
                            (correct_count / total_questions) * max_score
                        )
                        update_data["score"] = calculated_score
                        update_data["status"] = "graded"

            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format for answers")

        # 2. Handle PDF Uploads
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

    # Method for lecturers to view all submissions
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

            # Fetch the user to get their full name
            user = db["users"].find_one({"_id": ObjectId(student_id_str)})

            if user:
                formatted_sub["student_name"] = user.get("full_name", "Unknown Student")

                # Try to find their custom ID (e.g. st2026354)
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
