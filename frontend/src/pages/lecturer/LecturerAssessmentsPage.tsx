import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardCheck, 
  Search, 
  Clock, 
  Users, 
  ChevronRight, 
  BookOpen,
  PlusSquare,
  FileText,
  ListTodo
} from "lucide-react";
import { fetchLecturerAssessments, type LecturerAssessment } from "./services/assessmentService";
import { toast } from "react-hot-toast";

const LecturerAssessmentsPage = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<LecturerAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchLecturerAssessments();
        setAssessments(data);
      } catch {
        toast.error("Failed to load assessments.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredAssessments = assessments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeDetails = (type: string) => {
    switch (type) {
      case 'mcq': return { icon: <ListTodo size={14} />, label: "MCQ Quiz", color: "text-purple-600 bg-purple-50 border-purple-200" };
      case 'pdf': return { icon: <FileText size={14} />, label: "File Upload", color: "text-blue-600 bg-blue-50 border-blue-200" };
      default: return { icon: <ClipboardCheck size={14} />, label: type, color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Manage Assessments</h1>
            <p className="text-gray-500 font-medium mt-1">View your created tests and grade student submissions.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/lecturer/assessment-creation')}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0"
        >
          <PlusSquare size={20} /> Create New
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search assessments by title or course name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => {
            const typeConfig = getTypeDetails(assessment.assessment_type);
            const isOverdue = new Date(assessment.due_date) < new Date();

            return (
              <div key={assessment.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col group">
                
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${typeConfig.color}`}>
                    {typeConfig.icon} {typeConfig.label}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {assessment.title}
                </h2>
                
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-6">
                  <BookOpen size={16} className="opacity-70" />
                  <span className="truncate">{assessment.courseName}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock size={16} className={isOverdue ? "text-red-400" : "text-gray-400"} /> 
                      Due Date
                    </span>
                    <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(assessment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/lecturer/assessments/${assessment.id}/grade`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-bold rounded-xl transition-all border border-gray-100 hover:border-indigo-200"
                  >
                    <Users size={18} />
                    Grade Submissions
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-gray-50 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No assessments found</h3>
            <p className="text-gray-500 font-medium mt-2 max-w-sm">
              You haven't created any assessments yet, or none match your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerAssessmentsPage;