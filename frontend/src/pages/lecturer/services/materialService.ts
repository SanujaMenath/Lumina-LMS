import api from "../../../services/api";

export interface MaterialDTO {
  _id?: string;
  id?: string;
  title: string;
  course_id: string;
  material_type: string;
  description?: string;
  file_url?: string;
  file_size?: number;
  created_at?: string;
}

// Fetch materials for a specific course
export const fetchMaterialsByCourse = async (
  courseId: string,
): Promise<MaterialDTO[]> => {
  const res = await api.get<MaterialDTO[]>(`/materials/course/${courseId}`);
  return res.data;
};

export const uploadMaterialService = async (
  formData: FormData,
  lecturerId: string,
) => {
  const res = await api.post(
    `/materials/?lecturer_id=${lecturerId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
};

export const updateMaterialService = async (materialId: string, data: Partial<MaterialDTO>): Promise<MaterialDTO> => {
  try {
    const response = await api.put(`materials/${materialId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating material:", error);
    throw error;
  }
};


export const deleteMaterialService = async (materialId: string) => {
  const res = await api.delete(`/materials/${materialId}`);
  return res.data;
};
