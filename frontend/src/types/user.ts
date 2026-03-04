export type UserRole = "admin" | "lecturer" | "student";

export interface BaseUserCreate {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserDTO {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  student_id?: string;
}

export interface AdminCreate extends BaseUserCreate {
  role: "admin";
}

export interface LecturerCreate extends BaseUserCreate {
  role: "lecturer";
  department: string;
  specialization: string;
}

export interface StudentCreate extends BaseUserCreate {
  role: "student";
  department: string;
  year: number;
  semester: number;
}

export type CreateUserPayload = AdminCreate | LecturerCreate | StudentCreate;

export type UpdateProfilePayload = {
  full_name: string;
};
