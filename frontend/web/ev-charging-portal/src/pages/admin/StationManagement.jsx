import { useState, useEffect, useMemo } from "react";
import { useStation } from "@/hooks/useStation";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import PageHeader from "@/components/admin/PageHeader";
// Bỏ dữ liệu mô phỏng: dùng hook `useStation` (API thật). Không seed localStorage.

const OVERLAY_KEY_STATIONS = "evcs_overlay_stations";
const getOverlayStations = () => JSON.parse(localStorage.getItem(OVERLAY_KEY_STATIONS) || "[]");
const setOverlayStations = (arr) => localStorage.setItem(OVERLAY_KEY_STATIONS, JSON.stringify(arr));

export default function StationManagement() {
  const {
    getAll: fetchStations,
    create: createStation,
    update: updateStation,
    remove: removeStation,
    loading: apiLoading,
  } = useStation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  // Đã bỏ Bộ sạc và Giá

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
    try {
      const res = await fetchStations();
      const data = res?.data ?? [];
      const overlay = getOverlayStations();
      const base = Array.isArray(data) ? data : [];
      const merged = [...base];
      overlay.forEach((o) => {
        if (!merged.some((b) => (b.code ?? b.station_code) === (o.code ?? o.station_code))) {
          merged.push(o);
        }
      });
      setStations(merged);
    } catch (err) {
      const overlay = getOverlayStations();
      setStations(overlay);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  // Đã bỏ Thống kê AI

  const showToast = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  // 💾 Save trạm (tối ưu phản hồi nhanh)
  const handleSave = async (e) => {
    e.preventDefault();
    const code = e.target.code.value.trim();
    const name = e.target.name.value.trim();
    const status = e.target.status.value;

    if (!code || !name) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // Duplicate code check when creating
    if (!editRow) {
      const all = getOverlayStations();
      if (all.some((s) => String(s.code).toLowerCase() === code.toLowerCase())) {
        setError("⚠️ Mã trạm đã tồn tại (overlay)");
        return;
      }
    }

    const targetId = editRow?.id ?? editRow?.station_id;
    if (editRow) {
      // Cập nhật ngay trên UI + overlay
      setStations((prev) => prev.map((s) => (s.code === editRow.code ? { ...s, name, status } : s)));
      const overlay = getOverlayStations();
      setOverlayStations(overlay.map((s) => (s.code === editRow.code ? { ...s, name, status } : s)));
      // Gọi API ở nền
      updateStation(targetId, { name, status, code: editRow.code })
        .then(() => showToast("✏️ Đã cập nhật trạm!"))
        .catch(() => showToast("✏️ Đã cập nhật trạm (bản nháp)"))
        .finally(() => {
          // làm tươi nền để đồng bộ id nếu cần
          loadStations();
        });
    } else {
      // Tạo nhanh (overlay + UI), gọi API nền
      const created = { id: Date.now(), code, name, status };
      const overlay = getOverlayStations();
      setOverlayStations([...overlay, created]);
      setStations((prev) => [...prev, created]);
      createStation({ code, name, status })
        .then((res) => {
          const b = res?.data;
          if (b?.code) {
            // đồng bộ lại nếu backend trả id khác
            const current = getOverlayStations();
            const synced = current.map((s) => (s.code === b.code ? {
              id: b.id ?? b.station_id ?? s.id,
              code: b.code,
              name: b.name ?? name,
              status: b.status ?? status,
            } : s));
            setOverlayStations(synced);
            loadStations();
          }
          showToast("✅ Đã tạo trạm mới!");
        })
        .catch(() => showToast("✅ Đã tạo trạm (bản nháp)"));
    }
    setOpen(false);
    setEditRow(null);
    setError("");
  };

  const handleDelete = async (row) => {
    const targetId = row?.id ?? row?.station_id;
    // Xóa ngay tại chỗ
    setStations((prev) => prev.filter((s) => s.code !== row.code));
    const overlay = getOverlayStations();
    setOverlayStations(overlay.filter((s) => s.code !== row.code));
    // Gọi API nền (nếu có id)
    if (targetId) {
      removeStation(targetId).catch(() => {/* bỏ qua lỗi */});
    }
    setDeleteRow(null);
    showToast("🗑️ Đã xóa trạm!");
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
            {/* Đã bỏ nút Làm mới và Thống kê AI */}
          </div>
        }
      >
        {(loading || apiLoading) && <p>Đang tải...</p>}
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
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="border border-red-400 px-2 py-1 text-sm text-red-700 rounded"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredRows}
          />
        )}
      </Section>
      {/* Modal tạo / sửa trạm */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editRow ? "Chỉnh sửa trạm" : "Tạo trạm mới"}
            </h2>
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Mã trạm *</label>
                <input
                  name="code"
                  defaultValue={editRow?.code || ""}
                  disabled={!!editRow}
                  className="w-full border rounded px-3 py-1.5 mt-1"
                  placeholder="VD: ST-01"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tên trạm *</label>
                <input
                  name="name"
                  defaultValue={editRow?.name || ""}
                  className="w-full border rounded px-3 py-1.5 mt-1"
                  placeholder="VD: Trạm trung tâm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Trạng thái *</label>
                <select
                  name="status"
                  defaultValue={editRow?.status || "active"}
                  className="w-full border rounded px-3 py-1.5 mt-1"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setEditRow(null); setError(""); }}
                  className="border border-gray-300 px-4 py-1.5 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded hover:bg-emerald-700"
                >
                  {editRow ? "Cập nhật" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
