import React, { useState } from 'react'
import Card from '../../components/Card.jsx'
import Table from '../../components/Table.jsx'
import './payments.scss'

function formatNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Payments() {
  const [view, setView] = useState(null) // null | 'make' | 'history' | 'make-cash' | 'make-qr'
  const [history, setHistory] = useState([
    ["P-001", "Tran", "$12.50", "Card", "2025-10-10 10:00"]
  ])

  // payment temp state
  const [cashAmount, setCashAmount] = useState('')
  const [qrPayload, setQrPayload] = useState(() => `evpay-${Date.now()}`)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState(null)

  const goBack = () => {
    setView(null)
    setCashAmount('')
    setMessage(null)
    setProcessing(false)
    setQrPayload(`evpay-${Date.now()}`)
  }

  const confirmCash = ({ collector = 'Staff' } = {}) => {
    if (!cashAmount || Number(cashAmount) <= 0) {
      setMessage({ type: 'error', text: 'Nhập số tiền hợp lệ.' })
      return
    }
    setProcessing(true)
    setTimeout(() => {
      const id = `P-${String(Math.floor(Math.random() * 900) + 100)}`
      const amountText = `$${Number(cashAmount).toFixed(2)}`
      setHistory(prev => [[id, collector, amountText, 'Cash', formatNow()], ...prev])
      setProcessing(false)
      setMessage({ type: 'success', text: 'Thanh toán tiền mặt đã được ghi nhận.' })
      // optionally return to main after short delay
      setTimeout(goBack, 900)
    }, 600)
  }

  const confirmQrComplete = ({ collector = 'Staff' } = {}) => {
    setProcessing(true)
    setTimeout(() => {
      const id = `P-${String(Math.floor(Math.random() * 900) + 100)}`
      const amountText = `$0.00` // optionally you can read an amount from QR payload
      setHistory(prev => [[id, collector, amountText, 'QR', formatNow()], ...prev])
      setProcessing(false)
      setMessage({ type: 'success', text: 'Thanh toán bằng QR đã hoàn tất.' })
      setTimeout(goBack, 900)
    }, 900)
  }

  return (
    <div className="page payments-page">
      <h1>Payments</h1>

      {/* --- main two big options --- */}
      {!view && (
        <div className="payment-options">
          <div className="payment-card" onClick={() => setView('make')}>
            <div className="payment-card-emoji">💳</div>
            <div className="payment-card-title">Thực hiện thanh toán</div>
            <div className="payment-card-sub">Ghi nhận thanh toán (tiền mặt / QR)</div>
          </div>

          <div className="payment-card" onClick={() => setView('history')}>
            <div className="payment-card-emoji">📜</div>
            <div className="payment-card-title">Lịch sử thanh toán</div>
            <div className="payment-card-sub">Xem các giao dịch đã ghi nhận</div>
          </div>
        </div>
      )}

      {/* --- choose cash or qr --- */}
      {view === 'make' && (
        <div className="maker-container">
          <button className="back-btn" onClick={goBack}>← Quay lại</button>

          <div className="payment-options-sub">
            <div className="small-card" onClick={() => setView('make-cash')}>
              <div className="emoji">💵</div>
              <div className="title">Thanh toán tiền mặt</div>
              <div className="sub">Nhập số tiền nhân viên đã thu và xác nhận</div>
            </div>

            <div className="small-card" onClick={() => setView('make-qr')}>
              <div className="emoji">🔳</div>
              <div className="title">Thanh toán QR</div>
              <div className="sub">Hiện mã QR, quét xong nhân viên đánh dấu hoàn thành</div>
            </div>
          </div>
        </div>
      )}

      {/* --- cash flow --- */}
      {view === 'make-cash' && (
        <Card title="Thanh toán tiền mặt" onBack={goBack}>
          <div className="cash-form">
            <label>
              Số tiền thu (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Ví dụ: 12.50"
              />
            </label>

            <div className="actions">
              <button className="btn btn-secondary" onClick={goBack} disabled={processing}>Hủy</button>
              <button className="btn btn-primary" onClick={() => confirmCash()} disabled={processing}>
                {processing ? 'Đang xử lý...' : 'Xác nhận đã thu'}
              </button>
            </div>

            {message && <div className={`msg ${message.type}`}>{message.text}</div>}
          </div>
        </Card>
      )}

      {/* --- QR flow --- */}
      {view === 'make-qr' && (
        <Card title="Thanh toán bằng QR" onBack={goBack}>
          <div className="qr-area">
            <div className="qr-box" aria-hidden>
              {/* simple SVG placeholder QR (can replace by real QR generator later) */}
              <svg width="200" height="200" viewBox="0 0 100 100" className="qr-svg">
                <rect width="100" height="100" fill="#fff" />
                {/* draw a pseudo-random pattern based on qrPayload */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const x = (i % 4) * 22 + (i % 2 ? 4 : 0)
                  const y = Math.floor(i / 4) * 22 + (i % 3 === 0 ? 4 : 0)
                  const w = 12 + (i % 3)
                  return <rect key={i} x={x} y={y} width={w} height={w} fill="#0f2e66" />
                })}
                <text x="50" y="95" fontSize="6" textAnchor="middle" fill="#0f2e66">QR: {qrPayload.slice(-6)}</text>
              </svg>
            </div>

            <div className="qr-actions">
              <div className="hint">Cho khách quét mã QR trên điện thoại của họ. Khi quét xong, nhân viên bấm "Hoàn thành".</div>

              <div className="actions">
                <button className="btn btn-secondary" onClick={goBack} disabled={processing}>Hủy</button>
                <button className="btn btn-primary" onClick={() => confirmQrComplete()} disabled={processing}>
                  {processing ? 'Đang xử lý...' : 'Đã quét / Hoàn thành'}
                </button>
              </div>

              {message && <div className={`msg ${message.type}`}>{message.text}</div>}
            </div>
          </div>
        </Card>
      )}

      {/* --- history view --- */}
      {view === 'history' && (
        <Card title="Lịch sử thanh toán" onBack={goBack}>
          <Table
            columns={["ID", "User", "Amount", "Method", "Time"]}
            rows={history}
          />
        </Card>
      )}
    </div>
  )
}
