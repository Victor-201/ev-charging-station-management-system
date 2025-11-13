import { useState, useEffect, useMemo } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";

const LOCAL_KEY = "evcs_stations";
const LOCAL_CONNECTORS = "evcs_connectors";
const LOCAL_PRICING = "evcs_pricing";

// 🌟 Dữ liệu mẫu ban đầu
let mockStations = [
  { id: 1, code: "ST-01", name: "Station A", status: "active" },
  { id: 2, code: "ST-02", name: "Station B", status: "maintenance" },
  { id: 3, code: "ST-03", name: "Station C", status: "offline" },
];

if (!localStorage.getItem(LOCAL_KEY)) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(mockStations));
}
if (!localStorage.getItem(LOCAL_CONNECTORS)) {
  localStorage.setItem(LOCAL_CONNECTORS, JSON.stringify({}));
}
if (!localStorage.getItem(LOCAL_PRICING)) {
  localStorage.setItem(
    LOCAL_PRICING,
    JSON.stringify({
      1: { type: "Fast", price_per_kwh: 4500, peak_hours: "17h - 21h" },
      2: { type: "Normal", price_per_kwh: 3000, peak_hours: "18h - 22h" },
    })
  );
}

// 🧩 Service API
const stationService = {
  async getAll() {
    return JSON.parse(localStorage.getItem(LOCAL_KEY));
  },
  async create(data) {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY));
    const newStation = { id: Date.now(), ...data };
    all.push(newStation);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    return newStation;
  },
  async update(id, payload) {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY));
    const updated = all.map((s) => (s.id === id ? { ...s, ...payload } : s));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return true;
  },
  async remove(id) {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY));
    const filtered = all.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    return true;
  },
  async getConnectors(stationId) {
    const all = JSON.parse(localStorage.getItem(LOCAL_CONNECTORS));
    return all[stationId] || [];
  },
  async saveConnectors(stationId, connectors) {
    const all = JSON.parse(localStorage.getItem(LOCAL_CONNECTORS));
    all[stationId] = connectors;
    localStorage.setItem(LOCAL_CONNECTORS, JSON.stringify(all));
  },
  async getPricing(stationId) {
    const all = JSON.parse(localStorage.getItem(LOCAL_PRICING));
    return all[stationId] || {
      type: "Fast",
      price_per_kwh: 0,
      peak_hours: "",
    };
  },
  async savePricing(stationId, pricing) {
    const all = JSON.parse(localStorage.getItem(LOCAL_PRICING));
    all[stationId] = pricing;
    localStorage.setItem(LOCAL_PRICING, JSON.stringify(all));
  },
};

export default function StationManagement() {
  const { getForecastByStation, forecastByStation } = useAnalytics();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  // Bộ sạc
  const [connectorsModal, setConnectorsModal] = useState(null);
  const [connectors, setConnectors] = useState([]);

  // Giá
  const [pricingModal, setPricingModal] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [aiStatsCount, setAiStatsCount] = useState(0);

  const statuses = useMemo(
    () => [
      { value: "active", label: "Hoạt động" },
      { value: "maintenance", label: "Bảo trì" },
      { value: "offline", label: "Ngoại tuyến" },
    ],
    []
  );

  const loadStations = async () => {
    setLoading(true);
    const data = await stationService.getAll();
    setStations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
  }, []);

  const loadAiStats = async () => {
    try {
      const res = await getForecastByStation();
      const data = res?.data ?? forecastByStation ?? [];
      setAiStatsCount(Array.isArray(data) ? data.length : 0);
      showToast("🤖 Đã tải thống kê AI theo trạm");
    } catch {
      setAiStatsCount(0);
    }
  };

  const showToast = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  // 💾 Save trạm
  const handleSave = async (e) => {
    e.preventDefault();
    const code = e.target.code.value.trim();
    const name = e.target.name.value.trim();
    const status = e.target.status.value;

    if (!code || !name) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (editRow) {
      await stationService.update(editRow.id, { name, status });
      showToast("✏️ Đã cập nhật trạm!");
    } else {
      await stationService.create({ code, name, status });
      showToast("✅ Đã tạo trạm mới!");
    }
    await loadStations();
    setOpen(false);
    setEditRow(null);
    setError("");
  };

  const handleDelete = async () => {
    await stationService.remove(deleteRow.id);
    await loadStations();
    setDeleteRow(null);
    showToast("🗑️ Đã xóa trạm!");
  };

  // 🔌 Modal Bộ sạc
  const handleOpenConnectors = async (station) => {
    const data = await stationService.getConnectors(station.id);
    setConnectors(data);
    setConnectorsModal(station);
  };

  const handleAddConnector = () => {
    setConnectors([
      ...connectors,
      {
        connector_id: Date.now(),
        type: "",
        power_kw: "",
        available: true,
      },
    ]);
  };

  const handleSaveConnectors = async () => {
    await stationService.saveConnectors(connectorsModal.id, connectors);
    showToast("💾 Đã lưu danh sách bộ sạc!");
    setConnectorsModal(null);
  };

  const handleRemoveConnector = (id) => {
    setConnectors(connectors.filter((c) => c.connector_id !== id));
  };

  // 💰 Modal Giá
  const handleOpenPricing = async (station) => {
    const data = await stationService.getPricing(station.id);
    setPricing(data);
    setPricingModal(station);
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    const newPricing = {
      type: e.target.type.value.trim(),
      price_per_kwh: parseInt(e.target.price_per_kwh.value || 0),
      peak_hours: e.target.peak_hours.value.trim(),
    };
    await stationService.savePricing(pricingModal.id, newPricing);
    showToast("💾 Đã lưu giá sạc!");
    setPricingModal(null);
  };

  const filteredRows =
    filter === "all" ? stations : stations.filter((r) => r.status === filter);

  return (
    <div className="space-y-6 relative">
      {statusMsg && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">
          {statusMsg}
        </div>
      )}

      <PageHeader title="Quản lý trạm sạc" subtitle="Theo dõi trạng thái trạm" />

      <Section
        title="Danh sách trạm sạc"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="offline">Ngoại tuyến</option>
            </select>
            <button
              onClick={() => {
                setOpen(true);
                setEditRow(null);
                setError("");
              }}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
            >
              + Tạo trạm
            </button>
            <button
              onClick={loadStations}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            >
              ↻ Làm mới
            </button>
            <button
              onClick={loadAiStats}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
            >
              🤖 Thống kê AI ({aiStatsCount})
            </button>
          </div>
        }
      >
        {loading && <p>Đang tải...</p>}
        {!loading && filteredRows.length === 0 && <p>📭 Không có dữ liệu.</p>}
        {!loading && filteredRows.length > 0 && (
          <Table
            columns={[
              { key: "code", title: "Mã trạm", dataIndex: "code" },
              { key: "name", title: "Tên trạm", dataIndex: "name" },
              {
                key: "status",
                title: "Trạng thái",
                render: (_, r) => (
                  <span
                    className={
                      r.status === "active"
                        ? "text-green-600"
                        : r.status === "maintenance"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }
                  >
                    {r.status}
                  </span>
                ),
              },
              {
                key: "actions",
                title: "Hành động",
                render: (_, r) => (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setEditRow(r);
                        setOpen(true);
                      }}
                      className="border border-gray-300 px-2 py-1 text-sm rounded"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => setDeleteRow(r)}
                      className="border border-red-400 px-2 py-1 text-sm text-red-700 rounded"
                    >
                      🗑️ Xóa
                    </button>
                    <button
                      onClick={() => handleOpenConnectors(r)}
                      className="border border-indigo-400 px-2 py-1 text-sm text-indigo-700 rounded"
                    >
                      🔌 Bộ sạc
                    </button>
                    <button
                      onClick={() => handleOpenPricing(r)}
                      className="border border-green-400 px-2 py-1 text-sm text-green-700 rounded"
                    >
                      💰 Giá
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredRows}
          />
        )}
      </Section>

      {/* 🧩 Modal Bộ sạc (có thể chỉnh sửa) */}
      {connectorsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-3">
              🔌 Bộ sạc của {connectorsModal.name}
            </h2>
            <div className="space-y-2 mb-3">
              {connectors.map((c) => (
                <div
                  key={c.connector_id}
                  className="flex gap-2 border p-2 rounded items-center text-sm"
                >
                  <input
                    value={c.type}
                    placeholder="Loại (VD: Type 2)"
                    onChange={(e) =>
                      setConnectors((prev) =>
                        prev.map((x) =>
                          x.connector_id === c.connector_id
                            ? { ...x, type: e.target.value }
                            : x
                        )
                      )
                    }
                    className="border p-1 rounded w-1/4"
                  />
                  <input
                    value={c.power_kw}
                    placeholder="Công suất kW"
                    onChange={(e) =>
                      setConnectors((prev) =>
                        prev.map((x) =>
                          x.connector_id === c.connector_id
                            ? { ...x, power_kw: e.target.value }
                            : x
                        )
                      )
                    }
                    className="border p-1 rounded w-1/4"
                  />
                  <select
                    value={c.available ? "true" : "false"}
                    onChange={(e) =>
                      setConnectors((prev) =>
                        prev.map((x) =>
                          x.connector_id === c.connector_id
                            ? { ...x, available: e.target.value === "true" }
                            : x
                        )
                      )
                    }
                    className="border p-1 rounded w-1/4"
                  >
                    <option value="true">Sẵn sàng</option>
                    <option value="false">Bận</option>
                  </select>
                  <button
                    onClick={() => handleRemoveConnector(c.connector_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleAddConnector}
                className="bg-blue-600 text-white px-3 py-1.5 rounded"
              >
                + Thêm bộ sạc
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setConnectorsModal(null)}
                  className="border border-gray-300 px-3 py-1.5 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveConnectors}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧩 Modal Giá (có thể chỉnh sửa) */}
      {pricingModal && pricing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">
              💰 Giá sạc - {pricingModal.name}
            </h2>
            <form onSubmit={handleSavePricing} className="space-y-3">
              <div>
                <label className="text-sm">Loại trạm</label>
                <input
                  name="type"
                  defaultValue={pricing.type}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm">Giá (VND/kWh)</label>
                <input
                  name="price_per_kwh"
                  type="number"
                  defaultValue={pricing.price_per_kwh}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm">Giờ cao điểm</label>
                <input
                  name="peak_hours"
                  defaultValue={pricing.peak_hours}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPricingModal(null)}
                  className="border border-gray-300 px-3 py-1.5 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
