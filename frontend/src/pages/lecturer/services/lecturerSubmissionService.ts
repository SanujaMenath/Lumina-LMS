import api from "../../../services/api";


export interface StudentSubmission {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name?: string; 
  student_identifier?: string;
  status: 'submitted' | 'graded';
  score?: number;
  file_url?: string;
  submitted_at: string;
}


export const fetchAssessmentSubmissions = async (assessmentId: string): Promise<StudentSubmission[]> => {
  const res = await api.get<StudentSubmission[]>(`/assessments/${assessmentId}/submissions`);
  return res.data;
};

// Grade submission
export const gradeSubmissionService = async (submissionId: string, score: number) => {
  const res = await api.put(`/assessments/submissions/${submissionId}/grade`, { score });
  return res.data;
};