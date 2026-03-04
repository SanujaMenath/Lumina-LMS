import React, { useState, useEffect } from "react";
import InputValue from "../../components/ui/InputValue";
import Button from "../../components/ui/Button";
import { createUserService } from "./services/userService";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import type { CreateUserPayload, UserRole } from "../../types/user";
import { toast } from "react-hot-toast";

interface Department {
  _id?: string;
  id?: string;
  name: string;
}

const RegisterPage: React.FC = () => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<UserRole>("admin");

  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get<{ data?: Department[] } | Department[]>("/departments");
        const data = Array.isArray(res.data) ? res.data : (res.data && !Array.isArray(res.data) ? res.data.data : []) || [];
        setDepartments(data);
      } catch (error) {
        console.error("Failed to load departments", error);
        toast.error("Failed to load department list.");
      }
    };
    fetchDepartments();
  }, []);

  if (!user || user.role !== "admin") {
    return <p className="text-center mt-20 font-bold text-red-500">Access denied</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error("Required fields missing");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Weak password. Use at least 6 characters, including uppercase, lowercase, and a number.");
      return;
    }

    if (role === "admin" && password !== confirm) {
      toast.error("Password confirmation mismatch");
      return;
    }

    let payload: CreateUserPayload;

    if (role === "lecturer") {
      payload = {
        full_name: fullName,
        email,
        password,
        role,
        department,
        specialization,
      };
    } else if (role === "student") {
      payload = {
        full_name: fullName,
        email,
        password,
        role,
        department,
        year: Number(year),
        semester: Number(semester),
      };
    } else {
      payload = {
        full_name: fullName,
        email,
        password,
        role: "admin",
      };
    }

    setLoading(true);
    try {
      await createUserService(payload);
      toast.success("User created successfully");

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setDepartment("");
      setSpecialization("");
      setYear("");
      setSemester("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Creation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white px-8 py-10 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Create User
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputValue
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <InputValue
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputValue
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {role === "admin" && (
            <InputValue
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          <div>
            <label className="font-medium text-sm text-gray-700 ml-1">Role</label>
            <select
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="admin">Admin</option>
              <option value="lecturer">Lecturer</option>
              <option value="student">Student</option>
            </select>
          </div>

          {role === "lecturer" && (
            <>
              <div>
                <label className="font-medium text-sm text-gray-700 ml-1">Department</label>
                <select
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <InputValue
                label="Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </>
          )}

          {role === "student" && (
            <>
              <div>
                <label className="font-medium text-sm text-gray-700 ml-1">Department</label>
                <select
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <InputValue
                label="Year"
                type="number"
                min={1}
                max={6}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />

              <InputValue
                label="Semester"
                type="number"
                min={1}
                max={12}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </>
          )}

          <Button type="submit" loading={loading} className="w-full mt-4 py-3">
            Register {role.charAt(0).toUpperCase() + role.slice(1)}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;