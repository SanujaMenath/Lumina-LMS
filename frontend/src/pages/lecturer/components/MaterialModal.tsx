import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { type MaterialDTO } from "../services/materialService";

export interface CourseOption {
  id: string;
  name: string;
}

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MaterialDTO | null; // Indicates "Edit" mode if present
  onSave: (data: FormData | Partial<MaterialDTO>) => Promise<void>;
  courses: CourseOption[];
}

const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  courses,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    course_id: "",
    material_type: "PDF",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync form state when initialData changes (Opening in Edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        course_id: initialData.course_id || "",
        material_type: initialData.material_type || "PDF",
        description: initialData.description || "",
      });
      setSelectedFile(null); 
    } else {
      setFormData({ title: "", course_id: "", material_type: "PDF", description: "" });
      setSelectedFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if a file is missing in create mode
    if (!initialData && !selectedFile) {
      alert("Please select a file to upload!");
      return;
    }

    setIsSaving(true);

    try {
      if (initialData) {
        // Edit Mode: Just send updated metadata
        await onSave({ ...formData, id: initialData.id || initialData._id });
      } else {
        // Create Mode: Send FormData to handle file
        const formDataObj = new FormData();
        formDataObj.append("title", formData.title);
        formDataObj.append("course_id", formData.course_id);
        formDataObj.append("material_type", formData.material_type);
        if (formData.description) formDataObj.append("description", formData.description);
        formDataObj.append("file", selectedFile!);

        await onSave(formDataObj);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? "Edit Material" : "Upload Material"}
            </h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">
              {initialData ? "Update resource details" : "Add new resource to course"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Material Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Week 1: Introduction to Calculus"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">Course</label>
              <select
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              >
                <option value="" disabled>Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">Material Type</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none"
                value={formData.material_type}
                onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
              >
                <option value="PDF">PDF Document</option>
                <option value="Video">Video Lecture</option>
                <option value="Slides">Presentation Slides</option>
                <option value="Archive">ZIP/Code File</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Description (Optional)</label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Only show file upload in create mode */}
          {!initialData && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    if (!formData.title) setFormData((prev) => ({ ...prev, title: file.name }));
                  }
                }}
                className="hidden"
                accept=".pdf,.mp4,.zip,.pptx"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                  selectedFile ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-200"
                }`}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={22} className="text-indigo-600" />
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-bold text-indigo-600">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-700">Click to select a file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, MP4, ZIP (Max 50MB)</p>
                  </>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : initialData ? (
                <>
                  <Save size={18} /> Update Material
                </>
              ) : (
                "Publish Material"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;