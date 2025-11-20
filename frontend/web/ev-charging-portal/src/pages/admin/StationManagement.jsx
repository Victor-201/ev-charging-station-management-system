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

  // Form lưu toàn bộ dữ liệu có thể chỉnh sửa
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    region: "",
    status: "",
    lat: "",
    lng: "",
  });

  // Load danh sách trạm
  useEffect(() => {
    getAll({ lat: 10.9, lng: 106.8, radius: 50 });
  }, [getAll]);

  // Khi chọn trạm → load chi tiết + connectors
  useEffect(() => {
    if (!selectedId) return;
    getById(selectedId);
    getConnectors(selectedId);
  }, [selectedId, getById, getConnectors]);

  // Đồng bộ form với dữ liệu trạm
  useEffect(() => {
    if (!currentStation) return;
    setForm({
      name: currentStation.name || "",
      address: currentStation.address || "",
      city: currentStation.city || "",
      region: currentStation.region || "",
      status: currentStation.status || "active",
      lat: currentStation.lat || "",
      lng: currentStation.lng || "",
    });
  }, [currentStation]);

  const handleSelectStation = (id) => setSelectedId(id);

  const handleSave = async () => {
    const id = currentStation?.id || currentStation?.station_id;
    if (!id) return;

    await update(id, {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
    });
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

  // Chuẩn hoá connectors
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
      <PageHeader
        title="Quản lý trạm sạc"
        subtitle="Xem, chỉnh sửa và theo dõi tình trạng trạm"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong> {error.message || String(error)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --------------------- */}
        {/* DANH SÁCH TRẠM */}
        {/* --------------------- */}
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
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                  >
                    <div className="font-semibold text-gray-100">{st.name}</div>
                    <div className="text-xs text-gray-300 truncate">Địa chỉ: {st.address}</div>
                    <div className="text-xs text-gray-300 truncate">Thành phố: {st.city}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {st.status === "active" ? "Hoạt động" : "Bảo trì"} • {st.region}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* --------------------- */}
        {/* CHI TIẾT TRẠM */}
        {/* --------------------- */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Chi tiết trạm">
            {!currentStation ? (
              <div className="text-sm text-gray-500">Chọn trạm để xem chi tiết.</div>
            ) : (
              <div className="space-y-4 text-sm">

                {/* FORM CHỈNH SỬA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <DetailInput
                    label="Tên trạm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />

                  <DetailInput
                    label="Địa chỉ"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />

                  <DetailInput
                    label="Thành phố"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />

                  <DetailInput
                    label="Khu vực"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />

                  {/* Status */}
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">Trạng thái</div>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Ngừng hoạt động</option>
                    </select>
                  </div>

                  <DetailInput
                    label="Vĩ độ (Lat)"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  />

                  <DetailInput
                    label="Kinh độ (Lng)"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  />

                </div>

                {/* GOOGLE MAP */}
                <div>
                  <div className="text-xs text-gray-800 mb-2 font-semibold">
                    Vị trí trên bản đồ
                  </div>
                  <div className="rounded-lg overflow-hidden border h-64">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${currentStation.lat},${currentStation.lng}&z=15&output=embed`}
                    ></iframe>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap gap-3 pt-3 border-t">
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Lưu thay đổi
                  </button>

                  <button
                    onClick={handleToggleMaintenance}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    {currentStation.maintenance ? "Bỏ bảo trì" : "Đặt bảo trì"}
                  </button>

                  <button
                    onClick={handleReportIssue}
                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Báo cáo sự cố
                  </button>

                  <button
                    onClick={handleDeleteStation}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-800"
                  >
                    Xoá trạm
                  </button>
                </div>

              </div>
            )}
          </Section>

          {/* --------------------- */}
          {/* DANH SÁCH CONNECTOR */}
          {/* --------------------- */}
          <Section title="Danh sách trụ / Connector">
            {!currentStation ? (
              <div className="text-sm text-gray-500">Chọn trạm để xem connector.</div>
            ) : connectorList.length === 0 ? (
              <div className="text-sm text-gray-500">Không có dữ liệu.</div>
            ) : (
              <Table
                columns={[
                  { key: "point_id", title: "ID", dataIndex: "point_id" },
                  { key: "type", title: "Loại", dataIndex: "type" },
                  { key: "max_power_kw", title: "Công suất (kW)", dataIndex: "max_power_kw" },
                  {
                    key: "status",
                    title: "Trạng thái",
                    dataIndex: "status",
                    render: (value) => {
                      const color =
                        value === "available"
                          ? "text-green-700 font-semibold"
                          : value === "unavailable"
                          ? "text-red-700 font-semibold"
                          : "text-amber-700 font-semibold";

                      return <span className={color}>{value}</span>;
                    },
                  },
                ]}
                data={connectorList}
              />
            )}
          </Section>
        </div>

      </div>
    </div>
  );
}

/* --------------------- */
/* COMPONENT PHỤ */
/* --------------------- */

function DetailInput({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs text-gray-700 font-medium mb-1">{label}</div>
      <input
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
      />
    </div>
  );
}
