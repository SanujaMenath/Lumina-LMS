import api from "../../../services/api";
import { fetchLecturerCourses } from "./lecturerCourseService";

export interface LecturerAssessment {
  id: string;
  title: string;
  course_id: string;
  courseName: string;
  assessment_type: string;
  due_date: string;
  created_at: string;
  total_marks: number;
}

interface BackendAssessmentResponse {
  _id?: string; 
  id?: string;
  title: string;
  course_id: string;
  assessment_type: string;
  due_date: string;
  created_at: string;
  total_marks: number;
  content?: string;
  file_url?: string;
}


export const createAssessmentService = async (formData: FormData, lecturerId: string) => {
  const res = await api.post(`/assessments/?lecturer_id=${lecturerId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};


export const fetchLecturerAssessments = async (): Promise<LecturerAssessment[]> => {
  const courses = await fetchLecturerCourses();
  
  const promises = courses.map(async (course) => {
    try {
      const courseId = course.course_id || course.id;
      const res = await api.get<BackendAssessmentResponse[]>(`/assessments/?course_id=${courseId}`);
      
      return res.data.map((a: BackendAssessmentResponse) => ({
        ...a,
        id: a.id || a._id || "",
        courseName: course.course_name
      }));
    } catch (error) {
      console.error(`Failed to fetch assessments for course ${course.course_name}`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allAssessments = results.flat();
  
  return allAssessments.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};