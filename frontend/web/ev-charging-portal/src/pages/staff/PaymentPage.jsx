import React, { useState, useContext } from "react";
import Card from "../../components/staff/Card";
import Table from "../../components/staff/Table";
import { PaymentContext } from "@/contexts/PaymentContext";

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function Payments() {
  const {
    createIntent,
    confirmIntent,
    loadingPayments,
    error,
  } = useContext(PaymentContext);

  const [view, setView] = useState(null);
  const [history, setHistory] = useState([]);
  const [cashAmount, setCashAmount] = useState("");
  const [qrPayload, setQrPayload] = useState(() => `evpay-${Date.now()}`);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const goBack = () => {
    setView(null);
    setCashAmount("");
    setMessage(null);
    setProcessing(false);
    setQrPayload(`evpay-${Date.now()}`);
  };

  // =============== THANH TOÁN TIỀN MẶT ===============
  const confirmCash = async ({ collector = "Staff" } = {}) => {
    if (!cashAmount || Number(cashAmount) <= 0) {
      setMessage({ type: "error", text: "Nhập số tiền hợp lệ." });
      return;
    }

    setProcessing(true);
    setMessage(null);
    try {
      // Gọi API tạo payment intent (giả sử backend có type = "cash")
      const payload = { amount: Number(cashAmount), method: "cash" };
      const res = await createIntent(payload);

      if (res.success) {
        // Optionally xác nhận thanh toán
        await confirmIntent({ id: res.data.id });

        const record = [
          res.data.id || `P-${Math.floor(Math.random() * 900 + 100)}`,
          collector,
          `$${Number(cashAmount).toFixed(2)}`,
          "Cash",
          formatNow(),
        ];

        setHistory((prev) => [record, ...prev]);
        setMessage({ type: "success", text: "Thanh toán tiền mặt thành công!" });
      } else {
        throw new Error("Tạo thanh toán thất bại.");
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err?.message || "Lỗi khi thực hiện thanh toán.",
      });
    } finally {
      setProcessing(false);
      setTimeout(goBack, 1200);
    }
  };

  // =============== THANH TOÁN QR ===============
  const confirmQrComplete = async ({ collector = "Staff" } = {}) => {
    setProcessing(true);
    setMessage(null);

    try {
      // Gọi API tạo intent QR (nếu backend có hỗ trợ)
      const payload = { method: "qr", reference: qrPayload };
      const res = await createIntent(payload);

      if (res.success) {
        await confirmIntent({ id: res.data.id });

        const record = [
          res.data.id || `P-${Math.floor(Math.random() * 900 + 100)}`,
          collector,
          `$${Number(res.data.amount ?? 0).toFixed(2)}`,
          "QR",
          formatNow(),
        ];

        setHistory((prev) => [record, ...prev]);
        setMessage({ type: "success", text: "Thanh toán QR hoàn tất!" });
      } else {
        throw new Error("QR payment thất bại.");
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err?.message || "Không thể hoàn tất thanh toán QR.",
      });
    } finally {
      setProcessing(false);
      setTimeout(goBack, 1200);
    }
  };

  return (
    <div className="p-6 bg-white text-gray-900 min-h-screen font-inter">
      <h1 className="text-3xl font-bold mb-6">Payments</h1>

      {/* Main options */}
      {!view && (
        <div className="flex flex-wrap gap-6">
          <div
            onClick={() => setView("make")}
            className="flex-1 min-w-[280px] bg-white border border-gray-300 rounded-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-2">💳</div>
            <div className="text-xl font-semibold">Thực hiện thanh toán</div>
            <div className="text-sm text-gray-500">
              Ghi nhận thanh toán (tiền mặt / QR)
            </div>
          </div>

          <div
            onClick={() => setView("history")}
            className="flex-1 min-w-[280px] bg-white border border-gray-300 rounded-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-2">📜</div>
            <div className="text-xl font-semibold">Lịch sử thanh toán</div>
            <div className="text-sm text-gray-500">
              Xem các giao dịch đã ghi nhận
            </div>
          </div>
        </div>
      )}

      {/* Chọn loại thanh toán */}
      {view === "make" && (
        <div className="mt-4">
          <button onClick={goBack} className="text-blue-600 font-bold mb-3">
            ← Quay lại
          </button>

          <div className="flex flex-wrap gap-4">
            <div
              onClick={() => setView("make-cash")}
              className="flex-1 min-w-[240px] bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition cursor-pointer text-center"
            >
              <div className="text-3xl mb-2">💵</div>
              <div className="text-lg font-bold">Thanh toán tiền mặt</div>
              <div className="text-sm text-gray-500">
                Nhập số tiền và xác nhận thu
              </div>
            </div>

            <div
              onClick={() => setView("make-qr")}
              className="flex-1 min-w-[240px] bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition cursor-pointer text-center"
            >
              <div className="text-3xl mb-2">🔳</div>
              <div className="text-lg font-bold">Thanh toán QR</div>
              <div className="text-sm text-gray-500">
                Hiện mã QR và xác nhận hoàn tất
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form thanh toán tiền mặt */}
      {view === "make-cash" && (
        <Card title="Thanh toán tiền mặt" onBack={goBack}>
          <div className="flex flex-col gap-4 mt-2">
            <label className="font-semibold">
              Số tiền thu (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Ví dụ: 12.50"
                className="mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-60"
              />
            </label>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                onClick={goBack}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-60"
                onClick={() => confirmCash()}
                disabled={processing || loadingPayments}
              >
                {processing || loadingPayments ? "Đang xử lý..." : "Xác nhận đã thu"}
              </button>
            </div>

            {message && (
              <div
                className={`mt-2 px-3 py-2 rounded-lg font-semibold ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Thanh toán QR */}
      {view === "make-qr" && (
        <Card title="Thanh toán bằng QR" onBack={goBack}>
          <div className="flex flex-wrap items-center gap-6 mt-2">
            <div className="w-[220px] h-[220px] bg-white border border-gray-200 rounded-xl shadow-md grid place-items-center">
              <svg width="200" height="200" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#fff" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const x = (i % 4) * 22 + (i % 2 ? 4 : 0);
                  const y = Math.floor(i / 4) * 22 + (i % 3 === 0 ? 4 : 0);
                  const w = 12 + (i % 3);
                  return <rect key={i} x={x} y={y} width={w} height={w} fill="#0f2e66" />;
                })}
                <text x="50" y="95" fontSize="6" textAnchor="middle" fill="#0f2e66">
                  QR: {qrPayload.slice(-6)}
                </text>
              </svg>
            </div>

            <div className="flex flex-col gap-3 max-w-md">
              <div className="text-gray-500 text-sm">
                Cho khách quét mã QR này. Khi quét xong, nhân viên bấm “Hoàn thành”.
              </div>

              <div className="flex gap-3">
                <button
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                  onClick={goBack}
                  disabled={processing}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-60"
                  onClick={() => confirmQrComplete()}
                  disabled={processing || loadingPayments}
                >
                  {processing || loadingPayments ? "Đang xử lý..." : "Đã quét / Hoàn thành"}
                </button>
              </div>

              {message && (
                <div
                  className={`mt-1 px-3 py-2 rounded-lg font-semibold ${
                    message.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Lịch sử thanh toán */}
      {view === "history" && (
        <Card title="Lịch sử thanh toán" onBack={goBack}>
          <Table columns={["ID", "User", "Amount", "Method", "Time"]} rows={history} />
        </Card>
      )}
    </div>
  );
}
