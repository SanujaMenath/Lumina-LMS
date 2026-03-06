import api from "../../../services/api";


export interface DashboardStat {
  label: string;
  value: number;
}

export interface Activity {
  title: string;
  course: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  recentActivities: Activity[];
}


export const lecturerService = {
  getDashboardData: async (userId: string): Promise<DashboardData> => {
    const res = await api.get<DashboardData>(`/lecturers/${userId}/dashboard`);
    return res.data;
  }
};
