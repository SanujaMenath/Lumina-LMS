import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, Clock, User, Activity, Globe, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../services/api";


interface SystemLog {
  _id: string;
  actor_id: string | null;
  actor_name?: string | null; 
  role: string;
  action: string;
  details: string;
  ip_address: string | null;
  timestamp: string;
}

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 50; 
  const totalPages = Math.ceil(totalLogs / limit);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token"); 
        
        if (!token) {
          console.error("No token found in local storage!");
          toast.error("Authentication error: Please log in again.");
          setLoading(false);
          return;
        }

        const skip = (currentPage - 1) * limit;
        const response = await axios.get(`${API_BASE_URL}/system-logs/?skip=${skip}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setLogs(response.data.logs);
        setTotalLogs(response.data.total);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        toast.error("Failed to load system logs. Are you logged in as an Admin?");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).format(date);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      lecturer: "bg-blue-100 text-blue-700 border-blue-200",
      student: "bg-emerald-100 text-emerald-700 border-emerald-200",
      system: "bg-gray-100 text-gray-700 border-gray-200"
    };
    const colorClass = colors[role.toLowerCase()] || colors.system;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colorClass}`}>{role.toUpperCase()}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="p-3 bg-red-50 rounded-xl">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">System Audit Logs</h1>
          <p className="text-sm font-medium text-gray-500">
            Secure, immutable trail of all actions across Lumina LMS. ({totalLogs} total events)
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-100">
              <tr>
                <th className="p-4"><div className="flex items-center gap-2"><Clock size={16}/> Timestamp</div></th>
                <th className="p-4"><div className="flex items-center gap-2"><Activity size={16}/> Action</div></th>
                <th className="p-4"><div className="flex items-center gap-2"><User size={16}/> Actor</div></th>
                <th className="p-4">Details</th>
                <th className="p-4"><div className="flex items-center gap-2"><Globe size={16}/> IP Address</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Loader2 size={32} className="mx-auto animate-spin mb-2 text-indigo-500" />
                    <p className="font-medium">Fetching secure logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="p-4 font-bold text-gray-900">{log.action}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        {getRoleBadge(log.role)}
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]" title={log.actor_name || log.actor_id || "System"}>
                          {log.actor_name || log.actor_id || "System"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{log.details}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{log.ip_address || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;