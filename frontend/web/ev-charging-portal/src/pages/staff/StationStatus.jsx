import React, { useEffect, useMemo, useState } from "react";
import { useStation } from "@/hooks/useStation"; // hook lấy từ context
import Card from "../../components/staff/Card/index";
import Table from "../../components/staff/Table/index";

export default function Stations() {
  // 🚩 ID trạm mà nhân viên hiện tại quản lý (sau này có thể lấy từ user context)
  const managedStationId = "22222222-2222-2222-2222-222222222222";

  const {
    stations,
    currentStation,
    connectors,
    loading,
    getAll,
    getById,
    getConnectors,
    update,
  } = useStation();

  const [selectedChargerId, setSelectedChargerId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ===== Lấy dữ liệu =====
  useEffect(() => {
    getAll(); // lấy danh sách tất cả trạm
  }, [getAll]);

  useEffect(() => {
    if (managedStationId) {
      // lấy chi tiết trạm đang quản lý
      getById(managedStationId);
      // lấy danh sách các point (charger/connector) trong trạm
      getConnectors(managedStationId);
    }
  }, [managedStationId, getById, getConnectors]);

  // ===== Tính toán thống kê =====
  const stats = useMemo(() => {
    const list = connectors || currentStation?.chargers || [];
    return {
      totalChargers: list.length,
      available: list.filter((c) => c.status === "available").length,
      in_use: list.filter((c) => c.status === "in_use").length,
      fault: list.filter((c) => c.status === "fault").length,
      charging: list.filter((c) => c.status === "charging").length,
    };
  }, [connectors, currentStation]);

  // ===== Lọc danh sách point =====
  const filteredChargers = useMemo(() => {
    let list = connectors || currentStation?.chargers || [];
    if (query) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.id || "").toLowerCase().includes(q) ||
          (c.label || "").toLowerCase().includes(q) ||
          (c.notes || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    return list;
  }, [connectors, currentStation, query, statusFilter]);

  // ===== Xử lý chọn charger =====
  const selectedCharger =
    filteredChargers.find((c) => c.id === selectedChargerId) || null;

  // ===== Đổi trạng thái charger =====
  function setChargerStatus(chargerId, newStatus) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updatedChargers = filteredChargers.map((ch) =>
      ch.id === chargerId
        ? {
            ...ch,
            status: newStatus,
            lastUpdated: now,
            history: [{ time: now, note: `Đặt trạng thái: ${newStatus}` }, ...(ch.history || [])],
          }
        : ch
    );
    update(currentStation.id, { chargers: updatedChargers });
  }

  // ===== Thêm lịch sử charger =====
  function addChargerHistory(chargerId, note) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updatedChargers = filteredChargers.map((ch) =>
      ch.id === chargerId
        ? {
            ...ch,
            history: [{ time: now, note }, ...(ch.history || [])],
            lastUpdated: now,
          }
        : ch
    );
    update(currentStation.id, { chargers: updatedChargers });
  }

  // ===== Chuyển bộ lọc theo loại trạng thái =====
  function onClickStat(statKey) {
    setStatusFilter((prev) => (prev === statKey ? "all" : statKey));
    setSelectedChargerId(null);
  }

  // ===== Giao diện =====
  if (loading)
    return (
      <div className="text-center text-gray-500 py-12 text-lg font-medium">
        Đang tải dữ liệu trạm...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-8 font-inter">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">Quản lý trạm — Nhân viên</h1>

        {/* Bộ thống kê */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {[
            { key: "all", label: "Trạm", value: currentStation?.name || "—", sub: currentStation?.id },
            { key: "available", label: "Sẵn sàng", value: stats.available, sub: "trụ" },
            { key: "in_use", label: "Đang dùng", value: stats.in_use, sub: "trụ" },
            { key: "fault", label: "Lỗi", value: stats.fault, sub: "trụ" },
          ].map((stat) => (
            <div
              key={stat.key}
              onClick={() => onClickStat(stat.key)}
              className={`cursor-pointer select-none flex flex-col gap-1 rounded-xl border px-4 py-3 shadow-sm transition-all 
              ${statusFilter === stat.key ? "bg-blue-50 border-blue-300 shadow-md -translate-y-1" : "bg-white border-gray-200 hover:shadow-md"}
              ${
                stat.key === "available"
                  ? "text-emerald-600"
                  : stat.key === "in_use"
                  ? "text-blue-600"
                  : stat.key === "fault"
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className="text-xl font-bold">{stat.value}</span>
              {stat.sub && <span className="text-xs text-gray-500">{stat.sub}</span>}
            </div>
          ))}

          <div className="ml-auto min-w-[260px]">
            <input
              placeholder="Tìm trụ theo ID, tên, ghi chú..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lưới trụ sạc */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChargers.length > 0 ? (
              filteredChargers.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChargerId(ch.id)}
                  className={`rounded-xl border p-4 shadow-md transition-all cursor-pointer 
                  ${selectedChargerId === ch.id ? "border-blue-400 shadow-lg -translate-y-1" : "border-gray-200 hover:-translate-y-0.5 hover:shadow-lg"}
                  ${
                    ch.status === "available"
                      ? "bg-emerald-50"
                      : ch.status === "in_use"
                      ? "bg-blue-50"
                      : ch.status === "fault"
                      ? "bg-red-50"
                      : "bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-gray-800">{ch.id}</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold text-white capitalize
                      ${
                        ch.status === "available"
                          ? "bg-emerald-500"
                          : ch.status === "in_use"
                          ? "bg-blue-500"
                          : ch.status === "charging"
                          ? "bg-indigo-500"
                          : ch.status === "fault"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    >
                      {ch.status}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-gray-900">{ch.label}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
                    <span>{ch.powerPoint} kW</span>
                    <span>•</span>
                    <span>{ch.lastUpdated}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white text-center border border-dashed rounded-xl p-8 text-gray-500">
                Không có trụ nào trong trạm.
              </div>
            )}
          </div>

          {/* Panel chi tiết */}
          {currentStation && (
            <aside className="w-full md:w-96 flex flex-col gap-4">
              <div className="bg-white rounded-xl border p-4 shadow">
                <h2 className="text-lg font-bold mb-1">{currentStation.name}</h2>
                <div className="text-xs text-gray-500 mb-2">
                  ID: {currentStation.id} — Cập nhật: {currentStation.lastUpdated || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.totalChargers} trụ • {stats.available} sẵn sàng • {stats.in_use} đang dùng •{" "}
                  {stats.fault} lỗi
                </div>
              </div>

              {selectedCharger ? (
                <>
                  <div className="bg-white rounded-xl border p-4 shadow">
                    <h3 className="font-semibold mb-2">Chi tiết {selectedCharger.label}</h3>
                    <div className="text-sm border-b py-2">
                      <strong>ID:</strong> {selectedCharger.id}
                    </div>
                    <div className="text-sm border-b py-2">
                      <strong>Loại:</strong> {selectedCharger.type || "—"}
                    </div>
                    <div className="text-sm border-b py-2">
                      <strong>Công suất:</strong> {selectedCharger.powerPoint} kW
                    </div>
                    <div className="text-sm border-b py-2">
                      <strong>Trạng thái:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold text-white capitalize ${
                          selectedCharger.status === "available"
                            ? "bg-emerald-500"
                            : selectedCharger.status === "charging"
                            ? "bg-indigo-500"
                            : selectedCharger.status === "in_use"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      >
                        {selectedCharger.status}
                      </span>
                    </div>
                    <div className="text-sm py-2">
                      <strong>Ghi chú:</strong> {selectedCharger.notes}
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id, "available")}
                        className="px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Đặt Sẵn sàng
                      </button>
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id, "charging")}
                        className="px-3 py-1 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        Đặt Đang sạc
                      </button>
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id, "fault")}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Đặt Lỗi
                      </button>
                      <button
                        onClick={() => addChargerHistory(selectedCharger.id, "Kiểm tra nhanh bởi kỹ thuật viên")}
                        className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Thêm lịch sử
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-4 shadow">
                    <h3 className="font-semibold mb-2">Lịch sử trụ</h3>
                    {selectedCharger.history?.length ? (
                      <ul className="space-y-1 text-sm">
                        {selectedCharger.history.map((h, i) => (
                          <li key={i} className="text-gray-700">
                            <span className="text-gray-500">{h.time}</span> — {h.note}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 text-sm">Chưa có lịch sử</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border p-4 shadow text-center text-gray-500 text-sm">
                  Chọn một trụ để xem chi tiết
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Debug table */}
        <div className="mt-6">
          <Card title="Stations list (raw)">
            <Table
              columns={["ID", "Name", "#Chargers", "LastUpdated"]}
              rows={
                stations?.map((s) => [
                  s.id,
                  s.name,
                  String(s.chargers?.length || 0),
                  s.lastUpdated || "",
                ]) || []
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
