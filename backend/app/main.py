from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.utils.websocket_manager import manager

from app.routes.test_db import router as test_db_router
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.lecturer_routes import router as lecturer_router
from app.routes.student_routes import router as student_router
from app.routes.course_routes import router as course_router
from app.routes.department_routes import router as department_router
from app.routes.material_routes import router as material_router
from app.routes.system_log_routes import router as system_log_router
from app.routes.notification_routes import router as notifications
from app.routes.assessment_routes import router as assessment_router
from app.routes.predict_exam_score import router as predict_exam_score_router

from app.config.settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

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

os.makedirs("uploads/materials", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Backend API running"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()           
    except WebSocketDisconnect:
        manager.disconnect(user_id)

app.include_router(test_db_router, prefix="/system", tags=["System"])

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(lecturer_router)
app.include_router(student_router)
app.include_router(course_router)
app.include_router(department_router)
app.include_router(material_router)
app.include_router(system_log_router)
app.include_router(notifications)
app.include_router(assessment_router)
app.include_router(predict_exam_score_router)



