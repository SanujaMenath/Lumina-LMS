  import { useState, useEffect } from "react";
  import { Trophy, TrendingUp, Award, BookOpen, GraduationCap, Calendar } from "lucide-react";
  import { useAuth } from "../../context/AuthContext";
  import api from "../../services/api";

  export interface CourseGrade {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    score: number;
    letterGrade: string;
    term: string;
    feedback?: string;
  }

  const StudentGradesPage = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState<CourseGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerm, setSelectedTerm] = useState("");
    const [terms, setTerms] = useState<string[]>([]);

    useEffect(() => {
      const fetchGrades = async () => {
        if (!user?.id) return;
        try {
          const res = await api.get<CourseGrade[]>(`/assessments/students/${user.id}/grades`);
          setGrades(res.data);
          
          const uniqueTerms = Array.from(new Set(res.data.map(g => g.term)));
          setTerms(uniqueTerms);
          if (uniqueTerms.length > 0) {
            setSelectedTerm(uniqueTerms[0]);
          }
        } catch (error) {
          console.error("Failed to load grades", error);
        } finally {
          setLoading(false);
        }
      };

      fetchGrades();
    }, [user?.id]);

    const filteredGrades = grades.filter(g => g.term === selectedTerm);

    const calculateTermGPA = () => {
      if (filteredGrades.length === 0) return "0.00";
      const gradePoints: Record<string, number> = { "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "C+": 2.3, "C": 2.0, "D": 1.0, "F": 0.0 };
      let totalPoints = 0;
      let totalCredits = 0;
      filteredGrades.forEach(g => {
        totalPoints += (gradePoints[g.letterGrade] || 0) * g.credits;
        totalCredits += g.credits;
      });
      return (totalPoints / totalCredits).toFixed(2);
    };

    const getGradeColor = (grade: string) => {
      if (grade.includes('A')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if (grade.includes('B')) return 'bg-blue-100 text-blue-700 border-blue-200';
      if (grade.includes('C')) return 'bg-amber-100 text-amber-700 border-amber-200';
      return 'bg-red-100 text-red-700 border-red-200';
    };

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Calculating your academic standing...</p>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shadow-inner">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Academic Records</h1>
              <p className="text-gray-500 font-medium mt-1">Review your grades and overall performance</p>
            </div>
          </div>
          
          {/* Semester Selector */}
          {terms.length > 0 && (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="w-full sm:w-48 bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 shadow-sm appearance-none cursor-pointer"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={100} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Term GPA</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black text-gray-900">{calculateTermGPA()}</h2>
              <p className="text-sm font-bold text-gray-400 mb-1">/ 4.00</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen size={100} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Earned Credits</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black text-gray-900">
                {filteredGrades.reduce((sum, course) => sum + course.credits, 0)}
              </h2>
              <p className="text-sm font-bold text-gray-400 mb-1">credits</p>
            </div>
          </div>

          <div className="bg-emerald-600 rounded-2xl p-6 border border-emerald-500 shadow-md shadow-emerald-200 relative overflow-hidden text-white">
            <div className="absolute -right-4 -top-4 opacity-20">
              <Award size={100} />
            </div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Academic Status</p>
            <div className="flex items-end gap-2 mt-2">
              <h2 className="text-2xl font-bold leading-tight">Good Standing</h2>
            </div>
          </div>
        </div>

        {/* Grades Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Course Breakdown</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedTerm || "All Terms"}</span>
          </div>
          
          <div className="divide-y divide-gray-50">
            {filteredGrades.length > 0 ? (
              filteredGrades.map((course) => (
                <div key={course.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-xl text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md tracking-wider">
                            {course.courseCode}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">{course.credits} Credits</span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900">{course.courseName}</h4>
                        {course.feedback && (
                          <p className="text-sm text-gray-500 mt-2 italic border-l-2 border-emerald-200 pl-2">
                            "{course.feedback}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:pl-4 sm:border-l border-gray-100">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-xl font-black text-gray-900">{course.score}%</p>
                      </div>
                      <div className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 text-xl font-black ${getGradeColor(course.letterGrade)} shadow-sm`}>
                        {course.letterGrade}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                <div className="p-4 bg-gray-50 rounded-full mb-4 text-gray-300">
                  <Award size={48} />
                </div>
                <p className="font-medium">No grades have been finalized for this term yet.</p>
                <p className="text-sm mt-1">Complete your assignments and wait for your lecturer to grade them!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default StudentGradesPage;