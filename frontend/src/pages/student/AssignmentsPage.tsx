import { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchStudentAssignments,
  type Assignment,
  type AssignmentStatus,
} from "./services/studentAssignmentService";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const StudentAssignmentsPage = () => {
  const { user } = useAuth(); 
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await fetchStudentAssignments(user.id);
        setAssignments(data);
      } catch (error) {
        console.error("Failed to load assignments", error);
        toast.error("Could not load your assignments.");
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [user?.id]);


  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const getStatusDisplay = (status: AssignmentStatus) => {
    switch (status) {
      case "pending":
        return {
          color: "text-amber-600 bg-amber-50 border-amber-200",
          icon: <Clock size={14} />,
          label: "To Do",
        };
      case "submitted":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          icon: <FileText size={14} />,
          label: "Submitted",
        };
      case "graded":
        return {
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          icon: <CheckCircle2 size={14} />,
          label: "Graded",
        };
      case "overdue":
        return {
          color: "text-red-600 bg-red-50 border-red-200",
          icon: <AlertCircle size={14} />,
          label: "Overdue",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">
          Loading assignments...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Assignments
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Track and submit your coursework
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search assignments by title or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 shadow-sm transition-all"
          />
        </div>
        <div className="relative">
          <select
            className="w-full sm:w-48 bg-white border border-gray-100 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 shadow-sm transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">To Do</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="overdue">Overdue</option>
          </select>
          <Filter
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={16}
          />
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment,index) => {
            const statusConfig = getStatusDisplay(assignment.status);

            return (
              <div
                key={assignment.id || `fallback-key-${index}`}
                className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`w-1.5 sm:w-2 shrink-0 ${statusConfig.color.split(" ")[0].replace("text-", "bg-")}`}
                />

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <BookOpen size={14} />
                        {assignment.courseCode}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors mb-1">
                      {assignment.title}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mb-4">
                      {assignment.courseName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Due Date
                      </span>
                      <span
                        className={`text-sm font-semibold ${assignment.status === "overdue" ? "text-red-600" : "text-gray-700"}`}
                      >
                        {new Date(assignment.dueDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>

                    {/* Dynamic Action Area based on status */}
                    {assignment.status === "graded" ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Score
                        </span>
                        <span className="text-lg font-black text-emerald-600">
                          {assignment.score || 0}
                          <span className="text-sm text-gray-400 font-bold">
                            /{assignment.maxScore}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          assignment.status === "pending"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {assignment.status === "pending" ||
                        assignment.status === "overdue"
                          ? "Submit Work"
                          : "View Submission"}
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-5 bg-gray-50 rounded-full">
              <ClipboardList size={48} className="text-gray-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                No assignments found
              </h3>
              <p className="text-gray-500 font-medium mt-1">
                You're all caught up for this filter criteria!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;
