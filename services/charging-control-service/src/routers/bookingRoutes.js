const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/BookingController');

// ====================
// 🚗 RESERVATION APIs
// ====================

// ⚙️ Auto-cancel job (tự động hủy khi quá hạn)
router.get('/auto-cancel', bookingCtrl.runAutoCancelJob);

// 🔍 Check availability (kiểm tra trạm sạc trống)
router.get('/check', bookingCtrl.checkAvailability);

// ➕ Create new reservation (tạo đặt chỗ mới)
router.post('/', bookingCtrl.createReservation);

// 🧾 Preview cost (xem trước chi phí, không lưu)
router.get('/:reservation_id/preview-cost', bookingCtrl.previewCost);

// 💰 Calculate & save cost (tính toán & lưu chi phí)
router.post('/:reservation_id/calculate', bookingCtrl.calculateReservation);

// ✅ Finalize reservation (hoàn tất đặt chỗ + tính tiền)
router.post('/:reservation_id/finalize', bookingCtrl.finalizeReservation);


// 👤 Get reservations by user (lấy danh sách đặt chỗ theo user)
router.get('/user/:user_id', bookingCtrl.getUserReservations);

// 🔍 Get reservation detail (chi tiết đặt chỗ)
router.get('/:reservation_id', bookingCtrl.getReservationById);

// ✏️ Update reservation info (cập nhật thông tin đặt chỗ)
router.put('/:reservation_id', bookingCtrl.updateReservation);

// ❌ Cancel reservation (hủy đặt chỗ)
router.delete('/:reservation_id', bookingCtrl.cancelReservation);

// ====================
// 💳 PAYMENT APIs
// ====================

// 💳 Attach payment to reservation (gắn thông tin thanh toán vào đặt chỗ)
router.post('/:reservation_id/attach-payment', bookingCtrl.attachPaymentAndConfirm);


// ✅ Confirm payment (xác nhận thanh toán thành công)
router.post('/:reservation_id/payment/payment-failed', bookingCtrl.markPaymentFailed);


// ====================
// 🕓 WAITLIST APIs
// ====================

// ➕ Add to waitlist (thêm vào danh sách chờ)
router.post('/waitlist', bookingCtrl.addToWaitlist);

// 🔍 Get waitlist by station (lấy danh sách chờ của trạm)
router.get('/waitlist/:station_id', bookingCtrl.getByStation);

// 🔄 Update waitlist status (cập nhật trạng thái chờ)
router.patch('/waitlist/:waitlist_id/status', bookingCtrl.updateStatus);

// ❌ Remove from waitlist (xóa khỏi danh sách chờ)
router.delete('/waitlist/:waitlist_id', bookingCtrl.removeFromWaitlist);

// ====================
// 📱 QR Code APIs
// ====================

// 🎟️ Generate QR (tạo mã QR cho đặt chỗ)
router.post('/qr/generate', bookingCtrl.createQr);

// 🔍 Validate QR (xác thực mã QR)
router.get('/qr/:qr_id/validate', bookingCtrl.validateQr);

// ✅ Mark QR as used (đánh dấu mã QR đã sử dụng)
router.post('/qr/:qr_id/mark-used', bookingCtrl.markUsed);

module.exports = router;
