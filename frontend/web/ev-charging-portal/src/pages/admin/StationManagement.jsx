// pages/admin/StationManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import { useStation } from "@/hooks/useStation";

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

  // Load danh sách trạm
  useEffect(() => {
    getAll({ lat: 10.9, lng: 106.8, radius: 50 });
  }, [getAll]);

  // Khi chọn 1 trạm → load chi tiết + connectors
  useEffect(() => {
    if (!selectedId) return;
    getById(selectedId);
    getConnectors(selectedId);
  }, [selectedId, getById, getConnectors]);

  // Đồng bộ form với dữ liệu
  useEffect(() => {
    if (!currentStation) return;
    setEditName(currentStation.name || "");
    setEditNote(currentStation.description || currentStation.notes || "");
  }, [currentStation]);

  const handleSelectStation = (id) => setSelectedId(id);

  const handleSaveBasicInfo = async () => {
    const id = currentStation?.id || currentStation?.station_id;
    if (!id) return;

    await update(id, { name: editName, description: editNote });
  };

  const handleToggleMaintenance = async () => {
    const id = currentStation?.id || currentStation?.station_id;
    if (!id) return;

    await setMaintenance(id, { maintenance: !currentStation.maintenance });
  };

  const handleDeleteStation = async () => {
    const id = currentStation?.id || currentStation?.station_id;
    if (!id) return;

    if (!window.confirm("Bạn có chắc muốn xoá trạm này?")) return;
    await remove(id);
    setSelectedId(null);
  };

  const handleReportIssue = async () => {
    const id = currentStation?.id || currentStation?.station_id;
    if (!id) return;

    const desc = window.prompt("Nhập mô tả sự cố:");
    if (!desc) return;

    await reportIssue(id, { description: desc });
  };

  // =====================================
  // 🔥 CHUẨN HOÁ CONNECTORS – FIX CHÍNH
  // =====================================
  const connectorList = useMemo(() => {
    if (!connectors) return [];

    if (Array.isArray(connectors)) return connectors;

    const raw =
      connectors.points ||
      connectors.connectors ||
      connectors.chargers ||
      connectors.data?.points ||
      connectors.data?.connectors ||
      connectors.data?.chargers;

    return Array.isArray(raw) ? raw : [];
  }, [connectors]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Quản lý trạm sạc" subtitle="Xem, chỉnh sửa và theo dõi tình trạng trạm" />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong> {error.message || String(error)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ================================= */}
        {/* CỘT TRÁI: DANH SÁCH TRẠM */}
        {/* ================================= */}
        <Section title="Danh sách trạm" className="lg:col-span-1">
          {loading && !stations?.length ? (
            <div className="text-sm text-gray-500">Đang tải danh sách trạm...</div>
          ) : (stations || []).length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có trạm nào.</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {stations.map((st) => {
                const id = st.id || st.station_id;
                const isSelected = id === selectedId;

                return (
                  <button
                    key={id}
                    onClick={() => handleSelectStation(id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-all
                      ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                  >
                    <div className="font-semibold text-gray-900">{st.name}</div>
                    <div className="text-xs text-gray-500 truncate">ID: {id}</div>
                    <div className="text-xs mt-1 text-gray-500">
                      {st.chargers?.length || 0} trụ • {st.maintenance ? "Bảo trì" : "Hoạt động"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* ================================= */}
        {/* CỘT PHẢI: CHI TIẾT TRẠM + CONNECTORS */}
        {/* ================================= */}
        <div className="lg:col-span-2 space-y-6">

          {/* ====================== */}
          {/* CHI TIẾT TRẠM */}
          {/* ====================== */}
          <Section title="Chi tiết trạm">
            {!currentStation ? (
              <div className="text-sm text-gray-500">Chọn trạm để xem chi tiết.</div>
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
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Địa chỉ</div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      {currentStation.address}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Ghi chú</div>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3 border-t">
                  <button onClick={handleSaveBasicInfo} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Lưu thay đổi</button>
                  <button onClick={handleToggleMaintenance} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white">
                    {currentStation.maintenance ? "Bỏ bảo trì" : "Đặt bảo trì"}
                  </button>
                  <button onClick={handleReportIssue} className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white">Báo cáo sự cố</button>
                  <button onClick={handleDeleteStation} className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-800">Xoá trạm</button>
                </div>

              </div>
            )}
          </Section>

          {/* ====================== */}
          {/* DANH SÁCH CONNECTOR */}
          {/* ====================== */}
          <Section title="Danh sách trụ / Connector">
            {!currentStation ? (
              <div className="text-sm text-gray-500">Chọn trạm để xem danh sách connector.</div>
            ) : connectorList.length === 0 ? (
              <div className="text-sm text-gray-500">Không có dữ liệu.</div>
            ) : (
              <Table
                columns={["ID", "Loại", "Công suất (kW)", "Trạng thái"]}
                rows={connectorList.map((c, idx) => ({
                  key: c.point_id || idx,
                  columns: [
                    c.point_id,
                    c.type,
                    c.max_power_kw,
                    c.status,
                  ],
                }))}
              />
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}
