import React, { useEffect, useMemo, useState } from "react";
import { useStation } from "@/hooks/useStation"; // hook lấy từ context
import Card from "../../components/staff/Card/index";
import Table from "../../components/staff/Table/index";

export default function Stations() {
  const managedStationId = "550e8400-e29b-41d4-a716-446655440001";

  const {
    stations,
    currentStation,
    connectors,
    loading,
    getAll,
    getById,
    getConnectors,
    update,
    getChargerById,    // <- ensure exported by useStation
    getChargerPricing, // <- ensure exported by useStation
  } = useStation();

  const [selectedChargerId, setSelectedChargerId] = useState(null);
  const [selectedChargerDetails, setSelectedChargerDetails] = useState(null);

  const [loadingCharger, setLoadingCharger] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ===== Lấy dữ liệu =====
  useEffect(() => {
    const params = { lat: 10.9, lng: 106.8, radius: 10 };
    getAll(params);
  }, [getAll]);

  useEffect(() => {
    if (managedStationId) {
      getById(managedStationId);
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
          (c.label || c.name || "").toLowerCase().includes(q) ||
          (c.notes || "").toLowerCase().includes(q) ||
          (c.external_id || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    return list;
  }, [connectors, currentStation, query, statusFilter]);

  // helper: chọn id ưu tiên để gọi API
  const chooseChargerId = (ch) => ch?.external_id || ch?.connector_id || ch?.id || null;

  // ===== Xử lý chọn charger (lấy details + pricing) =====
  async function handleSelectCharger(ch) {
    const chargerId = chooseChargerId(ch);
    if (!chargerId) {
      setSelectedChargerId(null);
      setSelectedChargerDetails(null);
      return;
    }

    setSelectedChargerId(chargerId);
    setSelectedChargerDetails(null);

    // ---------- load details ----------
    setLoadingCharger(true);
    try {
      if (getChargerById) {
        const res = await getChargerById(chargerId);
        if (res?.success && res.data) {
          // set details initial (pricing will merge later)
          setSelectedChargerDetails(res.data);
        } else {
          setSelectedChargerDetails(ch); // fallback
        }
      } else {
        setSelectedChargerDetails(ch);
      }
    } catch (err) {
      setSelectedChargerDetails(ch);
    } finally {
      setLoadingCharger(false);
    }

    // ---------- load pricing and MERGE into selectedChargerDetails ----------
    setLoadingPricing(true);
    try {
      if (getChargerPricing) {
        const resP = await getChargerPricing(chargerId);
        if (resP?.success) {
          // Normalize pricing payload:
          // API có thể trả { pricing: [...] } hoặc trực tiếp array/object
          const payload = resP.data ?? resP;
          const pricingArray = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.pricing)
            ? payload.pricing
            : payload?.pricing
            ? [payload.pricing]
            : null;

          // Nếu payload là object chứa price_per_kwh, ... thì lưu nguyên
          const pricingObj = pricingArray ? { pricing: pricingArray } : payload;

          // Merge vào details (nếu details chưa có vì load details bị chậm, dùng fallback ch)
          setSelectedChargerDetails((prev) => {
            const base = prev || ch || {};
            // nếu pricingArray tồn tại thì attach trực tiếp như base.pricing = [...]
            if (pricingArray) {
              return { ...base, pricing: pricingArray };
            }
            // else nếu payload là object (không phải array) attach như base.pricingObj
            return { ...base, pricing: pricingObj || base.pricing || null };
          });
        } else {
          // no pricing
          setSelectedChargerDetails((prev) => prev || ch || null);
        }
      } else {
        // no pricing function
        setSelectedChargerDetails((prev) => prev || ch || null);
      }
    } catch (err) {
      // ignore pricing error
      setSelectedChargerDetails((prev) => prev || ch || null);
    } finally {
      setLoadingPricing(false);
    }
  }

  // ===== Đổi trạng thái charger =====
  function setChargerStatus(chargerId, newStatus) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updatedChargers = (connectors || currentStation?.chargers || []).map((c) =>
      chooseChargerId(c) === chargerId
        ? {
            ...c,
            status: newStatus,
            lastUpdated: now,
            history: [{ time: now, note: `Đặt trạng thái: ${newStatus}` }, ...(c.history || [])],
          }
        : c
    );
    if (currentStation?.id) update(currentStation.id, { chargers: updatedChargers });

    if (
      selectedChargerDetails &&
      (selectedChargerDetails.id === chargerId ||
        selectedChargerDetails.connector_id === chargerId ||
        selectedChargerDetails.external_id === chargerId)
    ) {
      setSelectedChargerDetails({
        ...selectedChargerDetails,
        status: newStatus,
        updated_at: now,
        history: [{ time: now, note: `Đặt trạng thái: ${newStatus}` }, ...(selectedChargerDetails.history || [])],
      });
    }
  }

  // ===== Thêm lịch sử charger =====
  function addChargerHistory(chargerId, note) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updatedChargers = (connectors || currentStation?.chargers || []).map((c) =>
      chooseChargerId(c) === chargerId
        ? {
            ...c,
            history: [{ time: now, note }, ...(c.history || [])],
            lastUpdated: now,
          }
        : c
    );
    if (currentStation?.id) update(currentStation.id, { chargers: updatedChargers });

    if (
      selectedChargerDetails &&
      (selectedChargerDetails.id === chargerId ||
        selectedChargerDetails.connector_id === chargerId ||
        selectedChargerDetails.external_id === chargerId)
    ) {
      setSelectedChargerDetails({
        ...selectedChargerDetails,
        history: [{ time: now, note }, ...(selectedChargerDetails.history || [])],
        updated_at: now,
      });
    }
  }

  // ===== Giao diện =====
  if (loading)
    return (
      <div className="text-center text-gray-500 py-12 text-lg font-medium">
        Đang tải dữ liệu trạm...
      </div>
    );

  const selectedCharger =
    (selectedChargerDetails &&
      (selectedChargerDetails.id === selectedChargerId ||
        selectedChargerDetails.connector_id === selectedChargerId ||
        selectedChargerDetails.external_id === selectedChargerId)
      ? selectedChargerDetails
      : filteredChargers.find((c) => chooseChargerId(c) === selectedChargerId)) || null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-8 font-inter">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">Quản lý trạm — Nhân viên</h1>

        {/* Bộ thống kê */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {[
            { key: "all", label: "Trạm", value: currentStation?.name  },
            { key: "available", label: "Sẵn sàng", value: stats.available, sub: "trụ" },
            { key: "in_use", label: "Đang dùng", value: stats.in_use, sub: "trụ" },
            { key: "fault", label: "Lỗi", value: stats.fault, sub: "trụ" },
          ].map((stat) => (
            <div
              key={stat.key}
              onClick={() => {
                setStatusFilter((prev) => (prev === stat.key ? "all" : stat.key));
                setSelectedChargerId(null);
                setSelectedChargerDetails(null);
              }}
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
              filteredChargers.map((ch) => {
                const visibleId = chooseChargerId(ch);
                return (
                  <div
                    key={visibleId || ch.id}
                    onClick={() => handleSelectCharger(ch)}
                    className={`rounded-xl border p-4 shadow-md transition-all cursor-pointer 
                    ${selectedChargerId === visibleId ? "border-blue-400 shadow-lg -translate-y-1" : "border-gray-200 hover:-translate-y-0.5 hover:shadow-lg"}
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
                      <div>
                        <div className="text-xs text-gray-400">ID trụ</div>
                        <div className="font-mono font-semibold text-sm text-gray-800">{visibleId || ch.id}</div>
                      </div>
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

                    <div className="mt-3 text-lg font-semibold text-gray-900">{ch.label || ch.name || "—"}</div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
                      <span>{ch.powerPoint || ch.max_power_kw || "—"} kW</span>
                      <span>•</span>
                      <span>{ch.lastUpdated || ch.updated_at || "—"}</span>
                    </div>
                  </div>
                );
              })
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
                  {stats.totalChargers} trụ • {stats.available} sẵn sàng • {stats.in_use} đang dùng • {stats.fault} lỗi
                </div>
              </div>

              {selectedCharger ? (
                <>
                  {/* CHI TIẾT chính (đã gộp pricing vào đây) */}
                  <div className="bg-white rounded-xl border p-4 shadow">
                    <h3 className="font-semibold mb-2">{loadingCharger ? "Đang tải chi tiết..." : `Chi tiết ${selectedCharger.label || selectedCharger.name || selectedCharger.id}`}</h3>

                    <div className="text-sm border-b py-2">
                      <strong>ID:</strong> {selectedCharger.id || selectedCharger.connector_id || selectedCharger.external_id}
                    </div>

                    <div className="text-sm border-b py-2">
                      <strong>Tên / Label:</strong> {selectedChargerDetails?.name || selectedCharger.label || selectedCharger.name || "—"}
                    </div>

                    <div className="text-sm border-b py-2">
                      <strong>Connector type:</strong> {selectedChargerDetails?.connector_type || selectedCharger.connector_type || selectedCharger.type || "—"}
                    </div>

                    <div className="text-sm border-b py-2">
                      <strong>Công suất tối đa:</strong> {selectedChargerDetails?.max_power_kw || selectedCharger.powerPoint || selectedCharger.max_power_kw || "—"} kW
                    </div>

                    <div className="text-sm border-b py-2">
                      <strong>Trạng thái:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold text-white capitalize ${
                          (selectedChargerDetails?.status || selectedCharger.status) === "available"
                            ? "bg-emerald-500"
                            : (selectedChargerDetails?.status || selectedCharger.status) === "charging"
                            ? "bg-indigo-500"
                            : (selectedChargerDetails?.status || selectedCharger.status) === "in_use"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      >
                        {selectedChargerDetails?.status || selectedCharger.status || "—"}
                      </span>
                    </div>

                    {/* ====== GỘP: Hiển thị BẢNG GIÁ tại đây ====== */}
                    <div className="text-sm border-b py-2">
                      <strong>Bảng giá:</strong>
                      <div className="mt-2">
                        {loadingPricing ? (
                          <div className="text-xs text-gray-500">Đang tải giá...</div>
                        ) : selectedChargerDetails?.pricing ? (
                          // selectedChargerDetails.pricing là mảng các mục pricing
                          Array.isArray(selectedChargerDetails.pricing) && selectedChargerDetails.pricing.length > 0 ? (
                            <ul className="text-sm space-y-1">
                              {selectedChargerDetails.pricing.map((p, idx) => (
                                <li key={idx} className="flex justify-between items-center">
                                  <div className="text-gray-700">
                                    {/* nice label for model */}
                                    <div className="text-xs text-gray-400 capitalize">{p.model || p.name || `item ${idx + 1}`}</div>
                                    <div className="font-medium">
                                      {p.price ?? p.price_per_kwh ?? p.value ?? "—"} {p.currency ?? ""}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">{p.note || ""}</div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-xs text-gray-500">Chưa có thông tin giá</div>
                          )
                        ) : // fallback: nếu API trả về object pricing dưới key khác hoặc trực tiếp là object
                        selectedChargerDetails && typeof selectedChargerDetails.pricing === "object" ? (
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">{JSON.stringify(selectedChargerDetails.pricing, null, 2)}</pre>
                        ) : (
                          <div className="text-xs text-gray-500">Chưa có thông tin giá</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id || selectedCharger.connector_id || selectedCharger.external_id, "available")}
                        className="px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Đặt Sẵn sàng
                      </button>
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id || selectedCharger.connector_id || selectedCharger.external_id, "charging")}
                        className="px-3 py-1 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        Đặt Đang sạc
                      </button>
                      <button
                        onClick={() => setChargerStatus(selectedCharger.id || selectedCharger.connector_id || selectedCharger.external_id, "fault")}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Đặt Lỗi
                      </button>
                      <button
                        onClick={() => addChargerHistory(selectedCharger.id || selectedCharger.connector_id || selectedCharger.external_id, "Kiểm tra nhanh bởi kỹ thuật viên")}
                        className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Thêm lịch sử
                      </button>
                    </div>
                  </div>

                  {/* Lịch sử */}
                  <div className="bg-white rounded-xl border p-4 shadow">
                    <h3 className="font-semibold mb-2">Lịch sử trụ</h3>
                    {(selectedChargerDetails?.history?.length || selectedCharger.history?.length) ? (
                      <ul className="space-y-1 text-sm">
                        {(selectedChargerDetails?.history || selectedCharger.history || []).map((h, i) => (
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
