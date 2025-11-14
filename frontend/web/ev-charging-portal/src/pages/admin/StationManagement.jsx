// pages/admin/StationManagement.jsx
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import { useStation } from "@/hooks/useStation";

/**
 * Trang Quản lý trạm:
 * - Dùng StationProvider:
 *   + getAll, getById, update, remove, getConnectors, reportIssue
 * - Cho phép admin:
 *   + Xem danh sách trạm
 *   + Xem chi tiết / connectors
 *   + Đổi tên, ghi chú, trạng thái bảo trì
 */
export default function StationManagementPage() {
  const {
    stations,
    currentStation,
    connectors,
    loading,
    error,
    getAll,
    getById,
    getConnectors,
    update,
    remove,
    reportIssue,
    setMaintenance,
  } = useStation();

  const [selectedId, setSelectedId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");

  // Lấy danh sách trạm khi vào trang
  useEffect(() => {
    getAll({ lat: 10.9, lng: 106.8, radius: 50 });
  }, [getAll]);

  // Khi chọn trạm mới -> load chi tiết & connectors
  useEffect(() => {
    if (!selectedId) return;
    getById(selectedId);
    getConnectors(selectedId);
  }, [selectedId, getById, getConnectors]);

  // Khi currentStation thay đổi -> sync form edit
  useEffect(() => {
    if (!currentStation) return;
    setEditName(currentStation.name || "");
    setEditNote(currentStation.description || currentStation.notes || "");
  }, [currentStation]);

  const handleSelectStation = (id) => {
    setSelectedId(id);
  };

  const handleSaveBasicInfo = async () => {
    if (!currentStation?.id && !currentStation?.station_id) return;
    const id = currentStation.id || currentStation.station_id;
    await update(id, {
      name: editName,
      description: editNote,
    });
  };

  const handleToggleMaintenance = async () => {
    if (!currentStation?.id && !currentStation?.station_id) return;
    const id = currentStation.id || currentStation.station_id;
    const next = !currentStation.maintenance;
    await setMaintenance(id, { maintenance: next });
  };

  const handleDeleteStation = async () => {
    if (!currentStation?.id && !currentStation?.station_id) return;
    const id = currentStation.id || currentStation.station_id;
    if (!window.confirm("Bạn có chắc muốn xoá trạm này?")) return;
    await remove(id);
    setSelectedId(null);
  };

  const handleReportIssue = async () => {
    if (!currentStation?.id && !currentStation?.station_id) return;
    const id = currentStation.id || currentStation.station_id;
    const note = window.prompt("Nhập mô tả sự cố trạm:");
    if (!note) return;
    await reportIssue(id, { description: note });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý trạm sạc"
        subtitle="Xem, chỉnh sửa và theo dõi tình trạng trạm"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.message || error.toString() || "Có lỗi xảy ra khi thao tác trạm"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: danh sách trạm */}
        <Section title="Danh sách trạm" className="lg:col-span-1">
          {loading && !stations?.length ? (
            <div className="text-sm text-gray-500">Đang tải danh sách trạm...</div>
          ) : (stations || []).length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có trạm nào.</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {(stations || []).map((st) => {
                const id = st.id || st.station_id;
                const isSelected = id === selectedId;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectStation(id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {st.name || "Không tên"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      ID: {id}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {st.chargers?.length || 0} trụ •{" "}
                      {st.maintenance ? "Đang bảo trì" : "Hoạt động"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* Cột phải: chi tiết trạm + connectors */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Chi tiết trạm">
            {!currentStation ? (
              <div className="text-sm text-gray-500">
                Chọn một trạm ở bên trái để xem chi tiết.
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ID trạm</div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs">
                      {currentStation.id || currentStation.station_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tên trạm</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Địa chỉ</div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                      {currentStation.address || "Chưa có địa chỉ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Ghi chú / mô tả</div>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={handleSaveBasicInfo}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={handleToggleMaintenance}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    {currentStation.maintenance
                      ? "Bỏ trạng thái bảo trì"
                      : "Đặt chế độ bảo trì"}
                  </button>
                  <button
                    onClick={handleReportIssue}
                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Báo cáo sự cố
                  </button>
                  <button
                    onClick={handleDeleteStation}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-300"
                  >
                    Xoá trạm
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* Connectors của trạm */}
          <Section title="Danh sách trụ / Connector">
            {!currentStation ? (
              <div className="text-sm text-gray-500">
                Chọn trạm để xem danh sách connector.
              </div>
            ) : (
              <Table
                columns={[
                  "ID",
                  "Nhãn",
                  "Loại",
                  "Công suất (kW)",
                  "Trạng thái",
                ]}
                rows={(connectors || currentStation.chargers || []).map((c) => [
                  c.id || c.connector_id,
                  c.label || c.name || "—",
                  c.type || c.connector_type || "—",
                  c.powerPoint || c.power_kw || "—",
                  c.status || "—",
                ])}
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
