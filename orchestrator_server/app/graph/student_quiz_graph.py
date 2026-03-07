from typing import Any, Dict, List, Literal, TypedDict
import json
import logging
import uuid
from langchain_community.chat_models import ChatOllama
from langgraph.graph import END, StateGraph

from orchestrator_server.app.graph.assessment_graph import _call_llm, _extract_json_from_content

from ..config import settings
from ..rag.vectorstore import retrieve_passages_for_course 

logger = logging.getLogger(__name__)

class StudentQuizState(TypedDict, total=False):
    course_id: str           
    student_topic: str       
    num_questions: int
    
    question_count: int
    questions: List[Dict[str, Any]]
    
    supporting_passages: List[Dict[str, Any]]
    candidate_question: Dict[str, Any]
    last_verdict: Literal["accept", "reject"]
    
    step_count: int
    max_attempts: int

def _student_generator_prompt(topic: str, passages: List[Dict[str, Any]], previous_stems: List[str] | None = None) -> str:
    context_blocks = []
    for doc in passages:
        metadata = doc.get("metadata") or {}
        src = metadata.get("source_file", "course_material")
        context_blocks.append(f"[source={src}] {doc.get('page_content', '')}")

    context_text = "\n\n".join(context_blocks)

    base = f"""You are generating a practice multiple-choice question for a student studying: "{topic}".

Use ONLY the following course materials. Do not add external knowledge.

CONTEXT:
{context_text}

Create exactly ONE multiple-choice question that can be answered directly from the context.
The question must have exactly 4 options with one correct answer.

Because this is for self-study, you MUST include a 'hint' to guide the student, and a detailed 'rationale' explaining why the correct answer is right and the others are wrong.

You MUST respond with ONLY a JSON object, no other text. Use this exact format:
{{
    "id": "q1", 
    "stem": "What is ...?", 
    "options": ["A", "B", "C", "D"], 
    "correct_option_index": 0, 
    "hint": "Think about the relationship between X and Y...",
    "rationale": "Option A is correct because... Option B is incorrect because...", 
    "source_metadata": {{}}
}}"""

    if previous_stems:
        stems_list = "\n".join(f"- {s}" for s in previous_stems[-5:])
        base += f"\n\nIMPORTANT: Do not repeat these questions:\n{stems_list}"

    return base

def student_generator_node(state: StudentQuizState) -> StudentQuizState:
    llm = ChatOllama(
        model=settings.planner_model_name,
        base_url=settings.ollama_base_url,
        temperature=0.7,
        format="json",
    )

    topic = state.get("student_topic", "Key concepts from the course materials")
    course_id = state.get("course_id")

    passages = retrieve_passages_for_course(course_id, topic, k=6)
    state["supporting_passages"] = [
        {"page_content": doc.page_content, "metadata": dict(doc.metadata or {})}
        for doc in passages
    ]

    previous_stems = [q.get("stem", "") for q in (state.get("questions") or [])]
    prompt = _student_generator_prompt(topic, state["supporting_passages"], previous_stems)
    
    content = _call_llm(llm, prompt, settings.assessment_llm_timeout_seconds)

    if content is None:
        state["last_verdict"] = "reject"
        return state

    parsed = _extract_json_from_content(content) 
    if parsed is not None:
        candidate = parsed
        candidate["id"] = str(uuid.uuid4())
        candidate["source_metadata"] = {"course_id": course_id, "topic": topic}
        state["candidate_question"] = candidate
        state["last_verdict"] = "accept"
    else:
        state["last_verdict"] = "reject"

    return state

def student_route_node(state: StudentQuizState) -> StudentQuizState:
    state["step_count"] = int(state.get("step_count", 0)) + 1

    if state.get("last_verdict") == "accept":
        questions = state.get("questions") or []
        questions.append(state["candidate_question"])
        state["questions"] = questions
        state["question_count"] = len(questions)

    num_questions = int(state.get("num_questions", 5))
    max_attempts = int(state.get("max_attempts", num_questions * 2))

    if state["step_count"] >= max_attempts or int(state.get("question_count", 0)) >= num_questions:
        state["route_decision"] = "done"
    else:
        state["route_decision"] = "more"
        
    return state

def decide_student_route(state: StudentQuizState) -> Literal["more", "done"]:
    return "more" if state.get("route_decision", "done") == "more" else "done"

def build_student_quiz_graph():
    graph = StateGraph(StudentQuizState)
    graph.add_node("generator", student_generator_node)
    graph.add_node("route", student_route_node)

    graph.set_entry_point("generator")
    graph.add_edge("generator", "route")
    graph.add_conditional_edges(
        "route",
        decide_student_route,
        {"more": "generator", "done": END},
    )
    return graph.compile()