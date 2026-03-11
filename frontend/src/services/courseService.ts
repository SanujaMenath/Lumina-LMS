import api from "./api";

export type Course = {
  id: string;
  name: string;
  code: string;
  isEnrolled?: boolean;
  lecturerId?: string; 
};

export type Lecturer = {
  id: string;
  name: string;
};

export type CreateCoursePayload = {
  name: string;
  code: string;
};

type CourseApi = {
  id: string;
  course_name: string;
  course_code: string;
  is_enrolled?: boolean;
  lecturer_id?: string;
};

export const getCourses = async (): Promise<Course[]> => {
  const res = await api.get<CourseApi[]>("/courses/me");
  return res.data.map((c) => ({
    id: c.id,
    name: c.course_name,
    code: c.course_code,
    isEnrolled: c.is_enrolled,
    lecturerId: c.lecturer_id,
  }));
};


export const createCourse = (payload: CreateCoursePayload) =>
  api.post("/courses", {
    course_name: payload.name,
    course_code: payload.code,
  });


export const updateCourse = (id: string, payload: CreateCoursePayload) =>
  api.put(`/courses/${id}`, {
    course_name: payload.name,
    course_code: payload.code,
  });


export const deleteCourse = (id: string) => api.delete(`/courses/${id}`);


export const enrollCourse = (courseId: string) =>
  api.post(`/courses/${courseId}/enroll`);


export const assignLecturer = (courseId: string, lecturerId: string) =>
  api.post(`/courses/${courseId}/assign-lecturer`, { lecturer_id: lecturerId });


export const getLecturers = async (): Promise<Lecturer[]> => {
  const res = await api.get("/lecturers");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return res.data.map((l: any) => ({ id: l.id, name: l.name }));
};


