import api from "../../../services/api";

export interface PredictionData {
  exam_name: string;
  study_hours_per_day: number;
  extracurricular_hours_per_day: number;
  sleep_hours_per_day: number;
  social_hours_per_day: number;
  physical_activity_hours_per_day: number;
  gpa: number;
  stress_level: number;
}

export const predictExamScore = async (data: PredictionData) => {
  const res = await api.post("/predict-exam-score/predict", data);
  return res.data;
};