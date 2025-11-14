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
  const [modal, setModal] = useState({
    open: false,
    type: "",
    mode: "create",
  });

  const [planForm, setPlanForm] = useState({
    id: null,
    name: "",
    description: "",
    type: "basic",
    price: "",
    duration_days: "",
    featuresText: "",
  });
  const [couponForm, setCouponForm] = useState({
    id: null,
    code: "",
    discount: "",
    expiresAt: "",
  });
  const [subForm, setSubForm] = useState({
    id: null,
    name: "",
    price: "",
    status: "active",
    start_date: "",
    end_date: "",
  });

  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const showToast = (m) => {
    setStatusMsg(m);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const formatVND = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(value || 0));

  const loadData = () => {
    setPlans(
      JSON.parse(
        localStorage.getItem(STORAGE_KEY_PLANS) || "[]"
      )
    );
    setCoupons(
      JSON.parse(
        localStorage.getItem(STORAGE_KEY_COUPONS) || "[]"
      )
    );
    setSubscriptions(
      JSON.parse(
        localStorage.getItem(STORAGE_KEY_SUBS) || "[]"
      )
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreatePlan = () => {
    setError("");
    setPlanForm({
      id: null,
      name: "",
      description: "",
      type: "basic",
      price: "",
      duration_days: "",
      featuresText: "",
    });
    setModal({ open: true, type: "plan", mode: "create" });
  };

  const openEditPlan = (p) => {
    setError("");
    setPlanForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      type: p.type || "basic",
      price: String(p.price ?? ""),
      duration_days: String(p.duration_days ?? ""),
      featuresText: (p.features || []).join("\n"),
    });
    setModal({ open: true, type: "plan", mode: "edit" });
  };

  const savePlan = (e) => {
    e.preventDefault();
    const name = planForm.name.trim();
    const description = planForm.description.trim();
    const type = planForm.type;
    const price = planForm.price.trim();
    const duration_days = planForm.duration_days.trim();
    const features = planForm.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    if (!name || !price) {
      setError("⚠️ Vui lòng nhập tên gói và giá!");
      return;
    }

    const store = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PLANS) || "[]"
    );
    let updated;

    if (modal.mode === "edit" && planForm.id != null) {
      updated = store.map((x) =>
        x.id === planForm.id
          ? {
              ...x,
              name,
              description,
              type,
              price: parseInt(price, 10),
              duration_days: duration_days
                ? parseInt(duration_days, 10)
                : undefined,
              features,
            }
          : x
      );
      showToast(`✏️ Đã cập nhật gói ${name}`);
    } else {
      const newPlan = {
        id: Date.now(),
        name,
        description,
        type,
        price: parseInt(price, 10),
        duration_days: duration_days
          ? parseInt(duration_days, 10)
          : undefined,
        features,
      };
      updated = [...store, newPlan];
      showToast(`✅ Đã tạo gói ${name}`);
    }
    localStorage.setItem(
      STORAGE_KEY_PLANS,
      JSON.stringify(updated)
    );
    setPlans(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deletePlan = (id) => {
    const updated = plans.filter((x) => x.id !== id);
    localStorage.setItem(
      STORAGE_KEY_PLANS,
      JSON.stringify(updated)
    );
    setPlans(updated);
    showToast("🗑️ Đã xóa gói");
  };

  const openCreateCoupon = () => {
    setError("");
    setCouponForm({
      id: null,
      code: "",
      discount: "",
      expiresAt: "",
    });
    setModal({
      open: true,
      type: "coupon",
      mode: "create",
    });
  };

  const openEditCoupon = (c) => {
    setError("");
    setCouponForm({
      id: c.id,
      code: c.code,
      discount: String(c.discount ?? ""),
      expiresAt: c.expiresAt || "",
    });
    setModal({
      open: true,
      type: "coupon",
      mode: "edit",
    });
  };

  const saveCoupon = (e) => {
    e.preventDefault();
    const { id, code, discount, expiresAt } = couponForm;
    if (!code.trim() || !discount || !expiresAt) {
      setError("⚠️ Điền đủ Mã / Giảm / Hết hạn!");
      return;
    }

    const store = JSON.parse(
      localStorage.getItem(STORAGE_KEY_COUPONS) || "[]"
    );
    let updated;

    if (modal.mode === "edit" && id != null) {
      updated = store.map((x) =>
        x.id === id
          ? {
              ...x,
              code: code.trim(),
              discount: parseInt(discount, 10),
              expiresAt,
            }
          : x
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
    localStorage.setItem(
      STORAGE_KEY_COUPONS,
      JSON.stringify(updated)
    );
    setCoupons(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deleteCoupon = (id) => {
    const updated = coupons.filter((x) => x.id !== id);
    localStorage.setItem(
      STORAGE_KEY_COUPONS,
      JSON.stringify(updated)
    );
    setCoupons(updated);
    showToast("🗑️ Đã xóa mã giảm giá");
  };

  const openCreateSub = () => {
    setError("");
    setSubForm({
      id: null,
      name: "",
      price: "",
      status: "active",
      start_date: "",
      end_date: "",
    });
    setModal({
      open: true,
      type: "subscription",
      mode: "create",
    });
  };

  const openEditSub = (s) => {
    setError("");
    setSubForm({
      id: s.id,
      name: s.name,
      price: String(s.price ?? ""),
      status: s.status || "active",
      start_date: s.start_date || "",
      end_date: s.end_date || "",
    });
    setModal({
      open: true,
      type: "subscription",
      mode: "edit",
    });
  };

  const saveSub = (e) => {
    e.preventDefault();
    const { id, name, price, status, start_date, end_date } =
      subForm;
    if (!name.trim() || !price) {
      setError("⚠️ Điền đủ Tên gói và Giá!");
      return;
    }

    const store = JSON.parse(
      localStorage.getItem(STORAGE_KEY_SUBS) || "[]"
    );
    let updated;

    if (modal.mode === "edit" && id != null) {
      updated = store.map((x) =>
        x.id === id
          ? {
              ...x,
              name: name.trim(),
              price: parseInt(price, 10),
              status,
              start_date,
              end_date,
            }
          : x
      );
      showToast(`✏️ Đã cập nhật thuê bao ${name}`);
    } else {
      const newSub = {
        id: Date.now(),
        name: name.trim(),
        price: parseInt(price, 10),
        status,
        start_date,
        end_date,
      };
      updated = [...store, newSub];
      showToast(`✅ Đã thêm thuê bao ${name}`);
    }
    localStorage.setItem(
      STORAGE_KEY_SUBS,
      JSON.stringify(updated)
    );
    setSubscriptions(updated);
    setModal({ open: false, type: "", mode: "create" });
  };

  const deleteSub = (id) => {
    const updated = subscriptions.filter((x) => x.id !== id);
    localStorage.setItem(
      STORAGE_KEY_SUBS,
      JSON.stringify(updated)
    );
    setSubscriptions(updated);
    showToast("🚫 Đã hủy thuê bao");
  };

  return (
    <div className="space-y-6 relative">
      {statusMsg && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">
          {statusMsg}
        </div>
      )}

      <PageHeader
        title="Gói thuê bao"
        subtitle="Quản lý gói, mã giảm giá và thuê bao người dùng"
      />

      <Section
        title="Danh sách gói thuê bao"
        actions={
          <div className="flex gap-2 flex-wrap">
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
          </div>
        }
      >
        {plans.length === 0 ? (
          <p className="text-sm italic text-gray-500">
            📭 Không có gói thuê bao nào.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mt-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-4 hover:shadow-md bg-white"
              >
                <div className="text-lg font-semibold text-emerald-700">
                  {p.name}
                </div>
                <div className="my-2 text-2xl font-bold text-amber-600">
                  {formatVND(p.price)} / tháng
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Loại: {p.type || "basic"} • Thời hạn:{" "}
                  {p.duration_days || "-"} ngày
                </div>
                {p.description && (
                  <div className="text-sm text-gray-700 mb-2">
                    {p.description}
                  </div>
                )}
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

      <Section title="Mã giảm giá">
        {coupons.length === 0 ? (
          <p className="text-sm italic text-gray-500">
            📭 Chưa có mã giảm giá nào.
          </p>
        ) : (
          <table className="w-full text-sm border mt-3">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-center">Giảm</th>
                <th className="px-3 py-2 text-center">
                  Hết hạn
                </th>
                <th className="px-3 py-2 text-center">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.code}</td>
                  <td className="px-3 py-2 text-center">
                    -{c.discount}%
                  </td>
                  <td className="px-3 py-2 text-center">
                    {c.expiresAt}
                  </td>
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

      <Section title="Thuê bao người dùng">
        {subscriptions.length === 0 ? (
          <p className="text-sm italic text-gray-500">
            📭 Chưa có thuê bao người dùng nào.
          </p>
        ) : (
          <table className="w-full text-sm border mt-3">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Tên gói</th>
                <th className="px-3 py-2 text-center">Giá</th>
                <th className="px-3 py-2 text-center">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-center">
                  Bắt đầu
                </th>
                <th className="px-3 py-2 text-center">
                  Kết thúc
                </th>
                <th className="px-3 py-2 text-center">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-center">
                    {formatVND(s.price)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.status || "active"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.start_date || "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.end_date || "-"}
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

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg">
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
                {error}
              </div>
            )}

            {modal.type === "plan" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit"
                    ? "Chỉnh sửa gói"
                    : "Tạo gói mới"}
                </h2>
                <form
                  onSubmit={savePlan}
                  className="space-y-3"
                >
                  <input
                    placeholder="Tên gói"
                    className="w-full border p-2 rounded"
                    value={planForm.name}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                  />
                  <textarea
                    placeholder="Mô tả"
                    className="w-full border p-2 rounded"
                    rows={2}
                    value={planForm.description}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                  <select
                    className="w-full border p-2 rounded"
                    value={planForm.type}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="basic">basic</option>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                  </select>
                  <input
                    placeholder="Giá (VNĐ)"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={planForm.price}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        price: e.target.value,
                      }))
                    }
                  />
                  <input
                    placeholder="Thời hạn (ngày)"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={planForm.duration_days}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        duration_days: e.target.value,
                      }))
                    }
                  />
                  <textarea
                    placeholder="Mỗi dòng 1 quyền lợi..."
                    rows={4}
                    className="w-full border p-2 rounded"
                    value={planForm.featuresText}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        featuresText: e.target.value,
                      }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          open: false,
                          type: "",
                          mode: "create",
                        })
                      }
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-emerald-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit"
                        ? "Cập nhật"
                        : "Lưu"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modal.type === "coupon" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit"
                    ? "Chỉnh sửa mã giảm giá"
                    : "Tạo mã giảm giá mới"}
                </h2>
                <form
                  onSubmit={saveCoupon}
                  className="space-y-3"
                >
                  <input
                    placeholder="Mã (VD: KHUYENMAI2025)"
                    className="w-full border p-2 rounded"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm((f) => ({
                        ...f,
                        code: e.target.value,
                      }))
                    }
                  />
                  <input
                    placeholder="Phần trăm giảm"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={couponForm.discount}
                    onChange={(e) =>
                      setCouponForm((f) => ({
                        ...f,
                        discount: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={couponForm.expiresAt}
                    onChange={(e) =>
                      setCouponForm((f) => ({
                        ...f,
                        expiresAt: e.target.value,
                      }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          open: false,
                          type: "",
                          mode: "create",
                        })
                      }
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit"
                        ? "Cập nhật"
                        : "Lưu"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modal.type === "subscription" && (
              <>
                <h2 className="text-lg font-semibold mb-3">
                  {modal.mode === "edit"
                    ? "Chỉnh sửa thuê bao"
                    : "Tạo thuê bao người dùng"}
                </h2>
                <form
                  onSubmit={saveSub}
                  className="space-y-3"
                >
                  <input
                    placeholder="Tên gói"
                    className="w-full border p-2 rounded"
                    value={subForm.name}
                    onChange={(e) =>
                      setSubForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                  />
                  <input
                    placeholder="Giá (VNĐ)"
                    type="number"
                    className="w-full border p-2 rounded"
                    value={subForm.price}
                    onChange={(e) =>
                      setSubForm((f) => ({
                        ...f,
                        price: e.target.value,
                      }))
                    }
                  />
                  <select
                    className="w-full border p-2 rounded"
                    value={subForm.status}
                    onChange={(e) =>
                      setSubForm((f) => ({
                        ...f,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="active">active</option>
                    <option value="cancelled">cancelled</option>
                    <option value="expired">expired</option>
                  </select>
                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded"
                    value={subForm.start_date}
                    onChange={(e) =>
                      setSubForm((f) => ({
                        ...f,
                        start_date: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded"
                    value={subForm.end_date}
                    onChange={(e) =>
                      setSubForm((f) => ({
                        ...f,
                        end_date: e.target.value,
                      }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          open: false,
                          type: "",
                          mode: "create",
                        })
                      }
                      className="border border-gray-300 px-3 py-1.5 rounded"
                    >
                      Hủy
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded">
                      {modal.mode === "edit"
                        ? "Cập nhật"
                        : "Lưu"}
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
