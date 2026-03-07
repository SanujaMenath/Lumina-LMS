import { useState } from "react";
import {
  Brain,
  Clock,
  Activity,
  BookOpen,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { predictExamScore } from "./services/predictExamService";
import type { PredictionData } from "./services/predictExamService";
import { toast } from "react-hot-toast";
import InputValue from "../../components/ui/InputValue";

const EXAM_OPTIONS = [
  "OOP",
  "Database Systems",
  "SAD",
  "MIS",
  "Computer Networks",
  "DSA",
  "Foundation of web technologies",
  "Data science",
  "Fundamentals of programming",
  "Computer Organization",
];

const STRESS_LEVELS = [
  { label: "Low", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "High", value: 3 },
];

const PredictExamScore = () => {
  const [formData, setFormData] = useState<PredictionData>({
    exam_name: EXAM_OPTIONS[0],
    study_hours_per_day: 0,
    extracurricular_hours_per_day: 0,
    sleep_hours_per_day: 8,
    social_hours_per_day: 0,
    physical_activity_hours_per_day: 0,
    gpa: 2.0,
    stress_level: 1,
  });

  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    const numericFields = [
      "study_hours_per_day",
      "extracurricular_hours_per_day",
      "sleep_hours_per_day",
      "social_hours_per_day",
      "physical_activity_hours_per_day",
      "gpa",
      "stress_level",
    ];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handlePredict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await predictExamScore(formData);

      const score = res.predicted_score || res.prediction || res.score;

      setPredictedScore(score);

      toast.success("Prediction generated successfully");
    } catch (error) {
      console.error(error);

      toast.error("Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
      {/* Header */}

      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shadow-inner">
          <Brain size={28} />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            AI Score Predictor
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Forecast your exam performance using your study habits
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
           <form onSubmit={handlePredict} className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BookOpen size={18} />
                Academic Profile
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Exam Module
                  </label>
                  <select
                    name="exam_name"
                    value={formData.exam_name}
                    onChange={handleChange}
                    className="w-full mt-1 border border-gray-200 rounded-xl p-2.5"
                  >
                    {EXAM_OPTIONS.map((exam) => (
                      <option key={exam}>{exam}</option>
                    ))}
                  </select>
                </div>

                <InputValue
                  label="GPA"
                  type="number"
                  step="0.01"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Daily Routine */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Clock size={18} />
                Daily Routine
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <InputValue
                  label="Study hours"
                  type="number"
                  name="study_hours_per_day"
                  value={formData.study_hours_per_day}
                  onChange={handleChange}
                />
                <InputValue
                  label="Sleep hours"
                  type="number"
                  name="sleep_hours_per_day"
                  value={formData.sleep_hours_per_day}
                  onChange={handleChange}
                />
                <InputValue
                  label="Extracurricular hours"
                  type="number"
                  name="extracurricular_hours_per_day"
                  value={formData.extracurricular_hours_per_day}
                  onChange={handleChange}
                />
                <InputValue
                  label="Social hours"
                  type="number"
                  name="social_hours_per_day"
                  value={formData.social_hours_per_day}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Wellbeing */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Activity size={18} />
                Wellbeing
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <InputValue
                  label="Physical activity hours"
                  type="number"
                  name="physical_activity_hours_per_day"
                  value={formData.physical_activity_hours_per_day}
                  onChange={handleChange}
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1">
                    Stress level
                  </label>
                  <select
                    name="stress_level"
                    value={formData.stress_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-gray-400"
                  >
                    {STRESS_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Predicting...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Predict Score
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULT CARD */}
        <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-md flex flex-col items-center justify-center">
          {predictedScore !== null ? (
            <>
              <TrendingUp size={40} />

              <p className="text-sm mt-4 opacity-80">Predicted Exam Score</p>

              <h2 className="text-5xl font-black mt-2">
                {predictedScore.toFixed(1)}%
              </h2>
            </>
          ) : (
            <p className="text-center opacity-80">
              Enter your study routine and generate your predicted exam score
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictExamScore;
