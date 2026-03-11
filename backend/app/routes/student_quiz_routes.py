from fastapi import APIRouter, Depends
from orchestrator_server.app.graph.student_quiz_graph import build_student_quiz_graph
from app.dependencies.auth_dependencies import get_current_user


router = APIRouter()

@router.post("/generate-practice")
async def generate_practice_quiz(
    course_id: str, 
    topic: str, 
    num_questions: int = 5,
    current_user: dict = Depends(get_current_user)
):
    quiz_graph = build_student_quiz_graph()
    
    initial_state = {
        "course_id": course_id,
        "student_topic": topic,
        "num_questions": num_questions,
        "question_count": 0,
        "questions": [],
        "step_count": 0
    }
    
    final_state = quiz_graph.invoke(initial_state)
    
    return {
        "message": "Practice quiz generated successfully",
        "quiz_data": final_state.get("questions", [])
    }