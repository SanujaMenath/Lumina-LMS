# backend/app/services/session_service.py
from app.database.connection import get_database
from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException, status

db = get_database()
sessions_col = db["sessions"]
courses_col = db["courses"]
lecturers_col = db["lecturers"]
users_col = db["users"]
course_students_col = db["course_students"] 

class SessionService:

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @staticmethod
    def _to_str_id(doc, id_field="_id"):
        doc["id"] = str(doc[id_field])
        doc.pop(id_field, None)
        return doc

    @staticmethod
    def _ensure_course_exists(course_id: ObjectId):
        if not courses_col.find_one({"_id": course_id}):
            raise HTTPException(status_code=404, detail="Course not found")

    @staticmethod
    def _ensure_lecturer_exists(lecturer_id: ObjectId):
        user = users_col.find_one({"_id": lecturer_id})
        if not user or user.get("role") != "lecturer":
            raise HTTPException(status_code=404, detail="Lecturer not found")

    @staticmethod
    def _check_overlap(entity_field, entity_id, start_time, end_time, exclude_session_id=None):
        """
        Check if there is an overlapping session for a given entity field (lecturer_id or location) 
        entity_field: field name in sessions collection ("lecturer_id" or "location")
        entity_id: ObjectId for lecturer or string for location
        """
        query = {}
        if entity_field == "lecturer_id":
            query["lecturer_id"] = entity_id
        else:
            query["location"] = entity_id

        query.update({
            "$and": [
                {"start_time": {"$lt": end_time}},
                {"end_time": {"$gt": start_time}}
            ]
        })

        if exclude_session_id:
            query["_id"] = {"$ne": exclude_session_id}

        existing = sessions_col.find_one(query)
        return existing is not None

    @staticmethod
    def create_session(payload):
        course_oid = ObjectId(str(payload.course_id))
        lecturer_oid = ObjectId(str(payload.lecturer_id))
        start = payload.start_time
        end = payload.end_time

        if start >= end:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")

        SessionService._ensure_course_exists(course_oid)
        SessionService._ensure_lecturer_exists(lecturer_oid)

        if SessionService._check_overlap("lecturer_id", lecturer_oid, start, end):
            raise HTTPException(status_code=400, detail="Lecturer has another session during this time")

        if payload.location and SessionService._check_overlap("location", payload.location, start, end):
            raise HTTPException(status_code=400, detail="Location is already booked during this time")

        now = SessionService._now()
        doc = {
            "course_id": course_oid,
            "lecturer_id": lecturer_oid,
            "topic": payload.topic,
            "start_time": start,
            "end_time": end,
            "location": payload.location,
            "description": payload.description,
            "created_at": now,
            "updated_at": now
        }

        res = sessions_col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return SessionService._to_str_id(doc)

    @staticmethod
    def list_sessions(skip=0, limit=100, course_id=None, lecturer_id=None, date_from=None, date_to=None):
        q = {}
        if course_id:
            if not ObjectId.is_valid(course_id):
                raise HTTPException(status_code=400, detail="Invalid course id")
            q["course_id"] = ObjectId(course_id)
        if lecturer_id:
            if not ObjectId.is_valid(lecturer_id):
                raise HTTPException(status_code=400, detail="Invalid lecturer id")
            q["lecturer_id"] = ObjectId(lecturer_id)
        if date_from or date_to:
            q["start_time"] = {}
            if date_from:
                q["start_time"]["$gte"] = date_from
            if date_to:
                q["start_time"]["$lte"] = date_to

        cursor = sessions_col.find(q).skip(int(skip)).limit(int(limit)).sort("start_time", 1)
        out = []
        for s in cursor:
            out.append(SessionService._to_str_id(s))
        return out

    @staticmethod
    def get_session(session_id: str):
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session id")
        doc = sessions_col.find_one({"_id": ObjectId(session_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionService._to_str_id(doc)

    @staticmethod
    def update_session(session_id: str, payload):
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session id")
        oid = ObjectId(session_id)
        current = sessions_col.find_one({"_id": oid})
        if not current:
            raise HTTPException(status_code=404, detail="Session not found")

        update_doc = {k: v for k, v in payload.dict(exclude_unset=True).items()}

        start = update_doc.get("start_time", current["start_time"])
        end = update_doc.get("end_time", current["end_time"])
        if start >= end:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")

        # lecturer validation if changed
        lecturer_oid = ObjectId(update_doc["lecturer_id"]) if "lecturer_id" in update_doc else current["lecturer_id"]
        if "lecturer_id" in update_doc:
            SessionService._ensure_lecturer_exists(lecturer_oid)

        # overlap checks (exclude current session)
        if SessionService._check_overlap("lecturer_id", lecturer_oid, start, end, exclude_session_id=oid):
            raise HTTPException(status_code=400, detail="Lecturer has another session during this time")

        if "location" in update_doc and update_doc["location"]:
            if SessionService._check_overlap("location", update_doc["location"], start, end, exclude_session_id=oid):
                raise HTTPException(status_code=400, detail="Location is already booked during this time")

        update_doc["updated_at"] = SessionService._now()
        sessions_col.update_one({"_id": oid}, {"$set": update_doc})
        return SessionService.get_session(session_id)

    @staticmethod
    def delete_session(session_id: str):
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session id")
        res = sessions_col.delete_one({"_id": ObjectId(session_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        # consider cascading: attendance records, materials linked to session (future)
        return {"message": "Session deleted"}
