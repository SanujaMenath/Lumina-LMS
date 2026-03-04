import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import {
  fetchAssessmentSubmissions,
  gradeSubmissionService,
  type StudentSubmission,
} from "./services/lecturerSubmissionService";
import { toast } from "react-hot-toast";

const LecturerGradingView: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const loadData = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        const data = await fetchAssessmentSubmissions(assessmentId);
        setSubmissions(data);
      } catch {
        toast.error("Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [assessmentId]);

  const handleGradeSubmit = async (submissionId: string) => {
    const score = gradingScores[submissionId];
    if (score === undefined || score < 0) {
      toast.error("Please enter a valid score.");
      return;
    }

    try {
      await gradeSubmissionService(submissionId, score);
      toast.success("Grade saved!");
      // Update local state to reflect 'graded' status
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId
            ? { ...sub, status: "graded", score: score }
            : sub,
        ),
      );
    } catch {
      toast.error("Failed to save grade.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-bold">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8 animate-in fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft size={16} /> Back to Assessments
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Users size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Student Submissions
          </h1>
          <p className="text-gray-500 font-medium">
            Review and grade uploaded assignments.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-6">Student ID</th>
              <th className="p-6">Submitted At</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-center">Submission</th>
              <th className="p-6 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500 font-medium"
                >
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-6">
                    <p className="font-bold text-gray-900">
                      {sub.student_name || "Unknown Student"}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase tracking-wider">
                      {sub.student_identifier || sub.student_id.slice(-6)}
                    </p>
                  </td>
                  <td className="p-6 text-sm text-gray-500 font-medium">
                    {new Date(sub.submitted_at).toLocaleString()}
                  </td>
                  <td className="p-6">
                    {sub.status === "graded" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={14} /> Graded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={14} /> Needs Grading
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    {sub.file_url ? (
                      <a
                        href={`http://127.0.0.1:8000${sub.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        <FileText size={16} /> View PDF
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">
                        Auto-Graded MCQ
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder={sub.score?.toString() || "-"}
                        value={
                          gradingScores[sub.id] !== undefined
                            ? gradingScores[sub.id]
                            : sub.score !== undefined
                              ? sub.score
                              : ""
                        }
                        onChange={(e) =>
                          setGradingScores({
                            ...gradingScores,
                            [sub.id]: parseInt(e.target.value),
                          })
                        }
                        disabled={!sub.file_url && sub.status === "graded"} // Disable if auto-graded MCQ
                      />
                      {sub.file_url && (
                        <button
                          onClick={() => handleGradeSubmit(sub.id)}
                          className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          title="Save Grade"
                        >
                          <Save size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LecturerGradingView;
