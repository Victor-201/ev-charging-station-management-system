import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

// Trang quản lý gói subscription / pricing
// - Lấy danh sách plan từ API
// - Cho phép thêm / sửa đơn giản
export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null); // {id, name, price, currency, features}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      // GET /api/v1/payments/plans
      const res = await apiClient.get("/api/v1/payments/plans");
      setPlans(res.data || []);
    } catch (err) {
      console.error("[SubscriptionPlans] load error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách gói."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const startCreate = () => {
    setEditing({
      id: null,
      name: "",
      price: 0,
      currency: "VND",
      description: "",
    });
  };

  const startEdit = (plan) => {
    setEditing({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency || "VND",
      description: plan.description || "",
    });
  };

  const savePlan = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      if (editing.id) {
        // PUT /api/v1/payments/plans/{id}
        await apiClient.put(`/api/v1/payments/plans/${editing.id}`, editing);
      } else {
        // POST /api/v1/payments/plans
        await apiClient.post("/api/v1/payments/plans", editing);
      }
      setEditing(null);
      await loadPlans();
    } catch (err) {
      console.error("save plan error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lưu gói subscription."
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm("Xoá gói này? Thao tác sẽ ghi xuống DB.")) return;
    try {
      // DELETE /api/v1/payments/plans/{id}
      await apiClient.delete(`/api/v1/payments/plans/${id}`);
      await loadPlans();
    } catch (err) {
      console.error("delete plan error:", err);
      alert("Không thể xoá gói.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Subscription Plans"
          subtitle="Tất cả gói giá / subscription lấy từ API payments, không phải dữ liệu tĩnh."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Section title="Danh sách gói">
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
              const plan = plans[index];
              return (
                <tr
                  key={plan.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-xs text-slate-500">{plan.id}</td>
                  <td className="px-3 py-2 text-sm font-semibold">
                    {plan.name}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {plan.price?.toLocaleString("vi-VN")}{" "}
                    {plan.currency || "VND"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {plan.description}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => startEdit(plan)}
                      className="text-xs px-2 py-1 rounded border mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              );
            }}
          />
        </Section>

        {editing && (
          <Section title={editing.id ? "Sửa gói" : "Tạo gói mới"}>
            <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Tên gói</div>
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Giá</div>
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
                <div className="text-xs text-slate-500 mb-1">Đơn vị tiền</div>
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
                <div className="text-xs text-slate-500 mb-1">Mô tả</div>
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
