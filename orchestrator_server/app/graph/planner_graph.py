from __future__ import annotations

import json
from typing import Any, Dict, List, TypedDict

from langchain_community.chat_models import ChatOllama
from langgraph.graph import END, StateGraph

from ..config import settings
from ..schemas import LecturePlan, LectureSegment


class PlannerState(TypedDict, total=False):
    module_title: str
    audience: str
    duration_minutes: int
    lecture_plan: Dict[str, Any]
    _attempt: int


def _extract_json_from_content(content: str) -> dict[str, Any] | None:
    """
    Try to robustly extract a JSON object from LLM output.

    Handles cases where the model wraps JSON in prose or markdown fences.
    """
    content = content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    if content.startswith("```"):
  
        parts = content.split("```")
        if len(parts) >= 3:
            inner = "```".join(parts[1:-1]).strip()
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


def _build_planner_prompt(
    state: PlannerState,
    previous_plan: dict[str, Any] | None = None,
    feedback: str | None = None,
) -> str:
    """Create a strict JSON-style prompt for Gemma 3."""
    base_instructions = f"""
You are a course planning assistant.

Create a detailed lecture plan for the module "{state['module_title']}".
The audience is "{state['audience']}".
Total duration: {state['duration_minutes']} minutes.

Divide the time into 4–6 logical segments.
For each segment, provide:
- sequence_index (integer, starting at 1)
- title (string)
- description (string)
- duration_minutes (integer)
- learning_objectives (array of 3–5 short bullet points, strings)

Return ONLY valid JSON with this exact schema:
{{
  "module_title": string,
  "audience": string,
  "duration_minutes": integer,
  "segments": [
    {{
      "sequence_index": integer,
      "title": string,
      "description": string,
      "duration_minutes": integer,
      "learning_objectives": [string, ...]
    }},
    ...
  ]
}}
"""

    if previous_plan is not None and feedback:
        return (
            base_instructions
            + "\n\nHere is your previous plan (JSON):\n"
            + json.dumps(previous_plan, ensure_ascii=False)
            + "\n\nFeedback:\n"
            + feedback
            + "\n\nProduce a corrected plan that strictly follows the schema and feedback."
        )

    return base_instructions


def _validate_lecture_plan(
    plan: dict[str, Any], target_duration: int, tolerance: int = 5
) -> tuple[bool, int]:
    """Check if the sum of segment durations matches the target within tolerance."""
    segments: List[dict[str, Any]] = plan.get("segments") or []
    total = 0
    for seg in segments:
        try:
            total += int(seg.get("duration_minutes", 0))
        except (TypeError, ValueError):
            continue
    return abs(total - target_duration) <= tolerance, total


def planner_node(state: PlannerState) -> PlannerState:
    """LangGraph node that calls Gemma 3 and validates the resulting plan."""
    llm = ChatOllama(
        model=settings.planner_model_name,
        base_url=settings.ollama_base_url,
        temperature=0.2,
    )

    target_duration = int(state["duration_minutes"])
    previous_plan: dict[str, Any] | None = None
    feedback: str | None = None

    for attempt in range(3):
        prompt = _build_planner_prompt(
            state, previous_plan=previous_plan, feedback=feedback
        )
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        plan_dict = _extract_json_from_content(content)
        if plan_dict is None:
            # Ask the model again, emphasising JSON-only output
            feedback = "Your previous response was not valid JSON. Return ONLY valid JSON that follows the schema."
            previous_plan = None
            continue

        is_valid, total = _validate_lecture_plan(plan_dict, target_duration)
        if is_valid:
            state["lecture_plan"] = LecturePlan(
                module_title=plan_dict.get("module_title", state["module_title"]),
                audience=plan_dict.get("audience", state["audience"]),
                duration_minutes=target_duration,
                segments=[
                    LectureSegment(
                        sequence_index=int(seg.get("sequence_index", i + 1)),
                        title=str(seg.get("title", f"Segment {i + 1}")),
                        description=str(seg.get("description", "")),
                        duration_minutes=int(seg.get("duration_minutes", 0)),
                        learning_objectives=list(seg.get("learning_objectives") or []),
                    )
                    for i, seg in enumerate(plan_dict.get("segments") or [])
                ],
            ).model_dump()
            state["_attempt"] = attempt + 1
            return state

        # Not valid; prepare another attempt
        previous_plan = plan_dict
        feedback = (
            f"The total of the segment durations is {total} minutes, "
            f"but it must be {target_duration} minutes. "
            "Re-adjust only the duration_minutes fields to match the target while keeping the same structure."
        )

    if previous_plan is not None:
        state["lecture_plan"] = previous_plan
        state["_attempt"] = 3

    return state


def build_planner_graph() -> Any:
    """Create the LangGraph graph for the planner."""
    graph = StateGraph(PlannerState)
    graph.add_node("planner", planner_node)
    graph.set_entry_point("planner")
    graph.add_edge("planner", END)
    return graph.compile()
