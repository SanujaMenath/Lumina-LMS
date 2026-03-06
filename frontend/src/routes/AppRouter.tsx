import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useInactivityTimeout } from "../hooks/useInactivityTimeout";
import Login from "../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersPage from "../pages/admin/UsersPage";
import LecturerLayout from "../layouts/LecturerLayout";
import StudentLayout from "../layouts/StudentLayout";
import LecturerDashboard from "../pages/lecturer/LecturerDashboard";
import StudentDashboard from "../pages/student/StudentDashboard";
import RegisterPage from "../pages/admin/RegisterPage";
import ProfilePage from "../pages/profile/ProfilePage";
import CoursesPage from "../pages/admin/CoursesPage";
import AboutPage from "../pages/AboutPage";
import MaterialManagement from "../pages/lecturer/Material_Management";
import StudentCoursesPage from "../pages/student/CoursesPage";
import StudentAssignmentsPage from "../pages/student/AssignmentsPage";
import StudentGradesPage from "../pages/student/GradesPage";
import AssessmentCreation from "../pages/lecturer/AssessmentCreation";
import DepartmentPage from "../pages/admin/DepartmentPage";
import LecturerCoursesPage from "../pages/lecturer/LecturerCoursesPage";
import StudentCourseMaterials from "../pages/student/StudentCourseMaterials";
import StudentAssessmentView from "../pages/student/StudentAssessmentView";
import LecturerGradingView from "../pages/lecturer/LecturerGradingView";
import LecturerAssessmentsPage from "../pages/lecturer/LecturerAssessmentsPage";
import AIToolsPage from "../pages/lecturer/AIToolsPage";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";

const AppRouter = () => {
  useInactivityTimeout();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="create-user" element={<RegisterPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="departments" element={<DepartmentPage />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute role="lecturer">
              <LecturerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LecturerDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="courses" element={<LecturerCoursesPage />} />
          <Route path="materials" element={<MaterialManagement />} />
          <Route path="assessment-creation" element={<AssessmentCreation />} />
          <Route path="assessments" element={<LecturerAssessmentsPage />} />
          <Route path="ai-tools" element={<AIToolsPage />} />
          <Route path="assessments/:assessmentId/grade" element={<LecturerGradingView />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-courses" element={<StudentCoursesPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="courses/:courseId" element={<StudentCourseMaterials />} />
          <Route path="assignments/:assignmentId" element={<StudentAssessmentView />} />
        </Route>

        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
