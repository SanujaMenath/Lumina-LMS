import api from "../../../services/api";

export type EnrolledCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  lecturerName: string;
  progress: number;
  lastAccessed: string;
}

type CourseResponse = {
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester: string;
  progress?: number;
  lecturer_name?: string;
  last_accessed?: string;
}


export const fetchEnrolledCourses = async (studentId: string): Promise<EnrolledCourse[]> => {
    const res = await api.get<CourseResponse[]>(`courses/${studentId}/courses`);
    
    return res.data.map((c) => ({
      id: c.course_id,
      code: c.course_code,
      name: c.course_name,
      credits: c.credits,
      semester: String(c.semester),
      lecturerName: c.lecturer_name || "TBA",
      progress: c.progress || 0, 
      lastAccessed: c.last_accessed || "Never",
    }));
};