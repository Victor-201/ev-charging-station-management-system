import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { useStation } from "@/hooks/useStation";

/**
 * Admin – Quản lý trạm sạc
 * Sử dụng API thật từ stationService:
 *  GET    /api/v1/stations
 *  GET    /api/v1/stations/:id
 *  GET    /api/v1/stations/:id/connectors
 *  PUT    /api/v1/stations/:id
 *  DELETE /api/v1/stations/:id
 *  POST   /api/v1/stations/:id/maintenance
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

  // ========================================================
  // LOAD DANH SÁCH TRẠM – API THẬT
  // ========================================================
  useEffect(() => {
    getAll({})
      .catch((err) =>
        setError(err?.response?.data?.message || "Không tải được danh sách trạm.")
      );
  }, [getAll]);

  // ========================================================
  // CHỌN TRẠM
  // ========================================================
  const selectStation = async (id) => {
    setSelectedId(id);
    setEditing(null);
    setError("");

    try {
      await Promise.all([getById(id), getConnectors(id)]);
    } catch (err) {
      setError("Không tải được chi tiết trạm.");
    }
  };

  // ========================================================
  // BẮT ĐẦU CHỈNH SỬA
  // ========================================================
  const startEdit = () => {
    if (!currentStation) return;
    setEditing({
      name: currentStation.name || "",
      address: currentStation.address || "",
      city: currentStation.city || "",
      region: currentStation.region || "",
    });
  };

  // ========================================================
  // LƯU CHỈNH SỬA – API THẬT
  // ========================================================
  const saveEdit = async () => {
    if (!editing || !currentStation) return;

    try {
      await update(currentStation.id, editing);
      setEditing(null);
      await getById(currentStation.id);
    } catch (err) {
      alert("Không thể lưu thay đổi.");
    }
  };

  // ========================================================
  // BẬT / TẮT BẢO TRÌ (POST /maintenance)
  // ========================================================
  const toggleMaintenance = async () => {
    if (!currentStation) return;

    const newStatus = currentStation.status === "maintenance" ? "active" : "maintenance";

    try {
      await setMaintenance(currentStation.id, { status: newStatus });
      await getById(currentStation.id);
    } catch (err) {
      alert("Không thể đổi trạng thái bảo trì.");
    }
  };

  // ========================================================
  // XOÁ TRẠM – DELETE API
  // ========================================================
  const deleteStation = async () => {
    if (!currentStation) return;
    if (!window.confirm("Xoá trạm này?")) return;

    try {
      await remove(currentStation.id);
      setSelectedId(null);
      await getAll({});
    } catch {
      alert("Không thể xoá trạm.");
    }
  };

  // ========================================================
  // TABLE ROWS – MATCH 100% API TRẢ VỀ
  // ========================================================
  const stationRows =
    stations?.map((s) => [
      s.id,
      s.name,
      s.city,
      s.region,
      s.status === "maintenance" ? "Bảo trì" : "Hoạt động",
    ]) ?? [];

  const connectorsRows =
    connectors?.map((c) => [
      c.id,
      c.label,
      c.type,
      c.powerPoint,
      c.status,
      c.lastUpdated,
    ]) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Quản lý trạm sạc"
          subtitle="Dữ liệu được lấy trực tiếp từ API station-service."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========================================================
              DANH SÁCH TRẠM
          ======================================================== */}
          <Section title="Danh sách trạm">
            {loading && stations.length === 0 ? (
              <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <Table
                columns={["ID", "Tên", "Thành phố", "Khu vực", "Trạng thái"]}
                rows={stationRows}
                onRowClick={(row) => selectStation(row[0])}
                selectedKey={selectedId}
              />
            )}
          </Section>

          {/* ========================================================
              CHI TIẾT / CHỈNH SỬA TRẠM
          ======================================================== */}
          <Section title="Chi tiết / chỉnh sửa" className="lg:col-span-2">
            {!currentStation ? (
              <p className="text-sm text-slate-500">Chọn một trạm để xem chi tiết.</p>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4 text-sm">

                {/* ========== FORM EDIT ========== */}
                {editing ? (
                  <>
                    <div>
                      <div className="text-xs text-slate-500">Tên trạm</div>
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Địa chỉ</div>
                      <input
                        value={editing.address}
                        onChange={(e) =>
                          setEditing({ ...editing, address: e.target.value })
                        }
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-500">Thành phố</div>
                        <input
                          value={editing.city}
                          onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                          className="w-full border px-3 py-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Khu vực</div>
                        <input
                          value={editing.region}
                          onChange={(e) =>
                            setEditing({ ...editing, region: e.target.value })
                          }
                          className="w-full border px-3 py-2 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-2 border rounded-lg"
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        Lưu
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Tên trạm</div>
                        <div className="text-xl font-bold">{currentStation.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          ID: {currentStation.id}
                        </div>
                      </div>

                      <button
                        onClick={startEdit}
                        className="px-3 py-2 border rounded-lg text-sm"
                      >
                        Chỉnh sửa
                      </button>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <div>Địa chỉ: {currentStation.address}</div>
                      <div>Thành phố: {currentStation.city}</div>
                      <div>Khu vực: {currentStation.region}</div>
                      <div>
                        Trạng thái:{" "}
                        <span
                          className={
                            currentStation.status === "maintenance"
                              ? "text-amber-600"
                              : "text-green-600"
                          }
                        >
                          {currentStation.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={toggleMaintenance}
                        className="px-3 py-2 rounded-lg bg-slate-200"
                      >
                        {currentStation.status === "maintenance"
                          ? "Tắt bảo trì"
                          : "Bật bảo trì"}
                      </button>

                      <button
                        onClick={deleteStation}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white"
                      >
                        Xoá trạm
                      </button>
                    </div>
                  </>
                )}

                <hr />

                {/* CONNECTORS */}
                <div>
                  <div className="font-semibold mb-2">
                    Danh sách connectors trong trạm
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
