from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .schemas import (
    AssessmentRequest,
    AssessmentResponse,
    PlanRequest,
    PlanResponse,
    UploadResponse,
)
from .services.assessments import generate_assessments
from .services.planner import generate_lecture_plan
from .rag.vectorstore import ingest_pdf

# from backend.app.routes.student_quiz_routes import router as student_quiz_router


app = FastAPI(title="LectureAI Backend", version="0.1.0")
# app.include_router(student_quiz_router,prefix="/student-quiz", tags=["Student Quiz AI"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/plan", response_model=PlanResponse)
async def create_plan(payload: PlanRequest) -> PlanResponse:
    try:
        lecture_plan = await generate_lecture_plan(
            module_title=payload.module_title,
            audience=payload.audience,
            duration_minutes=payload.duration_minutes,
        )
    except Exception as exc:  # pragma: no cover - top-level error guard
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return PlanResponse(lecture_plan=lecture_plan)


@app.post("/api/v1/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    document_set_id: str | None = None,
) -> UploadResponse:
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        result = await ingest_pdf(file, document_set_id=document_set_id)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return UploadResponse(**result)


@app.post("/api/v1/assessments", response_model=AssessmentResponse)
async def create_assessments(payload: AssessmentRequest) -> AssessmentResponse:
    try:
        result = await generate_assessments(payload)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return result


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "ollama_base_url": settings.ollama_base_url}

