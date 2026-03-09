from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, Dict, List, Literal, TypedDict
from langchain_community.chat_models import ChatOllama
from langgraph.graph import END, StateGraph
from ..config import settings
from ..rag.vectorstore import retrieve_passages

logger = logging.getLogger(__name__)

class AssessmentState(TypedDict, total=False):
    lecture_plan: Dict[str, Any]
    document_set_id: str
    num_questions: int
    focus_topics: List[str]

    topics: List[str]
    topic_index: int
    question_count: int
    questions: List[Dict[str, Any]]
    num_rejected: int

    current_topic: str
    supporting_passages: List[Dict[str, Any]]
    candidate_question: Dict[str, Any]
    critic_feedback: str
    last_verdict: Literal["accept", "reject"]

    max_attempts: int
    step_count: int
    generator_placeholder: bool


def _extract_json_from_content(content: str) -> dict[str, Any] | None:
    """
    Robustly extract a JSON object from LLM output.

    Handles markdown fences, prose around JSON, etc.
    """
    content = content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    if content.startswith("```"):
        parts = content.split("```")
        if len(parts) >= 3:
            inner = parts[1]
            if inner.startswith("json"):
                inner = inner[4:]
            inner = inner.strip()
            try:
                return json.loads(inner)
            except json.JSONDecodeError:
                content = inner

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = content[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    return None


def _extract_topics(state: AssessmentState) -> List[str]:
    """Build a diverse list of query topics from the lecture plan."""
    segments = (state.get("lecture_plan") or {}).get("segments") or []
    focus = state.get("focus_topics") or []

    topics: list[str] = []
    for seg in segments:
        title = seg.get("title", "")
        if focus and not any(ft.lower() in title.lower() or title.lower() in ft.lower() for ft in focus):
            continue
        if title:
            topics.append(title)
        for obj in seg.get("learning_objectives") or []:
            if obj:
                topics.append(str(obj))

    if not topics and focus:
        topics = list(focus)

    if not topics:
        topics = ["Key concepts, main ideas, and important definitions from the document"]

    return list(dict.fromkeys(topics))

def _generator_prompt(
    topic: str,
    passages: List[Dict[str, Any]],
    previous_stems: List[str] | None = None,
    feedback: str | None = None,
) -> str:
    context_blocks = []
    for doc in passages:
        metadata = doc.get("metadata") or {}
        src = metadata.get("source_file", "unknown.pdf")
        page = metadata.get("page", metadata.get("page_number", "?"))
        context_blocks.append(f"[source={src}, page={page}] {doc.get('page_content', '')}")

    context_text = "\n\n".join(context_blocks)

    base = f"""You are generating a multiple-choice question for the lecture topic: "{topic}".

Use ONLY the following context passages. Do not add external knowledge.

CONTEXT:
{context_text}

Create exactly ONE multiple-choice question that can be answered directly from the context.
The question must have exactly 4 options with one correct answer.
The question MUST be unique and different from any previously generated questions.

You MUST respond with ONLY a JSON object, no other text. Use this exact format:
{
{
  "id": "q1", 
  "stem": "What is...?", 
  "options": ["A. ", "B. ", "C. ", "D. "], 
  "correct_option_index": 0, 
  "explanation": "Because...", 
  "source_metadata": {}
}}"""

    if previous_stems:
        stems_list = "\n".join(f"- {s}" for s in previous_stems[-10:])
        base += (
            f"\n\nIMPORTANT: The following questions have ALREADY been asked. "
            f"You MUST ask about a DIFFERENT concept or detail.\n"
            f"Already asked:\n{stems_list}"
        )

    if feedback:
        base += (
            "\n\nFeedback from a previous attempt:\n"
            f"{feedback}\n"
            "Generate a different question that addresses this feedback."
        )
    return base


def _critic_prompt(question: Dict[str, Any], passages: List[Dict[str, Any]]) -> str:
    context_blocks = []
    for doc in passages:
        metadata = doc.get("metadata") or {}
        src = metadata.get("source_file", "unknown.pdf")
        page = metadata.get("page", metadata.get("page_number", "?"))
        context_blocks.append(f"[source={src}, page={page}] {doc.get('page_content', '')}")

    context_text = "\n\n".join(context_blocks)

    return f"""You verify whether a multiple-choice question can be answered using ONLY the provided context.

QUESTION:
{json.dumps(question, ensure_ascii=False)}

CONTEXT:
{context_text}

Is the correct answer clearly supported by the context?

You MUST respond with ONLY a JSON object, no other text. Use this exact format:
{{"verdict": "accept", "reason": "The answer is supported by ..."}}

Use "accept" if the answer is supported, or "reject" if it is not."""


def _call_llm(llm: ChatOllama, prompt: str, timeout_seconds: float) -> str | None:
    """Invoke LLM with logging. Returns content string or None on failure."""
    start = time.perf_counter()
    try:
        response = llm.invoke(prompt)
        elapsed = time.perf_counter() - start
        content = response.content if hasattr(response, "content") else str(response)
        logger.info("LLM call completed in %.1fs (%d chars)", elapsed, len(content))
        return content
    except Exception as exc:
        elapsed = time.perf_counter() - start
        logger.warning("LLM call failed after %.1fs: %s", elapsed, exc)
        return None


def _make_placeholder(topic: str, note: str) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "stem": f"Placeholder question about {topic}.",
        "options": ["A", "B", "C", "D"],
        "correct_option_index": 0,
        "explanation": f"Auto-generated placeholder ({note}).",
        "source_metadata": {"note": note},
    }


_LETTER_TO_INDEX = {"a": 0, "b": 1, "c": 2, "d": 3}


def _normalise_option_index(value: Any) -> int:
    """Convert correct_option_index to an int, handling letters like 'C' or string ints like '2'."""
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        lower = value.strip().lower()
        if lower in _LETTER_TO_INDEX:
            return _LETTER_TO_INDEX[lower]
        try:
            return int(lower)
        except ValueError:
            pass
    return 0


def generator_node(state: AssessmentState) -> AssessmentState:
    llm = ChatOllama(
        model=settings.planner_model_name,
        base_url=settings.ollama_base_url,
        temperature=0.7,
        format="json",
    )

    topics = state.get("topics") or _extract_topics(state)
    if not topics:
        state["last_verdict"] = "reject"
        return state

    state["topics"] = topics
    topic_index = int(state.get("topic_index", 0))
    if topic_index >= len(topics):
        topic_index = 0
    topic = topics[topic_index]
    state["current_topic"] = topic

    logger.info("Generator: topic='%s' (index %d of %d)", topic, topic_index, len(topics))
    passages = retrieve_passages(state["document_set_id"], topic, k=6)
    state["supporting_passages"] = [
        {"page_content": doc.page_content, "metadata": dict(doc.metadata or {})}
        for doc in passages
    ]


    previous_stems = [q.get("stem", "") for q in (state.get("questions") or [])]

    feedback = state.get("critic_feedback")
    prompt = _generator_prompt(topic, state["supporting_passages"], previous_stems=previous_stems, feedback=feedback)
    content = _call_llm(llm, prompt, settings.assessment_llm_timeout_seconds)

    placeholder_used = False

    if content is None:
        logger.warning("Generator: LLM failed, using placeholder for topic='%s'", topic)
        candidate = _make_placeholder(topic, "generator_timeout")
        placeholder_used = True
    else:
        parsed = _extract_json_from_content(content)
        if parsed is not None:
            candidate = parsed
            logger.info("Generator: successfully parsed JSON question for topic='%s'", topic)
        else:
            logger.warning("Generator: could not extract JSON, using placeholder for topic='%s'", topic)
            logger.debug("Generator: raw LLM output: %s", content[:500])
            candidate = _make_placeholder(topic, "generator_json_fallback")
            placeholder_used = True

    candidate["id"] = str(uuid.uuid4())
    candidate["correct_option_index"] = _normalise_option_index(candidate.get("correct_option_index", 0))
    if "source_metadata" not in candidate:
        candidate["source_metadata"] = {}
    candidate["source_metadata"].setdefault("topic", topic)
    candidate["source_metadata"].setdefault("document_set_id", state["document_set_id"])

    state["candidate_question"] = candidate
    state["generator_placeholder"] = placeholder_used
    state.pop("critic_feedback", None)
    return state


def critic_node(state: AssessmentState) -> AssessmentState:
    candidate = state.get("candidate_question") or {}

    if state.get("generator_placeholder"):
        logger.info("Critic: auto-accepting placeholder id=%s", candidate.get("id"))
        questions = state.get("questions") or []
        questions.append(candidate)
        state["questions"] = questions
        state["last_verdict"] = "accept"
        state["generator_placeholder"] = False
        return state

    llm = ChatOllama(
        model=settings.planner_model_name,
        base_url=settings.ollama_base_url,
        temperature=0.0,
        format="json",
    )

    passages = state.get("supporting_passages") or []
    prompt = _critic_prompt(candidate, passages)
    logger.info("Critic: evaluating question id=%s", candidate.get("id"))
    content = _call_llm(llm, prompt, settings.assessment_critic_timeout_seconds)

    if content is None:
        logger.warning("Critic: LLM failed; auto-accepting question id=%s", candidate.get("id"))
        candidate.setdefault("source_metadata", {})["note"] = "critic_timeout_accepted"
        questions = state.get("questions") or []
        questions.append(candidate)
        state["questions"] = questions
        state["last_verdict"] = "accept"
        return state

    parsed = _extract_json_from_content(content)
    if parsed is None:
        logger.warning("Critic: could not extract JSON; auto-accepting question id=%s", candidate.get("id"))
        candidate.setdefault("source_metadata", {})["note"] = "critic_json_accepted"
        questions = state.get("questions") or []
        questions.append(candidate)
        state["questions"] = questions
        state["last_verdict"] = "accept"
        return state

    verdict = parsed.get("verdict", "accept")
    if verdict not in ("accept", "reject"):
        verdict = "accept"

    logger.info("Critic: verdict=%s for question id=%s", verdict, candidate.get("id"))
    state["last_verdict"] = verdict 

    if verdict == "accept":
        questions = state.get("questions") or []
        questions.append(candidate)
        state["questions"] = questions
    else:
        state["critic_feedback"] = parsed.get(
            "reason",
            "The answer is not clearly supported by the provided context. Regenerate.",
        )
        state["num_rejected"] = int(state.get("num_rejected", 0)) + 1

    return state


def route_node(state: AssessmentState) -> AssessmentState:
    """Update counters and choose whether to continue or end."""
    state["step_count"] = int(state.get("step_count", 0)) + 1

    if state.get("last_verdict") == "accept":
        state["question_count"] = int(state.get("question_count", 0)) + 1

    num_questions = int(state.get("num_questions", 5))
    max_attempts = int(state.get("max_attempts", num_questions * settings.assessment_max_attempt_multiplier))

    if state["step_count"] >= max_attempts and int(state.get("question_count", 0)) < num_questions:
        logger.warning(
            "Route: max_attempts reached (step=%s, max=%s, accepted=%s, target=%s); stopping early",
            state["step_count"], max_attempts, state.get("question_count", 0), num_questions,
        )
        state["route_decision"] = "done" 
        return state

    if int(state.get("question_count", 0)) >= num_questions:
        logger.info("Route: target reached (%s questions); done", state.get("question_count", 0))
        state["route_decision"] = "done" 
        return state

    topics = state.get("topics") or _extract_topics(state)
    topic_index = int(state.get("topic_index", 0))
    topic_index = (topic_index + 1) % max(len(topics), 1)
    state["topics"] = topics
    state["topic_index"] = topic_index
    state["route_decision"] = "more" 
    return state


def decide_route(state: AssessmentState) -> Literal["more", "done"]:
    decision = state.get("route_decision", "done")
    return "more" if decision == "more" else "done"


def build_assessment_graph():
    """Create the LangGraph graph for assessment generation."""
    graph = StateGraph(AssessmentState)
    graph.add_node("generator", generator_node)
    graph.add_node("critic", critic_node)
    graph.add_node("route", route_node)

    graph.set_entry_point("generator")
    graph.add_edge("generator", "critic")
    graph.add_edge("critic", "route")

    graph.add_conditional_edges(
        "route",
        decide_route,
        {
            "more": "generator",
            "done": END,
        },
    )

    return graph.compile()
