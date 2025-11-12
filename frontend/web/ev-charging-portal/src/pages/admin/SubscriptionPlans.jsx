// SubscriptionPlans.jsx — CRUD + Edit cho Gói, Coupon, Thuê bao (localStorage)
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";

const STORAGE_KEY_PLANS = "evcs_mock_plans";
const STORAGE_KEY_COUPONS = "evcs_mock_coupons";
const STORAGE_KEY_SUBS = "evcs_mock_subscriptions";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // modal: {open, type: 'plan'|'coupon'|'subscription', mode: 'create'|'edit'}
  const [modal, setModal] = useState({ open: false, type: "", mode: "create" });

  // forms
  const [planForm, setPlanForm] = useState({ id: null, name: "", price: "", featuresText: "" });
  const [couponForm, setCouponForm] = useState({ id: null, code: "", discount: "", expiresAt: "" });
  const [subForm, setSubForm] = useState({ id: null, name: "", price: "", active: true });

  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const showToast = (m) => {
    setStatusMsg(m);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const formatVND = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number(value || 0)
    );

  const loadData = () => {
    setPlans(JSON.parse(localStorage.getItem(STORAGE_KEY_PLANS) || "[]"));
    setCoupons(JSON.parse(localStorage.getItem(STORAGE_KEY_COUPONS) || "[]"));
    setSubscriptions(JSON.parse(localStorage.getItem(STORAGE_KEY_SUBS) || "[]"));
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = () => {
    loadData();
    showToast("🔄 Đã làm mới dữ liệu");
  };

  /* ----------------------------- PLANS ----------------------------- */
  const openCreatePlan = () => {
    setError("");
    setPlanForm({ id: null, name: "", price: "", featuresText: "" });
    setModal({ open: true, type: "plan", mode: "create" });
  };

  const openEditPlan = (p) => {
    setError("");
    setPlanForm({
      id: p.id,
      name: p.name,
      price: String(p.price ?? ""),
      featuresText: (p.features || []).join("\n"),
    });
    setModal({ open: true, type: "plan", mode: "edit" });
  };

  const savePlan = (e) => {
    e.preventDefault();
    const name = planForm.name.trim();
    const price = planForm.price.trim();
    const features = planForm.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    if (!name || !price) return setError("⚠️ Vui lòng nhập tên gói và giá!");

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY_PLANS) || "[]");
    let updated;

    if (modal.mode === "edit" && planForm.id != null) {
      updated = store.map((x) =>
        x.id === planForm.id ? { ...x, name, price: parseInt(price, 10), features } : x
      );
      showToast(`✏️ Đã cập nhật gói ${name}`);
    } else {
      const newPlan = { id: Date.now(), name, price: parseInt(price, 10), features };
      updated = [...store, newPlan];
      showToast(`✅ Đã tạo gói ${name}`);
    }
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updated));
    setPlans(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deletePlan = (id) => {
    const updated = plans.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updated));
    setPlans(updated);
    showToast("🗑️ Đã xóa gói");
  };

  /* ---------------------------- COUPONS ---------------------------- */
  const openCreateCoupon = () => {
    setError("");
    setCouponForm({ id: null, code: "", discount: "", expiresAt: "" });
    setModal({ open: true, type: "coupon", mode: "create" });
  };

  const openEditCoupon = (c) => {
    setError("");
    setCouponForm({
      id: c.id,
      code: c.code,
      discount: String(c.discount ?? ""),
      expiresAt: c.expiresAt || "",
    });
    setModal({ open: true, type: "coupon", mode: "edit" });
  };

  const saveCoupon = (e) => {
    e.preventDefault();
    const { id, code, discount, expiresAt } = couponForm;
    if (!code.trim() || !discount || !expiresAt)
      return setError("⚠️ Điền đủ Mã / Giảm / Hết hạn!");

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY_COUPONS) || "[]");
    let updated;

    if (modal.mode === "edit" && id != null) {
      updated = store.map((x) =>
        x.id === id ? { ...x, code: code.trim(), discount: parseInt(discount, 10), expiresAt } : x
      );
      showToast(`✏️ Đã cập nhật mã ${code}`);
    } else {
      const newCoupon = {
        id: Date.now(),
        code: code.trim(),
        discount: parseInt(discount, 10),
        expiresAt,
      };
      updated = [...store, newCoupon];
      showToast(`🎉 Đã tạo mã ${code} (-${discount}%)`);
    }
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(updated));
    setCoupons(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deleteCoupon = (id) => {
    const updated = coupons.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(updated));
    setCoupons(updated);
    showToast("🗑️ Đã xóa mã giảm giá");
  };

  /* --------------------------- SUBSCRIPTIONS --------------------------- */
  const openCreateSub = () => {
    setError("");
    setSubForm({ id: null, name: "", price: "", active: true });
    setModal({ open: true, type: "subscription", mode: "create" });
  };

  const openEditSub = (s) => {
    setError("");
    setSubForm({
      id: s.id,
      name: s.name,
      price: String(s.price ?? ""),
      active: !!s.active,
    });
    setModal({ open: true, type: "subscription", mode: "edit" });
  };

  const saveSub = (e) => {
    e.preventDefault();
    const { id, name, price, active } = subForm;
    if (!name.trim() || !price) return setError("⚠️ Điền đủ Tên gói và Giá!");

    const store = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBS) || "[]");
    let updated;

    if (modal.mode === "edit" && id != null) {
      updated = store.map((x) =>
        x.id === id ? { ...x, name: name.trim(), price: parseInt(price, 10), active } : x
      );
      showToast(`✏️ Đã cập nhật thuê bao ${name}`);
    } else {
      const newSub = {
        id: Date.now(),
        name: name.trim(),
        price: parseInt(price, 10),
        active,
      };
      updated = [...store, newSub];
      showToast(`✅ Đã thêm thuê bao ${name}`);
    }
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(updated));
    setSubscriptions(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deleteSub = (id) => {
    const updated = subscriptions.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(updated));
    setSubscriptions(updated);
    showToast("🚫 Đã hủy thuê bao");
  };

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="space-y-6 relative">
      {statusMsg && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">
          {statusMsg}
        </div>
      )}

      <PageHeader
        title="Gói thuê bao"
        subtitle="Quản lý gói, mã giảm giá và thuê bao người dùng (localStorage)"
      />

      {/* ===== GÓI THUÊ BAO ===== */}
      <Section
        title="Danh sách gói thuê bao"
        actions={
          <div className="flex gap-2">
            <button
              onClick={openCreatePlan}
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-white"
            >
              + Tạo gói
            </button>
            <button
              onClick={openCreateCoupon}
              className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-white"
            >
              🎟️ Tạo mã giảm giá
            </button>
            <button
              onClick={openCreateSub}
              className="rounded-md bg-blue-700 hover:bg-blue-800 px-4 py-1.5 text-white"
            >
              + Tạo thuê bao
            </button>
            <button
              onClick={refresh}
              className="rounded-md bg-sky-600 hover:bg-sky-700 px-4 py-1.5 text-white"
            >
              ↻ Làm mới
            </button>
          </div>
        }
      >
        {plans.length === 0 ? (
          <p className="text-sm italic text-gray-500">📭 Không có gói thuê bao nào.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mt-3">
            {plans.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 hover:shadow-md bg-white">
                <div className="text-lg font-semibold text-emerald-700">{p.name}</div>
                <div className="my-2 text-2xl font-bold text-amber-600">
                  {formatVND(p.price)} / tháng
                </div>
                <ul className="text-sm list-disc pl-5 mb-3">
                  {(p.features || []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditPlan(p)}
                    className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => deletePlan(p.id)}
                    className="border border-red-400 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ===== MÃ GIẢM GIÁ ===== */}
      <Section title="Mã giảm giá">
        {coupons.length === 0 ? (
          <p className="text-sm italic text-gray-500">📭 Chưa có mã giảm giá nào.</p>
        ) : (
          <table className="w-full text-sm border mt-3">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-center">Giảm</th>
                <th className="px-3 py-2 text-center">Hết hạn</th>
                <th className="px-3 py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.code}</td>
                  <td className="px-3 py-2 text-center">-{c.discount}%</td>
                  <td className="px-3 py-2 text-center">{c.expiresAt}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditCoupon(c)}
                        className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="border border-red-400 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ===== THUÊ BAO NGƯỜI DÙNG ===== */}
      <Section title="Thuê bao người dùng">
        {subscriptions.length === 0 ? (
          <p className="text-sm italic text-gray-500">📭 Chưa có thuê bao người dùng nào.</p>
        ) : (
          <table className="w-full text-sm border mt-3">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Tên gói</th>
                <th className="px-3 py-2 text-center">Giá</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-center">{formatVND(s.price)}</td>
                  <td className="px-3 py-2 text-center">
                    {s.active ? "✅ Hoạt động" : "❌ Hết hạn"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditSub(s)}
                        className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => deleteSub(s.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Hủy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ================== MODALS ================== */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg">
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
                {error}
              </div>
            )}

            {/* PLAN MODAL */}
            {modal.type === "plan" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit" ? "Chỉnh sửa gói" : "Tạo gói mới"}
                </h2>
                <form onSubmit={savePlan} className="space-y-3">
                  <input
                    placeholder="Tên gói"
                    className="w-full border p-2 rounded"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Giá (VNĐ)"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                  <textarea
                    placeholder="Mỗi dòng 1 quyền lợi..."
                    rows={4}
                    className="w-full border p-2 rounded"
                    value={planForm.featuresText}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, featuresText: e.target.value })
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ open: false, type: "", mode: "create" })}
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-emerald-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit" ? "Cập nhật" : "Lưu"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* COUPON MODAL */}
            {modal.type === "coupon" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit" ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                </h2>
                <form onSubmit={saveCoupon} className="space-y-3">
                  <input
                    placeholder="Mã (VD: KHUYENMAI2025)"
                    className="w-full border p-2 rounded"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, code: e.target.value })
                    }
                  />
                  <input
                    placeholder="Phần trăm giảm"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={couponForm.discount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={couponForm.expiresAt}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, expiresAt: e.target.value })
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ open: false, type: "", mode: "create" })}
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit" ? "Cập nhật" : "Lưu"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* SUBSCRIPTION MODAL */}
            {modal.type === "subscription" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit" ? "Chỉnh sửa thuê bao" : "Tạo thuê bao người dùng"}
                </h2>
                <form onSubmit={saveSub} className="space-y-3">
                  <input
                    placeholder="Tên gói"
                    className="w-full border p-2 rounded"
                    value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Giá (VNĐ)"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={subForm.price}
                    onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="active"
                      type="checkbox"
                      checked={subForm.active}
                      onChange={(e) => setSubForm({ ...subForm, active: e.target.checked })}
                    />
                    <label htmlFor="active" className="text-sm">
                      Hoạt động
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ open: false, type: "", mode: "create" })}
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit" ? "Cập nhật" : "Lưu"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
