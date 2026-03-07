import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  FileVideo,
  FileCode,
  File as FileIcon,
  Loader2,
  Download,
  ArrowLeft,
  BookOpen,
  Clock
} from "lucide-react";
import { fetchMaterialsByCourse, type MaterialDTO } from "../lecturer/services/materialService";
import { toast } from "react-hot-toast";

const StudentCourseMaterials: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("pdf")) return <FileText className="text-red-500" size={24} />;
    if (t.includes("video") || t.includes("mp4")) return <FileVideo className="text-blue-500" size={24} />;
    if (t.includes("code") || t.includes("zip") || t.includes("archive")) return <FileCode className="text-amber-500" size={24} />;
    return <FileIcon className="text-emerald-500" size={24} />;
  };

  useEffect(() => {
    const loadMaterials = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const data = await fetchMaterialsByCourse(courseId);
        
        data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setMaterials(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load course materials.");
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading course resources...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
      
      {/* Top Navigation */}
      <button 
        onClick={() => navigate("/student/my-courses")}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Courses
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
          <BookOpen size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Course Materials</h1>
          <p className="text-gray-500 font-medium mt-1">Access lecture notes, assignments, and resources.</p>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {materials.length > 0 ? (
          materials.map((item) => (
            <div 
              key={item._id || item.id} 
              className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start md:items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                  {getFileIcon(item.material_type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-bold uppercase tracking-wider text-gray-600">
                      {item.material_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> 
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recently uploaded"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <a 
                href={`http://127.0.0.1:8000${item.file_url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                download
                className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-all shrink-0"
              >
                <Download size={18} /> Download
              </a>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileIcon size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No materials available yet</h3>
            <p className="text-gray-500 font-medium mt-1">Your lecturer hasn't uploaded any resources for this course.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseMaterials;