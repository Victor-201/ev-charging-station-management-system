// pages/admin/SubscriptionPlans.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { usePayment } from "@/hooks/usePayment";

export default function SubscriptionPlans() {
  const {
    loadingSubscription,
    createSubscription,
    cancelSubscription,
    getAllSubscriptions,
  } = usePayment();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // FORM STATE
  const [editing, setEditing] = useState(null); // { user_id, plan_id }

  /* ================================
   * LOAD ALL SUBSCRIPTIONS
   * ================================ */
  const loadSubscriptions = async () => {
    setLoadingList(true);
    setError("");

    const res = await getAllSubscriptions();
    if (!res?.success) {
      setError("Không thể tải danh sách subscriptions");
      setSubscriptions([]);
      setLoadingList(false);
      return;
    }

    const data = res.data?.data ?? res.data ?? [];
    setSubscriptions(Array.isArray(data) ? data : []);
    setLoadingList(false);
  };

  useEffect(() => {
    loadSubscriptions();
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
      setError("Không thể tạo subscription mới");
      setSaving(false);
      return;
    }

    setEditing(null);
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
      setError("Không thể hủy subscription");
      return;
    }

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
                  disabled={saving || loadingSubscription}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving || loadingSubscription
                    ? "Đang lưu..."
                    : "Tạo subscription"}
                </button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
