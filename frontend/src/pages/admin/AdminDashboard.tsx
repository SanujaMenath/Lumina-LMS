// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  UserPlus,
  PlusCircle,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAdminDashboardData, type DashboardStats, type RecentUser } from "./services/dashboardService";

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min ago";
  return "Just now";
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  const [counts, setCounts] = useState<DashboardStats>({ students: 0, lecturers: 0, courses: 0, departments: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const data = await getAdminDashboardData();
        
        setCounts(data.stats);
        setRecentUsers(data.recentUsers);

        const now = new Date();
        setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + now.toLocaleDateString());

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { label: "Total Students", value: counts.students, icon: <Users size={24} />, color: "bg-blue-50 text-blue-600", trend: "Active learners" },
    { label: "Lecturers", value: counts.lecturers, icon: <GraduationCap size={24} />, color: "bg-purple-50 text-purple-600", trend: "Faculty members" },
    { label: "Courses", value: counts.courses, icon: <BookOpen size={24} />, color: "bg-emerald-50 text-emerald-600", trend: "Academic modules" },
    { label: "Departments", value: counts.departments, icon: <Building2 size={24} />, color: "bg-orange-50 text-orange-600", trend: "Active units" },
  ];

  const quickActions = [
    { label: "Add User", icon: <UserPlus size={20} />, onClick: () => navigate("/admin/create-user"), description: "Register new students or staff" },
    { label: "Manage Courses", icon: <PlusCircle size={20} />, onClick: () => navigate("/admin/courses"), description: "Create new learning modules" },
    { label: "Manage Departments", icon: <Building2 size={20} />, onClick: () => navigate("/admin/departments"), description: "Configure academic units" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Gathering system metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 font-medium">
            Welcome back! Here's what's happening in your system today.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-gray-500 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100">
          <Clock size={16} className="text-primary" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${item.color} transition-transform group-hover:scale-110 duration-300`}>
                {item.icon}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <TrendingUp size={12} />
                {item.trend}
              </div>
            </div>
            <p className="text-gray-500 text-sm font-bold">{item.label}</p>
            <p className="text-3xl font-black mt-1 text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Users - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recently Registered Users</h2>
              <button onClick={() => navigate("/admin/users")} className="text-sm font-bold text-primary hover:text-primary/80 transition flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg">
                View All <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentUsers.map((user, i) => (
                    <tr key={user._id || user.id || i} className="hover:bg-gray-50/50 transition duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-500 shadow-sm">
                            {user.full_name ? user.full_name.charAt(0) : "?"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.full_name || "Unknown User"}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-bold">
                        {user.created_at ? timeAgo(user.created_at) : "Unknown"}
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">
                        No recent users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md transition-all text-left group"
                >
                  <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {action.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <TrendingUp size={18} /> System Insight
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                Your platform currently manages {counts.students} students across {counts.courses} active courses. System performance is optimal.
              </p>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform hover:rotate-0 duration-500">
              <GraduationCap size={140} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;