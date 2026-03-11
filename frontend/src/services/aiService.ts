import axios from "axios";

const BASE_URL = import.meta.env.VITE_ORCHESTRATOR_URL || "http://127.0.0.1:8001";
const AI_API = `${BASE_URL}/api/v1`;

export interface AIQuestion {
  id: string;
  stem: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
}

export interface LecturePlanSegment {
  sequence_index: number;
  title: string;
  description: string;
  duration_minutes: number;
  learning_objectives: string[];
}

export interface LecturePlan {
  module_title: string;
  audience: string;
  duration_minutes: number;
  segments: LecturePlanSegment[];
}

export const generateAIAssessment = async (pdfFile: File, numQuestions: number = 5): Promise<AIQuestion[]> => {
  const formData = new FormData();
  formData.append("file", pdfFile);


  const uploadRes = await axios.post(`${AI_API}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const assessmentRes = await axios.post(`${AI_API}/assessments`, {
    document_set_id: uploadRes.data.document_set_id,
    num_questions: numQuestions
  });
  
  return assessmentRes.data.questions;
};


export const generateAILecturePlan = async (module_title: string, audience: string, duration_minutes: number): Promise<LecturePlan> => {
  const res = await axios.post(`${AI_API}/plan`, {
    module_title,
    audience,
    duration_minutes
  });
  
  return res.data.lecture_plan;
};