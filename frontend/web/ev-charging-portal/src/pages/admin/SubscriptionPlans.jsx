// pages/admin/SubscriptionPlans.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { usePayment } from "@/hooks/usePayment";
import { useUser } from "@/hooks/useUser";

export default function SubscriptionPlans() {
  const {
    loadingSubscription,
    loadingPlans,
    createSubscription,
    cancelSubscription,
    getAllSubscriptions,
    getAllPlans,
  } = usePayment();
  const { fetchAllUsers } = useUser();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [planOptions, setPlanOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // FORM STATE
  const [editing, setEditing] = useState(null); // { user_id, plan_id }
  const getErrorMessage = (err, fallback) => {
    if (!err) return fallback;
    if (typeof err === "string") return err;
    return (
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.error ||
      err?.message ||
      fallback
    );
  };
  const isSaving = saving || loadingSubscription;
  const lookupBusy = loadingLookup || loadingPlans;

  /* ================================
   * LOAD ALL SUBSCRIPTIONS
   * ================================ */
  const loadSubscriptions = async () => {
    setLoadingList(true);
    setError("");

    const res = await getAllSubscriptions();
    if (!res?.success) {
      setError(
        getErrorMessage(
          res?.error,
          "Không thể tải danh sách subscriptions"
        )
      );
      setSubscriptions([]);
      setLoadingList(false);
      return;
    }

    const data = res.data?.data ?? res.data ?? [];
    setSubscriptions(Array.isArray(data) ? data : []);
    setError("");
    setLoadingList(false);
  };

  /* ================================
   * LOAD PLANS + USERS FOR QUICK PICK
   * ================================ */
  const loadLookupData = async () => {
    setLoadingLookup(true);
    try {
      const [plansRes, usersRes] = await Promise.allSettled([
        getAllPlans?.(),
        fetchAllUsers({ page: 1, size: 8 }),
      ]);

      if (plansRes.status === "fulfilled" && plansRes.value) {
        const planData =
          plansRes.value?.data?.data ?? plansRes.value?.data ?? [];
        setPlanOptions(Array.isArray(planData) ? planData : []);
      }

      if (usersRes.status === "fulfilled" && usersRes.value) {
        const usersPayload =
          usersRes.value?.users ??
          usersRes.value?.data?.users ??
          usersRes.value?.data ??
          [];
        const normalized = Array.isArray(usersPayload)
          ? usersPayload.filter((u) => u?.id || u?.user_id).slice(0, 8)
          : [];
        setUserOptions(normalized);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được dữ liệu gợi ý"));
    } finally {
      setLoadingLookup(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadLookupData();
  }, []);

  /* ================================
   * CREATE SUBSCRIPTION
   * ================================ */
  const saveSubscription = async () => {
    if (!editing?.user_id || !editing?.plan_id) {
      setError("user_id và plan_id là bắt buộc");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      user_id: editing.user_id,
      plan_id: editing.plan_id,
    };

    const res = await createSubscription(payload);

    if (!res?.success) {
      setError(
        getErrorMessage(res?.error, "Không thể tạo subscription mới")
      );
      setSaving(false);
      return;
    }

    setEditing(null);
    setError("");
    await loadSubscriptions();
    setSaving(false);
  };

  /* ================================
   * CANCEL SUBSCRIPTION
   * ================================ */
  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy subscription này?")) return;

    const res = await cancelSubscription(id);

    if (!res?.success) {
      setError(getErrorMessage(res?.error, "Không thể hủy subscription"));
      return;
    }

    setError("");
    await loadSubscriptions();
  };

  /* ================================
   * TABLE CONFIG
   * ================================ */
  const columns = [
    { key: "id", title: "ID", dataIndex: "id" },
    { key: "user_id", title: "User ID", dataIndex: "user_id" },

    {
      key: "plan_id",
      title: "Plan ID",
      dataIndex: "plan_id",
      render: (value, row) => value || row.package_id || "-",
    },

    {
      key: "status",
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "active"
            ? "text-emerald-600"
            : status === "pending"
            ? "text-amber-600"
            : "text-slate-600";

        return <span className={color}>{status}</span>;
      },
    },

    {
      key: "start_date",
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      render: (v) => (v ? new Date(v).toLocaleString("vi-VN") : "-"),
    },

    {
      key: "end_date",
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      render: (v) => (v ? new Date(v).toLocaleString("vi-VN") : "-"),
    },

    {
      key: "actions",
      title: "",
      dataIndex: "id",
      render: (id, row) =>
        row.status === "active" || row.status === "pending" ? (
          <button
            onClick={() => handleCancel(id)}
            className="text-xs px-2 py-1 rounded bg-red-600 text-white"
          >
            Hủy
          </button>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Subscriptions"
          subtitle="Quản lý gói subscription của người dùng (API payment-service)"
        />

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* LIST */}
        <Section title="Danh sách subscriptions">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-slate-500">
              {subscriptions.length} subscriptions
            </div>

            <button
              onClick={() =>
                setEditing({
                  user_id: "",
                  plan_id: "",
                })
              }
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
            >
              + Tạo subscription mới
            </button>
          </div>

          {loadingList ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-xl border">
              <Table columns={columns} data={subscriptions} />
            </div>
          )}
        </Section>

        {/* FORM TẠO SUB */}
        {editing && (
          <Section title="Tạo subscription mới">
            <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

              {/* USER ID */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  User ID
                </label>
                <input
                  value={editing.user_id}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, user_id: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="UUID User"
                />
              </div>

              {/* PLAN ID */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Plan ID
                </label>
                <input
                  value={editing.plan_id}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, plan_id: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="UUID Plan"
                />
              </div>

              {(lookupBusy || planOptions.length > 0 || userOptions.length > 0) && (
                <div className="md:col-span-3 bg-slate-50 border rounded-lg p-3 space-y-3">
                  <div className="text-xs text-slate-500">
                    {lookupBusy
                      ? "Đang tải gợi ý Plan/User..."
                      : "Chọn nhanh từ danh sách có sẵn"}
                  </div>

                  {planOptions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Plans khả dụng
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {planOptions.map((plan) => (
                          <button
                            type="button"
                            key={plan.id}
                            onClick={() =>
                              setEditing((p) => ({
                                ...p,
                                plan_id: plan.id,
                              }))
                            }
                            className="border rounded-lg px-3 py-2 text-left hover:border-blue-500 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <div className="text-sm font-semibold">
                              {plan.name || "Plan"}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {plan.id}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {userOptions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        User ID mẫu (lấy từ trang người dùng)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userOptions.map((u) => {
                          const uid = u.id || u.user_id;
                          return (
                            <button
                              type="button"
                              key={uid}
                              onClick={() =>
                                setEditing((p) => ({ ...p, user_id: uid }))
                              }
                              className="border rounded-lg px-3 py-2 text-left hover:border-blue-500 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <div className="text-sm font-semibold">
                                {u.email || u.username || "User"}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                {uid}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BUTTONS */}
              <div className="md:col-span-3 flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  Hủy
                </button>

                <button
                  onClick={saveSubscription}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {isSaving ? "Đang lưu..." : "Tạo subscription"}
                </button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
