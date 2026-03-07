import React, { useState, useEffect } from "react";
import { fetchLecturerCourses, type LecturerCourse } from "./services/lecturerCourseService";
import { 
  BookOpen, 
  Search, 
  Users, 
  Settings, 
  Loader2, 
  GraduationCap, 
  Clock 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const LecturerCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<LecturerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const data = await fetchLecturerCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load assigned courses", error);
        toast.error("Failed to load your assigned courses.");
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading your assigned courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              My Assigned Modules
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage your classes, lecture materials, and students.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by module name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course.course_id || course.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group flex flex-col overflow-hidden">
              
              {/* Card Header styling */}
              <div className="h-2 w-full bg-linear-to-r from-blue-400 to-indigo-500" />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-md tracking-wider">
                    {course.course_code}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                    <Clock size={12} /> Sem {course.semester}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                  {course.course_name}
                </h2>
                
                <p className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-gray-400" />
                  {course.department}
                </p>

                {/* Bottom Stats & Actions */}
                <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-xs">
                        <Users size={14} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {course.enrolled_students || 0} <span className="font-medium text-gray-500">Enrolled</span>
                    </span>
                  </div>
                  
                  <button 
                  onClick={()=>navigate(`/lecturer/materials`)}
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors active:scale-95">
                    <Settings size={14} />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No modules assigned</h3>
            <p className="text-gray-500 font-medium mt-1">
              You haven't been assigned to teach any courses yet. Contact the administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerCoursesPage;