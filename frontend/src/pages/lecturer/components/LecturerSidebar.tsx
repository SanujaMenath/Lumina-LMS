import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  PlusSquare,
  ClipboardCheck,
  Users2,
  UserCircle,
  Sparkles,
  LogOut,
  Command
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const links = [
  { label: "Dashboard", to: "/lecturer", icon: <LayoutDashboard size={20} /> },
  { label: "My Courses", to: "/lecturer/courses", icon: <BookOpen size={20} /> },
  { label: "Material Management", to: "/lecturer/materials", icon: <FileText size={20} /> },
  { label: "Assessment Creation", to: "/lecturer/assessment-creation", icon: <PlusSquare size={20} /> },
  { label: "Submissions & Grading", to: "/lecturer/assessments", icon: <ClipboardCheck size={20} /> },
  { label: "Attendance", to: "/lecturer/attendance", icon: <Users2 size={20} /> },
  { label: "Profile Management", to: "/lecturer/profile", icon: <UserCircle size={20} /> },
  { label: "AI Tools", to: "/lecturer/ai-tools", icon: <Sparkles size={20} className="text-amber-500" /> },
];

const LecturerSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col shadow-sm">
      {/* Brand Header */}
      <div className="p-6 h-20 flex items-center gap-3 border-b border-gray-50">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Command size={22} />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">LMS</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Lecturer Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Instructor Menu</p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <span className="transition-colors group-hover:scale-110 duration-200">
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-1 px-4 border-t border-gray-50">
        <div className="bg-gray-50/50 rounded-2xl p-2 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {user?.full_name?.charAt(0) || "L"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.full_name || "Lecturer Name"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || "faculty@lms-ai.com"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 group shadow-sm"
          >
            <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LecturerSidebar;