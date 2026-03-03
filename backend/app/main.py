from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.test_db import router as test_db_router
from app.routes.auth_routes import router as auth_router

from app.routes.user_routes import router as user_router
from app.routes.lecturer_routes import router as lecturer_router
from app.routes.student_routes import router as student_router
from app.routes.course_routes import router as course_router
from app.routes.department_routes import router as department_router
from app.routes.material_routes import router as material_router
from app.routes.module_routes import router as module_router
from app.routes.topic_routes import router as topic_router
from app.routes.outcome_routes import router as outcome_router
from app.routes.assignment_routes import router as assignment_routes
from app.routes.question_routes import router as question_router
from app.routes.timetable_routes import router as timetable_router
from app.routes.lecture_plan_generator_route import router as lecture_plan_generator_router
from app.routes.system_log_routes import router as system_log_router
from app.routes.session_routes import router as session_router
from app.routes.attendance_routes import router as attendance_router
from app.routes.quiz_routes import router as quiz_router
from app.routes.exam_routes import router as exam_router
from app.routes.predict_exam_score import router as predict_exam_score_router

from app.config.settings import settings

app = FastAPI(title=settings.PROJECT_NAME)


@app.get("/")
def root():
    return {"message": "Backend API running"}


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(test_db_router, prefix="/system", tags=["System"])

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(lecturer_router)
app.include_router(student_router)
app.include_router(course_router)
app.include_router(department_router)
app.include_router(material_router)
app.include_router(module_router)

app.include_router(topic_router)
app.include_router(outcome_router)
app.include_router(assignment_routes)
app.include_router(question_router)
app.include_router(timetable_router)
app.include_router(system_log_router)
app.include_router(session_router)
app.include_router(attendance_router)
app.include_router(quiz_router)
app.include_router(exam_router)


app.include_router(lecture_plan_generator_router)

app.include_router(predict_exam_score_router)



