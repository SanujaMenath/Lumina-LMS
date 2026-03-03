import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchEnrolledCourses, type EnrolledCourse } from "./services/CourseService";
import { 
  Loader2, 
  BookOpen, 
  Target, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  PlayCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const coursesData = await fetchEnrolledCourses(user.id);
        setCourses(coursesData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Could not load your dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // --- Dynamic Statistics Calculations ---
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const activeCourses = totalCourses - completedCourses;
  
  // Avoid division by zero
  const averageProgress = totalCourses > 0 
    ? Math.round(courses.reduce((acc, course) => acc + (course.progress || 0), 0) / totalCourses)
    : 0;

  const stats = [
    { 
      label: "Enrolled Courses", 
      value: totalCourses, 
      icon: <BookOpen size={24} />, 
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      label: "Active Modules", 
      value: activeCourses, 
      icon: <Target size={24} />, 
      color: "bg-orange-50 text-orange-600" 
    },
    { 
      label: "Completed", 
      value: completedCourses, 
      icon: <Award size={24} />, 
      color: "bg-emerald-50 text-emerald-600" 
    },
    { 
      label: "Avg. Progress", 
      value: `${averageProgress}%`, 
      icon: <TrendingUp size={24} />, 
      color: "bg-purple-50 text-purple-600" 
    },
  ];


  const actionableTasks = courses
    .filter(c => c.progress < 100)
    .slice(0, 4) 
    .map(c => ({
      title: "Continue Module",
      course: c.name,
      courseCode: c.code,
      progress: c.progress,
      due: "Ongoing",
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Syncing your learning profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome back, {user?.full_name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Here is your current academic progress and upcoming tasks.
          </p>
        </div>
        <button 
          onClick={() => navigate("/student/my-courses")}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          View All Courses <ArrowRight size={18} />
        </button>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${item.color} transition-transform group-hover:scale-110 duration-300`}>
                {item.icon}
              </div>
            </div>
            <p className="text-gray-500 text-sm font-bold">{item.label}</p>
            <p className="text-3xl font-black mt-1 text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Actionable Tasks Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Task Type</th>
                  <th className="px-6 py-4">Course Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actionableTasks.length > 0 ? (
                  actionableTasks.map((task, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          <PlayCircle size={16} className="text-primary" />
                          {task.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{task.courseCode}</p>
                        <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{task.course}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[100px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${task.progress}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-500">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg">
                          Resume
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                      {totalCourses === 0 
                        ? "You are not enrolled in any courses yet." 
                        : "You have completed all active modules! 🎉"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Learning Insight Side Panel */}
        <div className="bg-linear-to-br from-primary to-primary/90 p-8 rounded-2xl text-white shadow-xl shadow-primary/20 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Learning Insight</h2>
              <p className="text-primary-50 text-sm leading-relaxed font-medium">
                Consistent study habits lead to higher retention. You are currently enrolled in {totalCourses} modules. Dedicate just 45 minutes a day to your lowest progress course to maintain a steady average.
              </p>
            </div>
          </div>
          {/* Abstract decoration */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Target size={180} />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default StudentDashboard;