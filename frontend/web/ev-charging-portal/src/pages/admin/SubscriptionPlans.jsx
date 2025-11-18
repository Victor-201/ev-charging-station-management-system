import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { usePayment } from "@/hooks/usePayment";

/**
 * Subscription Plans (Pricing Plans)
 * API thật lấy từ payment-service:
 *  GET    /api/v1/payments/plans
 *  POST   /api/v1/payments/plans
 *  PUT    /api/v1/payments/plans/:id
 *  DELETE /api/v1/payments/plans/:id
 */
export default function SubscriptionPlans() {
  const {
    loadingPayments,
    error,
    setError,

    // Actions
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
  } = usePayment();

  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null); // { id, name, price, currency, description }
  const [saving, setSaving] = useState(false);

  // ================================
  // LOAD ALL PLANS
  // ================================
  const loadPlans = async () => {
    setError(null);
    const res = await getPlans();
    if (res.success) {
      setPlans(res.data ?? []);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // ================================
  // START CREATE
  // ================================
  const startCreate = () => {
    setEditing({
      id: null,
      name: "",
      price: 0,
      currency: "VND",
      description: "",
    });
  };

  // ================================
  // START EDIT
  // ================================
  const startEdit = (p) => {
    setEditing({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      currency: p.currency || "VND",
      description: p.description || "",
    });
  };

  // ================================
  // SAVE PLAN (POST / PUT)
  // ================================
  const savePlan = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);

    let res;
    if (editing.id) {
      res = await updatePlan(editing.id, editing);
    } else {
      res = await createPlan(editing);
    }

    setSaving(false);

    if (!res.success) {
      return;
    }

    setEditing(null);
    await loadPlans();
  };

  // ================================
  // DELETE PLAN
  // ================================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá gói này?")) return;

    const res = await deletePlan(id);
    if (res.success) {
      await loadPlans();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Subscription Plans"
          subtitle="Quản lý bảng giá từ payment-service (API thật)."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {JSON.stringify(error)}
          </div>
        )}

        {/* Danh sách gói */}
        <Section title="Danh sách gói subscription">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-slate-500">
              {(plans || []).length} gói đang hoạt động
            </div>
            <button
              onClick={startCreate}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
            >
              + Tạo gói mới
            </button>
          </div>

          {loadingPayments ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <Table
              columns={["ID", "Tên gói", "Giá", "Mô tả", ""]}
              rows={(plans || []).map((p) => [
                p.id,
                p.name,
                `${p.price?.toLocaleString("vi-VN")} ${p.currency || "VND"}`,
                p.description || "",
                "actions",
              ])}
              renderRow={(row, index) => {
                const p = plans[index];
                return (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {p.id}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {p.price?.toLocaleString("vi-VN")} {p.currency}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.description}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs px-2 py-1 rounded border mr-2"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              }}
            />
          )}
        </Section>

        {/* FORM EDIT / CREATE */}
        {editing && (
          <Section title={editing.id ? "Sửa gói" : "Tạo gói mới"}>
            <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Tên gói
                </label>
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Giá
                </label>
                <input
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) =>
                    setEditing((p) => ({
                      ...p,
                      price: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Đơn vị tiền
                </label>
                <select
                  value={editing.currency}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, currency: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">
                  Mô tả
                </label>
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

              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  Huỷ
                </button>

                <button
                  onClick={savePlan}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu gói"}
                </button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
