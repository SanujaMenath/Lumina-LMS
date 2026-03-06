import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { lecturerService } from "./services/lecturerDashboardService";
import type { DashboardData } from "./services/lecturerDashboardService";
import { useAuth } from "../../context/AuthContext"; 
import { useNavigate } from "react-router-dom";

const LecturerDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.id) {
          toast.error("Authentication error. Please log in again.");
          setLoading(false);
          return;
        }

        const dashboardData = await lecturerService.getDashboardData(user.id);
        setData(dashboardData);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]); 

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-gray-500">Loading dashboard...</div>;
  }

  const stats = data?.stats || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lecturer Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.full_name || "Lecturer"}! Manage your courses and assessments.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-white p-6 rounded-xl shadow border border-gray-100 transition-all hover:shadow-md"
          >
            <p className="text-gray-500 text-sm font-medium">{item.label}</p>
            <p className="text-3xl font-bold mt-2 text-indigo-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
          onClick={() => navigate("/lecturer/assessment-creation")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
            Create Assessment
          </button>
          <button 
          onClick={() => navigate("/lecturer/materials")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors">
            Upload Material
          </button>
          <button 
          onClick={() => navigate("/lecturer/assessments")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors">
            View Submissions
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {recentActivities.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm text-gray-700 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <span className="font-medium">{a.title}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{a.course}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;