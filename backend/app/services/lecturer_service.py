from datetime import datetime, timezone
from app.database.connection import get_database
from app.models.user import LecturerCreate
from bson import ObjectId

db = get_database()


class LecturerService:

    @staticmethod
    def _create_lecturer_profile(user_id, data: LecturerCreate):
        lecturer_doc = {
            "user_id": user_id,
            "department": data.department,
            "specialization": data.specialization,
        }
        db["lecturers"].insert_one(lecturer_doc)

    @staticmethod
    def get_all():
        users = list(
            db["users"].aggregate(
                [
                    {
                        "$lookup": {
                            "from": "lecturers",
                            "localField": "_id",
                            "foreignField": "user_id",
                            "as": "profile",
                        }
                    },
                    {"$unwind": "$profile"},
                ]
            )
        )

        for u in users:
            u["user_id"] = str(u["_id"])
            u.pop("_id", None)
            u.pop("password", None)
            u.update(u.pop("profile"))

        return users

    @staticmethod
    def get_by_id(user_id):

        user = db["users"].find_one({"_id": ObjectId(user_id)})
        profile = db["lecturers"].find_one({"user_id": ObjectId(user_id)})

        if not user or not profile:
            return None

        user["user_id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password", None)
        user.update(profile)

        return user

    @staticmethod
    def update_lecturer(user_id, data):

        update_doc = {
            **{k: v for k, v in data.dict(exclude_unset=True).items()},
            "updated_at": datetime.now(timezone.utc),
        }
        db["lecturers"].update_one({"user_id": ObjectId(user_id)}, {"$set": update_doc})

        return LecturerService.get_by_id(user_id)

    @staticmethod
    def delete_lecturer(user_id):

        db["lecturers"].delete_one({"user_id": ObjectId(user_id)})
        db["users"].delete_one({"_id": ObjectId(user_id)})

        return True

    @staticmethod
    def get_dashboard_stats(user_id: str) -> dict:
        """
        Aggregates dashboard statistics for a specific lecturer.
        """

        try:
            lecturer_oid = ObjectId(user_id)
        except Exception:
            lecturer_oid = user_id

        courses_cursor = list(db["courses"].find({"lecturer_id": lecturer_oid}))
        courses_count = len(courses_cursor)

        unique_students = set()

        for d in courses_cursor:
            course_dept_name = d.get("department")
            if not course_dept_name:
                continue

            dept_match_conditions = [
                {"department": course_dept_name},
                {"department_id": course_dept_name},
            ]

            dept_doc = db["departments"].find_one({"name": course_dept_name})
            if dept_doc:
                dept_id_str = str(dept_doc["_id"])
                dept_match_conditions.extend(
                    [{"department": dept_id_str}, {"department_id": dept_id_str}]
                )

            try:
                course_sem_int = int(d.get("semester", 1))
            except (ValueError, TypeError):
                course_sem_int = 1

            student_query = {
                "$and": [
                    {"$or": dept_match_conditions},
                    {
                        "$or": [
                            {"semester": {"$gte": course_sem_int}},
                            {"semester": {"$gte": str(course_sem_int)}},
                        ]
                    },
                ]
            }

            students = list(db["students"].find(student_query, {"_id": 1}))

            if not students:
                fallback_query = {"role": "student", **student_query}
                students = list(db["users"].find(fallback_query, {"_id": 1}))

            for s in students:
                unique_students.add(str(s["_id"]))

        active_students_count = len(unique_students)

        published_assessments = db["assessments"].count_documents(
            {"lecturer_id": lecturer_oid}
        )
        assessment_ids = db["assessments"].distinct(
            "_id", {"lecturer_id": lecturer_oid}
        )
        pending_reviews = db["submissions"].count_documents(
            {"assessment_id": {"$in": assessment_ids}, "status": {"$ne": "graded"}}
        )

        recent_activity_cursor = (
            db["system_logs"]
            .find({"role": "lecturer", "actor_id": user_id})
            .sort("timestamp", -1)
            .limit(3)
        )

        recent_activities = [
            {"title": log["action"], "course": log.get("details", "General")}
            for log in recent_activity_cursor
        ]

        return {
            "stats": [
                {"label": "My Courses", "value": courses_count},
                {"label": "Active Students", "value": active_students_count},
                {"label": "Pending Reviews", "value": pending_reviews},
                {"label": "Published Assessments", "value": published_assessments},
            ],
            "recentActivities": (
                recent_activities
                if recent_activities
                else [{"title": "Account Created", "course": "System"}]
            ),
        }
