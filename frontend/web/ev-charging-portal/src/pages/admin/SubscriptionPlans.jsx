// pages/admin/SubscriptionPlans.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchPlans() {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient({
        method: "GET",
        url: "/api/v1/payments/plans",
      });
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Plans error:", err);
      setError("Không tải được danh sách gói đăng ký.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gói đăng ký"
        subtitle="Quản lý các gói dịch vụ sạc và đăng ký theo tháng/năm"
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Section title="Danh sách gói">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : plans.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có gói đăng ký nào trong hệ thống.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {plan.name}
                  </h3>
                  <span className="text-xs uppercase text-gray-500">
                    {plan.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 min-h-[40px]">
                  {plan.description || "Không có mô tả."}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-emerald-600">
                    {plan.price?.toLocaleString("vi-VN") ?? 0}
                  </span>
                  <span className="text-xs text-gray-500">VND</span>
                </div>
                {plan.duration_days && (
                  <p className="text-xs text-gray-500">
                    Thời hạn: {plan.duration_days} ngày
                  </p>
                )}
                <button
                  type="button"
                  className="mt-3 text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Chỉnh sửa (TODO – gọi API PUT)
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
