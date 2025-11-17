import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { useStation } from "@/hooks/useStation";

/**
 * Admin – Quản lý trạm sạc
 * - Load toàn bộ trạm qua API thật: GET api/v1/stations
 * - Xem chi tiết trạm: GET api/v1/stations/:id
 * - Load connectors: GET api/v1/stations/:id/connectors
 * - Update, delete, maintenance đều dùng API thật từ useStation()
 */
export default function StationManagement() {
  const {
    stations,
    currentStation,
    connectors,
    loading,
    getAll,
    getById,
    getConnectors,
    update,
    remove,
    setMaintenance,
  } = useStation();

  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  // ================================
  // LOAD TẤT CẢ TRẠM LẦN ĐẦU (API thật)
  // ================================
  useEffect(() => {
    const params = { lat: 0, lng: 0, radius: 999999 };
    getAll(params).catch((e) =>
      setError(e?.message || "Không load được danh sách trạm.")
    );
  }, [getAll]);

  // ================================
  // CHỌN TRẠM → LOAD DETAIL + CONNECTORS
  // ================================
  const selectStation = async (id) => {
    setSelectedId(id);
    setEditing(null);
    setError("");
    try {
      await Promise.all([getById(id), getConnectors(id)]);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không load được chi tiết trạm."
      );
    }
  };

  // ================================
  // BẮT ĐẦU CHỈNH SỬA
  // ================================
  const startEdit = () => {
    if (!currentStation) return;
    setEditing({
      name: currentStation.name,
      description: currentStation.description || "",
    });
  };

  // ================================
  // LƯU CHỈNH SỬA (PUT API thật)
  // ================================
  const saveEdit = async () => {
    if (!currentStation || !editing) return;
    try {
      await update(currentStation.id, editing);
      setEditing(null);
      await getById(currentStation.id); // reload detail
    } catch (err) {
      alert("Không thể lưu. Xem console để biết thêm chi tiết.");
      console.error("update error:", err);
    }
  };

  // ================================
  // Bật/tắt bảo trì (PATCH API thật)
  // ================================
  const toggleMaintenance = async () => {
    if (!currentStation) return;
    try {
      await setMaintenance(currentStation.id, !currentStation.maintenance);
      await getById(currentStation.id);
    } catch (err) {
      alert("Không thể đổi trạng thái bảo trì.");
      console.error("maintenance error:", err);
    }
  };

  // ================================
  // Xoá trạm (DELETE API thật)
  // ================================
  const deleteStation = async () => {
    if (!currentStation) return;

    if (!window.confirm(`Xoá trạm ${currentStation.name}?`)) return;

    try {
      await remove(currentStation.id);
      setSelectedId(null);
      await getAll({ lat: 0, lng: 0, radius: 999999 });
    } catch (err) {
      alert("Không thể xoá trạm.");
      console.error("delete error:", err);
    }
  };

  // Bảng danh sách trạm
  const stationRows =
    stations?.map((s) => [
      s.id,
      s.name,
      s.city || s.location || "",
      String(s.chargers?.length || 0),
      s.maintenance ? "Đang bảo trì" : "Hoạt động",
    ]) || [];

  // Bảng connectors
  const connectorsRows =
    connectors?.map((c) => [
      c.id,
      c.label,
      c.type,
      c.powerPoint,
      c.status,
      c.lastUpdated,
    ]) || [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Quản lý trạm sạc"
          subtitle="Toàn bộ dữ liệu được lấy trực tiếp từ API thật (useStation → stationService → apiClient)."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================================ 
              DANH SÁCH TRẠM 
          =================================== */}
          <Section title="Danh sách trạm" className="lg:col-span-1">
            {loading && stations.length === 0 ? (
              <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <Table
                columns={["ID", "Tên", "Khu vực", "Số trụ", "Trạng thái"]}
                rows={stationRows}
                onRowClick={(row) => selectStation(row[0])}
                selectedKey={selectedId}
              />
            )}
          </Section>

          {/* ================================ 
              CHI TIẾT TRẠM 
          =================================== */}
          <Section title="Chi tiết / chỉnh sửa" className="lg:col-span-2">
            {!currentStation ? (
              <p className="text-sm text-slate-500">
                Chọn một trạm bên trái để xem chi tiết.
              </p>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4 text-sm">
                {editing ? (
                  <>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Tên trạm</div>
                      <input
                        value={editing.name}
                        onChange={(e) =>
                          setEditing((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Mô tả / ghi chú
                      </div>
                      <textarea
                        rows={3}
                        value={editing.description}
                        onChange={(e) =>
                          setEditing((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-2 rounded-lg border text-sm"
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Tên trạm</div>
                        <div className="text-xl font-bold">
                          {currentStation.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          ID: {currentStation.id}
                        </div>
                      </div>

                      <button
                        onClick={startEdit}
                        className="px-3 py-2 rounded-lg border text-sm"
                      >
                        Chỉnh sửa
                      </button>
                    </div>

                    <div className="flex gap-3 mt-4 flex-wrap">
                      <button
                        onClick={toggleMaintenance}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                          currentStation.maintenance
                            ? "bg-amber-600 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {currentStation.maintenance
                          ? "Tắt bảo trì"
                          : "Bật bảo trì"}
                      </button>

                      <button
                        onClick={deleteStation}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
                      >
                        Xoá trạm
                      </button>
                    </div>
                  </>
                )}

                <hr className="my-4" />

                {/* CONNECTORS */}
                <div>
                  <div className="font-semibold mb-2">
                    Danh sách connector / charger trong trạm
                  </div>
                  <Table
                    columns={[
                      "ID",
                      "Label",
                      "Type",
                      "Power (kW)",
                      "Status",
                      "Last Updated",
                    ]}
                    rows={connectorsRows}
                  />
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
