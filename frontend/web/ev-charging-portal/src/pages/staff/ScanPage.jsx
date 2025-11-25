import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ROUTERS } from '@/utils/constants';
import apiClient from '@/api/apiClient';
import userService from '@/services/userService';
import chargingControlService from '@/services/chargingControlService';

export default function ScanPage() {
  const [status, setStatus] = useState('init');
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanned, setScanned] = useState(false);

  // reservation / session states
  const [reservation, setReservation] = useState(null); // raw response from /api/v1/booking/:id (resData)
  const [reservationDetail, setReservationDetail] = useState(null); // same as reservation but via chargingControlService
  const [sessionData, setSessionData] = useState(null);

  // loading / error for reservation and user
  const [loading, setLoading] = useState(false);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [reservationError, setReservationError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const tempStreamRef = useRef(null);
  const mountedRef = useRef(false);
  const confirmLockRef = useRef(false);
  const scanLockRef = useRef(false);

  // ================= Dọn dẹp camera =================
  const stopTempStream = () => {
    if (tempStreamRef.current) {
      tempStreamRef.current.getTracks().forEach((t) => t.stop());
      tempStreamRef.current = null;
    }
  };

  const safeStopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        try {
          await scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    } catch {}
  };

  const stopAllCameraStreams = () => {
    document.querySelectorAll('video').forEach((video) => {
      const stream = video.srcObject;
      if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    });
    stopTempStream();
  };

  const removeAllOverlays = () => {
    document.querySelectorAll('.qr-overlay-external, .qr-external-container').forEach((el) => el.remove());
  };

  // ================= Helper: fetch reservation detail via service =================
  const getReservationById = useCallback(async (reservation_id) => {
    if (!reservation_id) return { success: false, error: new Error('missing reservation_id') };
    setLoadingReservation(true);
    setReservationError(null);
    try {
      const res = await chargingControlService.getReservationById(reservation_id);
      const data = res?.data ?? res;
      setReservationDetail(data);
      setLoadingReservation(false);
      return { success: true, data };
    } catch (err) {
      setReservationError(err);
      setLoadingReservation(false);
      return { success: false, error: err };
    }
  }, []);

  // ================= Helper: fetch user by id =================
  const fetchUserById = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      return null;
    }
    setLoadingUser(true);
    setUserError(null);
    try {
      const data = await userService.getUserById(userId);
      setSelectedUser(data ?? null);
      setLoadingUser(false);
      return data;
    } catch (err) {
      setUserError(err);
      setSelectedUser(null);
      setLoadingUser(false);
      return null;
    }
  }, []);

  // ================= Quét QR =================
  const initScanner = async () => {
    if (!mountedRef.current) return;

    setStatus('checking');
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!mountedRef.current) return;

      if (!cameras || cameras.length === 0) {
        setStatus('no-camera');
        setErrorMsg('Không tìm thấy camera.');
        return;
      }

      setStatus('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStreamRef.current = stream;
      } catch {
        setStatus('error');
        setErrorMsg('Quyền camera bị từ chối.');
        return;
      } finally {
        stopTempStream();
      }

      // tạo overlay nếu chưa có
      const containerId = 'qr-scanner-container';
      if (!document.getElementById(containerId)) {
        const overlay = document.createElement('div');
        overlay.className = 'qr-overlay-external fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-sm bg-black/60';

        const container = document.createElement('div');
        container.id = containerId;
        container.className =
          'qr-external-container w-[420px] h-[420px] rounded-xl overflow-hidden bg-black shadow-[0_14px_40px_rgba(0,0,0,0.5)] relative';
        overlay.appendChild(container);

        // nút quay lại
        const backButton = document.createElement('button');
        backButton.className = 'absolute top-4 left-4 bg-white/90 hover:bg-white text-black font-medium px-4 py-2 rounded-lg shadow-md';
        backButton.innerHTML = '← Trở lại';
        backButton.onclick = async () => {
          await safeStopScanner();
          stopAllCameraStreams();
          removeAllOverlays();
          navigate(ROUTERS.STAFF.DASHBOARD);
        };
        overlay.appendChild(backButton);

        document.body.appendChild(overlay);
      }

      await new Promise((r) => requestAnimationFrame(r));
      if (!mountedRef.current) return;

      // khởi tạo scanner
      scannerRef.current = new Html5Qrcode(containerId, false);
      setStatus('scanning');

      const config = { fps: 10, qrbox: { width: 320, height: 320 } };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          if (!mountedRef.current || scanLockRef.current) return;
          scanLockRef.current = true;
          setScanned(true);

          // Dừng scanner ngay lập tức
          await safeStopScanner();
          stopAllCameraStreams();
          removeAllOverlays();

          setStatus('validating');
          setLoading(true);
          setErrorMsg(null);

          try {
            const match = decodedText.match(/qr\/([^\/?#]+)/i);
            const qr_id = match ? match[1] : decodedText;

            // Validate QR
            const validateRes = await apiClient.get(`/api/v1/booking/qr/${qr_id}/validate`);
            const reservation_id = validateRes.data?.reservation_id;
            if (!reservation_id) throw new Error('QR không hợp lệ hoặc đã sử dụng.');

            // Lấy chi tiết đặt chỗ (bản đầy đủ)
            // 1) dùng apiClient trực tiếp (như trước) để có một số thông tin nhanh
            const resDetail = await apiClient.get(`/api/v1/booking/${reservation_id}`);
            const resData = resDetail.data;
            setReservation(resData);

            // 2) dùng chargingControlService.getReservationById để lấy chi tiết (như bạn yêu cầu)
            const reservationFetch = await getReservationById(reservation_id);
            // reservationDetail state sẽ được set bên trong getReservationById nếu thành công

            // 3) lấy thông tin user bằng user_id (ẩn user_id và hiện tên nếu có)
            const userId = resData.user_id || reservationFetch?.data?.user_id;
            if (userId) {
              await fetchUserById(userId);
            } else {
              setSelectedUser(null);
            }

            // ✅ Tạo phiên sạc - ĐÃ THÊM reservation_id vào payload
            const initPayload = {
              reservation_id: reservation_id,  // ✅ THÊM reservation_id
              station_id: resData.station_id,
              point_id: resData.point_id,
              user_id: resData.user_id
            };
            const initRes = await apiClient.post(`/api/v1/charging/initiate`, initPayload);
            setSessionData(initRes.data);

            setStatus('ready');
          } catch (err) {
            console.error('[ScanPage] error:', err);
            setErrorMsg(err?.response?.data?.message || err.message || 'Lỗi khi xử lý QR');
            setStatus('error');
          } finally {
            setLoading(false);
          }
        },
        (errorMessage) => {
          // optional callback for scan failure per frame (ignore)
        }
      );
    } catch (err) {
      console.error('[ScanPage] init error', err);
      setErrorMsg(err?.message || String(err));
      setStatus('error');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    initScanner();

    return () => {
      mountedRef.current = false;
      (async () => {
        await safeStopScanner();
        stopAllCameraStreams();
        removeAllOverlays();
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ================= Xác nhận bắt đầu sạc =================
  const handleConfirm = useCallback(async () => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;

    try {
      if (!sessionData?.session_id) {
        setErrorMsg('Không tìm thấy session để bắt đầu.');
        confirmLockRef.current = false;
        return;
      }

      setLoading(true);
      const startPayload = { session_id: sessionData.session_id };

      await apiClient.post(`/api/v1/charging/start`, startPayload);
      alert('✅ Phiên sạc đã được bắt đầu!');
      navigate(ROUTERS.STAFF.DASHBOARD);
    } catch (err) {
      console.error('[handleConfirm] error:', err);
      setErrorMsg(err?.response?.data?.message || 'Lỗi khi bắt đầu phiên sạc.');
      confirmLockRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [sessionData, navigate]);

  const handleScanAgain = () => {
    scanLockRef.current = false;
    setScanned(false);
    setReservation(null);
    setReservationDetail(null);
    setSessionData(null);
    setErrorMsg(null);
    setSelectedUser(null);
    setStatus('init');
    initScanner();
  };

  const handleClose = async () => {
    await safeStopScanner();
    stopAllCameraStreams();
    removeAllOverlays();
    navigate(-1);
  };

  // ================= UI =================
  return (
    <div className="p-6 min-h-[60vh] text-center">
      <div className="flex items-center justify-center relative mb-2">
        <button onClick={handleClose} className="absolute left-0 text-blue-600 font-semibold">
          ← Trở lại
        </button>
        <h2 className="text-lg font-semibold">Quét mã QR</h2>
      </div>

      <div className="w-[420px] h-[420px] mx-auto border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center shadow-md">
        {!scanned && (
          <div className="text-gray-600">
            {status === 'checking' && 'Kiểm tra camera...'}
            {status === 'requesting' && 'Yêu cầu quyền camera...'}
            {status === 'scanning' && 'Đang quét QR...'}
            {status === 'validating' && 'Đang xác thực QR...'}
            {status === 'error' && (errorMsg || 'Đã xảy ra lỗi.')}
          </div>
        )}
      </div>

      {scanned && (reservation || reservationDetail) && (
        <div className="fixed inset-0 flex items-center justify-center z-[100000] bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[520px] max-w-[95%] animate-[popIn_0.26s_ease-out_forwards]">
            <h3 className="font-semibold text-2xl mb-4 text-center">Thông tin lượt sạc</h3>

            {/* Reservation ID */}
            <p className="mb-2"><strong>Reservation ID:</strong> {reservation?.id || reservationDetail?.id}</p>

            {/* User: hiển thị tên nếu có, ẩn user_id nếu tên tồn tại */}
            <p className="mb-2">
              <strong>Người dùng:</strong>{' '}
              {loadingUser ? (
                <span className="text-sm text-gray-500">Đang tải tên người dùng...</span>
              ) : userError ? (
                <span className="text-sm text-red-500">Không lấy được thông tin người dùng</span>
              ) : selectedUser ? (
                <span className="font-medium">{selectedUser.name || selectedUser.full_name || selectedUser.displayName || selectedUser.username}</span>
              ) : (
                <span className="font-mono text-sm">{reservation?.user_id || reservationDetail?.user_id || 'N/A'}</span>
              )}
            </p>

            {/* Station / Point */}
            <p className="mb-2"><strong>Station:</strong> {reservation?.station_name || reservationDetail?.station_name || reservation?.station_id || 'N/A'}</p>
            <p className="mb-2"><strong>Point:</strong> {reservation?.point_id || reservationDetail?.point_id || 'N/A'}</p>
            <p className="mb-2"><strong>Status:</strong> {reservation?.status || reservationDetail?.status || 'N/A'}</p>

            {/* Hiển thị thời gian bắt đầu - kết thúc lấy từ reservationDetail nếu có */}
            {reservationDetail?.start_time && reservationDetail?.end_time && (
              <div className="mb-3 text-sm text-gray-700">
                <p><strong>Bắt đầu:</strong> {new Date(reservationDetail.start_time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                <p><strong>Kết thúc:</strong> {new Date(reservationDetail.end_time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
            )}

            {sessionData && (
              <p className="mb-2 text-green-600">
                <strong>Session ID:</strong> {sessionData.session_id}
              </p>
            )}

            <div className="mt-4 flex gap-4 justify-center">
              <button
                disabled={loading || confirmLockRef.current}
                onClick={handleConfirm}
                className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận lượt sạc'}
              </button>
              <button
                onClick={handleScanAgain}
                className="bg-gray-100 px-6 py-3 rounded-lg hover:bg-gray-200"
              >
                Quét lại
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <p className="text-red-600 mt-3">{errorMsg}</p>}
    </div>
  );
}

// Custom animation
const style = document.createElement('style');
style.textContent = `
@keyframes popIn { to { transform: scale(1); opacity: 1; } }
.animate-[popIn_0.26s_ease-out_forwards] { transform: scale(0); opacity: 0; animation: popIn 0.26s ease-out forwards; }
`;
document.head.appendChild(style);
