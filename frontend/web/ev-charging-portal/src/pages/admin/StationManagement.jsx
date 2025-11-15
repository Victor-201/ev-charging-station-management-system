// pages/admin/StationManagement.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

const STATUS_COLORS = {
  active: "bg-emerald-50 text-emerald-700",
  maintenance: "bg-amber-50 text-amber-700",
  closed: "bg-red-50 text-red-700",
};

export default function StationManagement() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function fetchStations() {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient({
        method: "GET",
        url: "/api/v1/stations",
      });
      setStations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Station list error:", err);
      setError("Không tải được danh sách trạm.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStations();
  }, []);

  // Thay đổi trạng thái trạm (active / maintenance / closed)
  async function updateStationStatus(stationId, newStatus) {
    try {
      setSavingId(stationId);
      setError("");

      await apiClient({
        method: "PATCH",
        url: `/api/v1/stations/${stationId}/status`,
        data: { status: newStatus },
      });

      // Cập nhật state local
      setStations((prev) =>
        prev.map((s) =>
          s.id === stationId ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error("Update station status error:", err);
      setError("Không cập nhật được trạng thái trạm.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý trạm sạc"
        subtitle="Theo dõi, chỉnh sửa thông tin và trạng thái hoạt động của các trạm sạc"
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Section title="Danh sách trạm sạc">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : stations.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có trạm sạc nào trong hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Tên trạm</th>
                  <th className="py-2 pr-4">Địa chỉ</th>
                  <th className="py-2 pr-4">Thành phố / Khu vực</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="py-2 pr-4 font-medium">{s.name}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {s.address || "-"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {s.city || s.region || "-"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[s.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.status === "active"
                          ? "Đang hoạt động"
                          : s.status === "maintenance"
                          ? "Bảo trì"
                          : s.status === "closed"
                          ? "Đã đóng"
                          : s.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateStationStatus(s.id, "active")
                        }
                        disabled={savingId === s.id || s.status === "active"}
                        className="text-xs px-3 py-1 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Kích hoạt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStationStatus(s.id, "maintenance")
                        }
                        disabled={savingId === s.id}
                        className="text-xs px-3 py-1 rounded-lg border border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                      >
                        Bảo trì
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStationStatus(s.id, "closed")
                        }
                        disabled={savingId === s.id}
                        className="text-xs px-3 py-1 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Đóng trạm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
