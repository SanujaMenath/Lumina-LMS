import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Download,
  FileVideo,
  FileCode,
  File as FileIcon,
  Loader2,
  Edit2, 
} from "lucide-react";
import MaterialModal, { type CourseOption } from "./components/MaterialModal"; 
import { useAuth } from "../../context/AuthContext";
import { fetchLecturerCourses } from "./services/lecturerCourseService";
import {
  fetchMaterialsByCourse,
  uploadMaterialService,
  updateMaterialService, 
  deleteMaterialService,
  type MaterialDTO,
} from "./services/materialService";
import { toast } from "react-hot-toast";

interface DisplayMaterial extends MaterialDTO {
  course_name: string;
}

const MaterialManagement: React.FC = () => {
  const { user } = useAuth();

  const [materials, setMaterials] = useState<DisplayMaterial[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<DisplayMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("pdf")) return <FileText className="text-red-500" />;
    if (t.includes("video") || t.includes("mp4"))
      return <FileVideo className="text-blue-500" />;
    if (t.includes("code") || t.includes("zip") || t.includes("archive"))
      return <FileCode className="text-amber-500" />;
    return <FileIcon className="text-indigo-500" />;
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const myCourses = await fetchLecturerCourses();

      const courseOptions = myCourses.map((c) => ({
        id: c.course_id || c.id,
        name: c.course_name,
      }));
      setCourses(courseOptions);

      const materialPromises = myCourses.map((c) =>
        fetchMaterialsByCourse(c.course_id || c.id)
      );
      const materialsArrays = await Promise.all(materialPromises);

      const combinedMaterials: DisplayMaterial[] = materialsArrays
        .flat()
        .map((mat) => {
          const courseMatch = myCourses.find(
            (c) => (c.course_id || c.id) === mat.course_id
          );
          return {
            ...mat,
            course_name: courseMatch ? courseMatch.course_name : "Unknown Course",
          };
        });

      combinedMaterials.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      setMaterials(combinedMaterials);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (payload: FormData | Partial<MaterialDTO>) => {
    if (!user?.id) return;
    try {
      if (editingMaterial) {
        // Handle Update 
        const id = editingMaterial._id || editingMaterial.id;
        if (!id) throw new Error("Material ID missing");
        
        await updateMaterialService(id, payload as Partial<MaterialDTO>);
        toast.success("Material updated successfully!");
      } else {
        // Handle Create
        await uploadMaterialService(payload as FormData, user.id);
        toast.success("Material uploaded successfully!");
      }
      setIsModalOpen(false);
      setEditingMaterial(null);
      loadData(); 
    } catch (error) {
      console.error(error);
      toast.error(editingMaterial ? "Failed to update material." : "Failed to upload material.");
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await deleteMaterialService(id);
        toast.success("Material deleted.");
        setMaterials((prev) => prev.filter((m) => (m._id || m.id) !== id));
      } catch {
        toast.error("Failed to delete material.");
      }
    }
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading course resources...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Material Management</h1>
          <p className="text-gray-500 font-medium mt-1">Upload and manage course resources.</p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null); 
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={18} /> Upload Material
        </button>
      </div>

      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaterial(null);
        }}
        initialData={editingMaterial}
        onSave={handleSave}
        courses={courses}
      />

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search materials or courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-6 py-5">File Details</th>
                <th className="px-6 py-5">Course</th>
                <th className="px-6 py-5">Uploaded On</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-white transition-colors shadow-sm">
                          {getFileIcon(item.material_type)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                          <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">{item.material_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">{item.course_name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Just now"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Download */}
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download">
                          <Download size={18} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingMaterial(item);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Edit Metadata"
                        >
                          <Edit2 size={18} />
                        </button>

                        {/* Delete */}
                        <button onClick={() => handleDelete(item._id || item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
     
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full"><FileIcon size={32} className="text-gray-300" /></div>
                      <p className="text-gray-500 font-bold">No materials found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialManagement;