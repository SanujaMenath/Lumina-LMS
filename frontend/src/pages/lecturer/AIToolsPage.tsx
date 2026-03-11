import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  ListChecks,
  UploadCloud,
  Loader2,
  BookOpen,
  Clock,
  Target,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle,
} from "lucide-react";
import {
  generateAIAssessment,
  generateAILecturePlan,
  type AIQuestion,
  type LecturePlan,
} from "../../services/aiService";
import { toast } from "react-hot-toast";
import InputValue from "../../components/ui/InputValue";
import Button from "../../components/ui/Button";
import axios from "axios";

const AIToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"planner" | "assessment">(
    "planner",
  );
  const [loading, setLoading] = useState(false);

  // Lecture Planner
  const [moduleTitle, setModuleTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("60");
  const [generatedPlan, setGeneratedPlan] = useState<LecturePlan | null>(null);

  // Assessment Generator + Editor
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState("5");
  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[]>(
    [],
  );
  const [editedQuestions, setEditedQuestions] = useState<AIQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);


  const [assessmentTitle, setAssessmentTitle] = useState("AI-Generated Quiz");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    setEditedQuestions(generatedQuestions);
  }, [generatedQuestions]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle || !audience)
      return toast.error("Please fill in all fields.");

    setLoading(true);
    try {
      const plan = await generateAILecturePlan(
        moduleTitle,
        audience,
        parseInt(duration),
      );
      setGeneratedPlan(plan);
      toast.success("Lecture plan generated successfully!");
    } catch {
      toast.error("Failed to generate plan. Ensure AI server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload a PDF first.");

    setLoading(true);
    try {
      const questions = await generateAIAssessment(
        file,
        parseInt(numQuestions),
      );
      setGeneratedQuestions(questions);
      setEditedQuestions(questions);
      toast.success("Assessment generated successfully!");
    } catch {
      toast.error(
        "Failed to generate assessment. Ensure AI server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = <K extends keyof AIQuestion>(
    index: number,
    field: K,
    value: AIQuestion[K],
  ) => {
    const updated = [...editedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedQuestions(updated);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string,
  ) => {
    const updated = [...editedQuestions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setEditedQuestions(updated);
  };

  const handleRegenerateQuestion = async (index: number) => {
    if (!editedQuestions[index]) return;

    const q = editedQuestions[index];
    try {
      const response = await axios.post(
        "http://localhost:8001/api/v1/single-question",
        {
          topic: q.stem.split(" ").slice(0, 8).join(" "), 
          document_set_id: "temp-set-id", 
          feedback: "Regenerate to improve accuracy or avoid hallucination",
        },
      );

      const newQ = response.data;
      if (newQ && newQ.stem) {
        const updated = [...editedQuestions];
        updated[index] = newQ;
        setEditedQuestions(updated);
        toast.success("Question regenerated!");
      }
    } catch (err) {
      toast.error("Failed to regenerate question.");
      console.error(err);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    if (!confirm("Delete this question?")) return;
    const updated = editedQuestions.filter((_, i) => i !== index);
    setEditedQuestions(updated);
    if (editingQuestionIndex === index) setEditingQuestionIndex(null);
    toast.success("Question removed");
  };

  const handleSaveAssessment = async (status: "draft" | "published") => {
    if (editedQuestions.length === 0) {
      return toast.error("No questions to save.");
    }
    if (!assessmentTitle.trim()) {
      return toast.error("Please enter a title.");
    }
    if (!selectedCourseId) {
      return toast.error("Please select a course.");
    }

    try {
      const payload = {
        title: assessmentTitle.trim(),
        course_id: selectedCourseId,
        assessment_type: "mcq",
        due_date:
          dueDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        content: editedQuestions,
        status,
        total_marks: editedQuestions.length * 2,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post("http://localhost:8000/assessments", payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success(`Assessment saved as ${status}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save assessment.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 bg-linear-to-r from-indigo-900 to-indigo-800 p-8 rounded-3xl text-white shadow-lg">
        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
          <Sparkles size={36} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Lumina AI Studio
          </h1>
          <p className="text-indigo-200 font-medium mt-1">
            Powered by Gemma 3. Automate your lecture planning and quiz
            generation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 max-w-md">
        <button
          onClick={() => setActiveTab("planner")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === "planner"
              ? "bg-indigo-50 text-indigo-700 shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <BookOpen size={18} /> Lecture Planner
        </button>
        <button
          onClick={() => setActiveTab("assessment")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === "assessment"
              ? "bg-indigo-50 text-indigo-700 shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <ListChecks size={18} /> Quiz Generator
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {activeTab === "planner"
              ? "Plan Configuration"
              : "Create Assessment"}
          </h2>

          {activeTab === "planner" ? (
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <InputValue
                label="Module Title"
                placeholder="e.g. Intro to Data Structures"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
              />
              <InputValue
                label="Target Audience"
                placeholder="e.g. 2nd Year Undergraduates"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <InputValue
                label="Duration (minutes)"
                type="number"
                min="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Plan
              </Button>
            </form>
          ) : (
            <form onSubmit={handleGenerateAssessment} className="space-y-5">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-gray-50">
                <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700 mb-1">
                  Upload Lecture Notes
                </p>
                <p className="text-xs text-gray-500 mb-4">PDF format only</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full"
                />
              </div>

              <InputValue
                label="Number of Questions"
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
              />

              <InputValue
                label="Assessment Title"
                placeholder="e.g. Week 5 Quiz - Data Structures"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
              />

              <InputValue
                label="Course ID"
                placeholder="e.g. CS202"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              />

              <InputValue
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
              >
                Generate MCQs
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Output / Editor */}
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[500px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-indigo-600">
              <Loader2 size={48} className="animate-spin" />
              <p className="text-gray-500 font-bold animate-pulse">
                {activeTab === "planner"
                  ? "Drafting lecture plan..."
                  : "Reading PDF and formulating questions..."}
              </p>
            </div>
          ) : activeTab === "planner" && generatedPlan ? (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-gray-900">
                  {generatedPlan.module_title}
                </h3>
                <p className="text-gray-500 font-medium">
                  Audience: {generatedPlan.audience} • Total Time:{" "}
                  {generatedPlan.duration_minutes}m
                </p>
              </div>
              <div className="space-y-4">
                {generatedPlan.segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-indigo-900 text-lg">
                        {seg.title}
                      </h4>
                      <span className="flex items-center gap-1 text-xs font-bold bg-white px-2 py-1 rounded-md text-indigo-600 border border-indigo-100">
                        <Clock size={12} /> {seg.duration_minutes}m
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {seg.description}
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                        <Target size={12} /> Objectives
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {seg.learning_objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "assessment" && editedQuestions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-gray-900">
                  Review & Edit Assessment
                </h3>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                  {editedQuestions.length} Questions
                </span>
              </div>

              {/* Questions list */}
              <div className="space-y-6">
                {editedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl p-6 border ${
                      editingQuestionIndex === idx
                        ? "border-indigo-400 shadow-md"
                        : "border-gray-100 shadow-sm"
                    } relative overflow-hidden transition-all`}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                    {editingQuestionIndex === idx ? (
                      <div className="space-y-4">
                        <textarea
                          value={q.stem}
                          onChange={(e) =>
                            handleEditQuestion(idx, "stem", e.target.value)
                          }
                          className="w-full p-3 border rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          rows={2}
                        />

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <input
                              key={optIdx}
                              value={opt}
                              onChange={(e) =>
                                handleOptionChange(idx, optIdx, e.target.value)
                              }
                              className={`w-full p-3 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                optIdx === q.correct_option_index
                                  ? "bg-emerald-50 border-emerald-300"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">
                            Correct answer:
                          </label>
                          <select
                            value={q.correct_option_index}
                            onChange={(e) =>
                              handleEditQuestion(
                                idx,
                                "correct_option_index",
                                parseInt(e.target.value),
                              )
                            }
                            className="border rounded px-3 py-1.5 text-sm"
                          >
                            {q.options.map((_, i) => (
                              <option key={i} value={i}>
                                {String.fromCharCode(65 + i)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          value={q.explanation || ""}
                          onChange={(e) =>
                            handleEditQuestion(
                              idx,
                              "explanation",
                              e.target.value,
                            )
                          }
                          placeholder="Explanation (optional)"
                          className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          rows={3}
                        />

                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={() => setEditingQuestionIndex(null)}
                            className="bg-green-600 hover:bg-green-700 text-sm"
                          >
                            <Save size={16} className="mr-1" /> Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-900 flex gap-2">
                            <span className="text-indigo-600">{idx + 1}.</span>{" "}
                            {q.stem}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingQuestionIndex(idx)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit question"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleRegenerateQuestion(idx)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Regenerate question"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete question"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border text-sm font-medium ${
                                i === q.correct_option_index
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-gray-50 border-gray-100 text-gray-600"
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                              Explanation
                            </p>
                            <p className="text-sm text-indigo-900/80">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Global actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                <Button
                  onClick={() => handleSaveAssessment("draft")}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                  disabled={editedQuestions.length === 0}
                >
                  <Save size={18} className="mr-2" /> Save as Draft
                </Button>
                <Button
                  onClick={() => handleSaveAssessment("published")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={editedQuestions.length === 0}
                >
                  <CheckCircle size={18} className="mr-2" /> Publish to Students
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                {activeTab === "planner" ? (
                  <FileText size={48} />
                ) : (
                  <ListChecks size={48} />
                )}
              </div>
              <p className="text-gray-500 font-medium">
                Configure parameters on the left to generate content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIToolsPage;
