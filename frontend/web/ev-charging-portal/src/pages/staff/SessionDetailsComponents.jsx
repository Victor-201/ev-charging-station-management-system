import React from "react";
import { RefreshCw, Clock, DollarSign, CheckCircle, ArrowLeftRight } from "lucide-react";

// Format tiền theo yêu cầu: 30 -> 30.000 VNĐ
export const formatMoney = (v) => {
  if (v === null || v === undefined || v === "") return "N/A";
  const n = Number(v) ?? 0;
  return n.toLocaleString("vi-VN") + " VNĐ";
};

export const getStatusColor = (status) => {
  const colors = {
    active: "bg-green-100 text-green-800",
    charging: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    stopped: "bg-gray-100 text-gray-800",
    completed: "bg-blue-100 text-blue-800",
    error: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// --- Helpers to normalize telemetry coming from various backends ---
// This accepts either an object like { energy_kwh, power_kw, ... }
// or the payload you sent: { telemetry: [ { meter_wh, power_kw, soc, timestamp } ] }

function pickLatestFromArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  // sort by timestamp (if exists) or keep last element
  const sorted = arr
    .slice()
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
  return sorted[sorted.length - 1];
}

export function normalizeTelemetryInput(input) {
  if (!input) return null;

  if (input.telemetry) {
    const t = Array.isArray(input.telemetry)
      ? pickLatestFromArray(input.telemetry)
      : input.telemetry; 

    if (!t) return null;

    return {
      energy_kwh: t.energy_kwh ?? (t.meter_wh != null ? Number(t.meter_wh) / 1000 : undefined),
      power_kw: t.power_kw ?? t.kW ?? t.power ?? undefined,
      soc_percent: t.soc_percent ?? t.soc ?? undefined,
      cost:
        typeof t.price_per_kw === "number" && typeof t.meter_wh === "number"
          ? (t.price_per_kw * t.meter_wh) / 1000
          : undefined,
      timestamp: t.timestamp,
      raw: t,
    };
  }

  if (Array.isArray(input)) {
    const latest = pickLatestFromArray(input);
    return latest ? normalizeTelemetryInput({ telemetry: latest }) : null;
  }

  return {
    energy_kwh: input.energy_kwh ?? (input.meter_wh != null ? Number(input.meter_wh) / 1000 : undefined),
    power_kw: input.power_kw ?? input.kW ?? input.power ?? undefined,
    soc_percent: input.soc_percent ?? input.soc ?? undefined,
    cost:
      typeof input.price_per_kw === "number" && typeof input.meter_wh === "number"
        ? (input.price_per_kw * input.meter_wh) / 1000
        : undefined,
    timestamp: input.timestamp,
    raw: input,
  };
}


// Component hiển thị thông tin Telemetry — bây giờ hỗ trợ payload dạng bạn đưa lên
export const TelemetrySection = ({ telemetry }) => {
  const t = normalizeTelemetryInput(telemetry);
  if (!t) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-lg font-bold text-gray-900 mb-2">📊 Thông Tin Telemetry</h3>
      {t.timestamp && (
        <p className="text-sm text-gray-500 mb-3">Cập nhật: {new Date(t.timestamp).toLocaleString('vi-VN')}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Năng lượng</p>
          <p className="text-2xl font-bold text-blue-600">
            {(t.energy_kwh != null ? Number(t.energy_kwh).toFixed(2) : '0')} kWh
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Công suất</p>
          <p className="text-2xl font-bold text-green-600">
            {(t.power_kw != null ? Number(t.power_kw).toFixed(2) : '0')} kW
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">SoC</p>
          <p className="text-2xl font-bold text-yellow-600">
            {t.soc_percent != null ? Number(t.soc_percent).toFixed(0) : '0'}%
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg col-span-2">
          <p className="text-sm text-gray-600 mb-1">Chi phí hiện tại</p>
          <p className="text-2xl font-bold text-indigo-600">
            {formatMoney(t.cost)}
          </p>
          {/* debug raw payload (optional) */}
        </div>
      </div>
    </div>
  );
};

// Component hiển thị lịch sử sự kiện (giữ nguyên)
export const SessionEventsSection = ({ sessionEvents }) => {
  if (!sessionEvents || sessionEvents.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📜 Lịch Sử Sự Kiện</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sessionEvents.map((event, index) => (
          <div key={event.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock size={16} className="text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{event.event_type}</p>
              <p className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString("vi-VN")}</p>
              {event.data && (
                <p className="text-xs text-gray-500 mt-1">{JSON.stringify(event.data)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Payment & Reconcile sections (giữ nguyên nhưng export để dùng lại)
export const PaymentSection = ({
  reconcileResult, isPendingPayment, isRefundable, isGuestSession,
  selectedPaymentMethod, handleSelectPaymentMethod, handleProceedPayment,
  handleRefund, loadingRefund
}) => {
  return (
    <>
      {isPendingPayment && (
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-semibold">
              ⚠️ Khách hàng cần thanh toán thêm: {formatMoney(reconcileResult?.diff)}
            </p>
          </div>

          <p className="text-gray-700 font-semibold mb-3">Chọn phương thức thanh toán:</p>
          <div className={`grid ${isGuestSession ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
            <button
              onClick={() => handleSelectPaymentMethod("cash")}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedPaymentMethod === "cash" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="text-3xl mb-1">💵</div>
              <div className="font-semibold text-sm">Tiền mặt</div>
            </button>
            <button
              onClick={() => handleSelectPaymentMethod("bank_transfer")}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedPaymentMethod === "bank_transfer" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="text-3xl mb-1">🏦</div>
              <div className="font-semibold text-sm">Chuyển khoản</div>
            </button>
            {!isGuestSession && (
              <button
                onClick={() => handleSelectPaymentMethod("wallet")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPaymentMethod === "wallet" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="text-3xl mb-1">📱</div>
                <div className="font-semibold text-sm">Ví điện tử</div>
              </button>
            )}
          </div>
          {isGuestSession && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                ℹ️ Khách vãng lai chỉ có thể thanh toán bằng tiền mặt hoặc chuyển khoản
              </p>
            </div>
          )}
          <button
            onClick={handleProceedPayment}
            disabled={!selectedPaymentMethod}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
              !selectedPaymentMethod ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <DollarSign size={20} />
            Tiến hành thanh toán {formatMoney(reconcileResult?.diff)}
          </button>
        </div>
      )}

      {isRefundable && (
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 font-semibold">
              ↩️ Khách hàng được hoàn lại: {formatMoney(Math.abs(reconcileResult.diff))}
            </p>
            <p className="text-orange-700 text-sm mt-1">
              {reconcileResult.settlement?.message || "Sạc ít hơn số tiền đã đặt trước"}
            </p>
          </div>
          <button
            onClick={handleRefund}
            disabled={loadingRefund}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
              loadingRefund ? "bg-gray-300 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {loadingRefund ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Đang xử lý hoàn tiền...
              </>
            ) : (
              <>
                <ArrowLeftRight size={20} />
                Xác nhận hoàn tiền {formatMoney(Math.abs(reconcileResult.diff))}
              </>
            )}
          </button>
        </div>
      )}

      {reconcileResult?.payment_status === "completed" && reconcileResult?.diff === 0 && (
        <div className="flex items-center justify-center gap-2 text-green-600 py-4 bg-green-50 rounded-lg">
          <CheckCircle size={24} />
          <span className="font-semibold text-lg">Không cần điều chỉnh thanh toán</span>
        </div>
      )}
      {reconcileResult?.payment_status === "completed" && reconcileResult?.diff !== 0 && (
        <div className="flex items-center justify-center gap-2 text-green-600 py-4 bg-green-50 rounded-lg">
          <CheckCircle size={24} />
          <span className="font-semibold text-lg">Đã thanh toán thành công</span>
        </div>
      )}
      {reconcileResult?.payment_status === "refunded" && (
        <div className="flex items-center justify-center gap-2 text-purple-600 py-4 bg-purple-50 rounded-lg">
          <CheckCircle size={24} />
          <span className="font-semibold text-lg">Đã hoàn tiền thành công</span>
        </div>
      )}
    </>
  );
};

export const ReconcileDetailsSection = ({ reconcileResult, selectedSessionId }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">📋 Chi tiết từ API Reconcile</h4>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Session ID</span>
            <span className="font-mono text-sm">{reconcileResult?.session_id || selectedSessionId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Loại phiên</span>
            <span className="font-semibold">
              {reconcileResult?.reserved_cost > 0 ? "Đặt trước" : "Khách vãng lai"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Chi phí phiên sạc (session_cost)</span>
            <span className="font-semibold text-blue-600">{formatMoney(reconcileResult?.session_cost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Số tiền đã đặt trước (reserved_cost)</span>
            <span className="font-semibold">{formatMoney(reconcileResult?.reserved_cost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Chênh lệch (diff)</span>
            <span className={`font-bold text-lg ${
              Number(reconcileResult?.diff) > 0 ? "text-red-600" : 
              Number(reconcileResult?.diff) < 0 ? "text-orange-600" : "text-green-600"
            }`}>
              {Number(reconcileResult?.diff) > 0 ? "+" : ""}{formatMoney(reconcileResult?.diff)}
            </span>
          </div>
        </div>
      </div>

      {reconcileResult?.settlement && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">🔄 Thông tin Settlement</h4>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-blue-200">
              <span className="text-gray-600">Loại (type)</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                reconcileResult.settlement.type === "charge" ? "bg-red-100 text-red-800" :
                reconcileResult.settlement.type === "refund" ? "bg-orange-100 text-orange-800" :
                "bg-green-100 text-green-800"
              }`}>
                {reconcileResult.settlement.type === "charge" && "💳 Thu thêm (charge)"}
                {reconcileResult.settlement.type === "refund" && "↩️ Hoàn tiền (refund)"}
                {reconcileResult.settlement.type === "none" && "✅ Không cần điều chỉnh"}
                {!["charge", "refund", "none"].includes(reconcileResult.settlement.type) && reconcileResult.settlement.type}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-blue-200">
              <span className="text-gray-600">Số tiền (amount)</span>
              <span className="font-bold text-lg text-blue-600">{formatMoney(reconcileResult.settlement.amount)}</span>
            </div>
            <div className="py-2">
              <span className="text-gray-600">Thông báo (message)</span>
              <p className="font-medium text-gray-800 mt-1 bg-white p-2 rounded">
                {reconcileResult.settlement.message || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between py-3 px-4 bg-gray-100 rounded-lg">
        <span className="text-gray-700 font-medium">Trạng thái thanh toán</span>
        <span className={`font-bold px-3 py-1 rounded-full ${
          reconcileResult?.payment_status === "completed" ? "bg-green-100 text-green-800" :
          reconcileResult?.payment_status === "refunded" ? "bg-purple-100 text-purple-800" :
          "bg-yellow-100 text-yellow-800"
        }`}>
          {reconcileResult?.payment_status === "completed" && "✅ Đã thanh toán"}
          {reconcileResult?.payment_status === "refunded" && "↩️ Đã hoàn tiền"}
          {reconcileResult?.payment_status === "pending" && "⏳ Chờ xử lý"}
          {!["completed", "refunded", "pending"].includes(reconcileResult?.payment_status) && (reconcileResult?.payment_status || "N/A")}
        </span>
      </div>
    </div>
  );
};
