// pages/admin/SubscriptionPlans.jsx
import React, { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import { usePayment } from "@/hooks/usePayment";

/**
 * Trang Gói thuê bao:
 * - Ở đây giữ danh sách gói plan tĩnh trên FE (không dùng localStorage)
 * - Khi admin tạo/cancel gói -> gọi createSubscription / cancelSubscription
 * - Có thể thay bằng API getPlans() sau này nếu backend cung cấp
 */

// Danh sách gói mẫu (có thể map với bên backend theo code)
const PLANS = [
  {
    code: "BASIC",
    name: "Gói Cơ bản",
    price: 199000,
    description: "Phù hợp cho bãi nhỏ, dưới 5 trụ.",
    features: ["Tối đa 5 trạm", "Báo cáo cơ bản", "Hỗ trợ qua email"],
  },
  {
    code: "STANDARD",
    name: "Gói Tiêu chuẩn",
    price: 499000,
    description: "Dành cho hệ thống vừa, cần thống kê chi tiết.",
    features: [
      "Tối đa 20 trạm",
      "Báo cáo nâng cao",
      "Cảnh báo lỗi realtime",
      "Ưu tiên hỗ trợ",
    ],
  },
  {
    code: "PRO",
    name: "Gói Chuyên nghiệp",
    price: 999000,
    description: "Cho nhà vận hành quy mô lớn, cần dự báo tải.",
    features: [
      "Không giới hạn trạm",
      "Dự báo AI",
      "Tuỳ chỉnh SLA",
      "Hỗ trợ 24/7",
    ],
  },
];

export default function SubscriptionPlansPage() {
  const {
    createSubscription,
    cancelSubscription,
    loadingSubscription,
    error,
  } = usePayment();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orgId, setOrgId] = useState(""); // tổ chức / tenant Id
  const [result, setResult] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!orgId) {
      alert("Vui lòng nhập Organization ID / Tenant ID trước.");
      return;
    }
    try {
      const res = await createSubscription({
        org_id: orgId,
        plan_code: plan.code,
      });
      setSelectedPlan(plan.code);
      setResult(res.data || res);
    } catch {
      // error đã set ở provider
    }
  };

  const handleCancel = async () => {
    if (!orgId) {
      alert("Cần có Organization ID để huỷ.");
      return;
    }
    const id = window.prompt("Nhập Subscription ID cần huỷ:");
    if (!id) return;
    try {
      const res = await cancelSubscription(id);
      setResult(res.data || res);
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gói thuê bao"
        subtitle="Quản lý gói dịch vụ cho tổ chức / tenant"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.message ||
            error.toString() ||
            "Có lỗi xảy ra trong quá trình gọi thanh toán"}
        </div>
      )}

      {/* Nhập tổ chức */}
      <Section title="Thông tin tổ chức">
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Organization / Tenant ID
            </label>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="VD: org_123 hoặc tenant_xxx"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleCancel}
            className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Huỷ gói hiện tại (nhập Subscription ID)
          </button>
        </div>
      </Section>

      {/* Danh sách gói */}
      <Section title="Danh sách gói dịch vụ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.code;
            return (
              <div
                key={plan.code}
                className={`flex flex-col rounded-2xl border p-4 shadow-sm ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {plan.name}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gray-600">
                    {plan.code}
                  </span>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {plan.price.toLocaleString("vi-VN")}{" "}
                  <span className="text-xs text-gray-500">/tháng</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {plan.description}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-gray-700">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1">
                      <span className="mt-[2px] text-green-500">✔</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={loadingSubscription}
                  onClick={() => handleSubscribe(plan)}
                  className={`mt-4 rounded-lg px-4 py-2 text-xs font-semibold ${
                    isSelected
                      ? "bg-gray-800 text-white hover:bg-black"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-60`}
                >
                  {loadingSubscription
                    ? "Đang xử lý..."
                    : isSelected
                    ? "Đã áp dụng cho tổ chức"
                    : "Áp dụng gói này"}
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Kết quả raw từ backend (tuỳ backend định dạng) */}
      {result && (
        <Section title="Kết quả thao tác gói (raw)">
          <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Section>
      )}
    </div>
  );
}
