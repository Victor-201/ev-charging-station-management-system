import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ROUTERS } from "@/utils/constants";

/**
 * ScanPage - Quét QR full-screen overlay với nút quay lại.
 */
export default function ScanPage() {
  const [status, setStatus] = useState('init');
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanned, setScanned] = useState(false);

  const scannerRef = useRef(null);
  const tempStreamRef = useRef(null);
  const containerDivRef = useRef(null);
  const mountedRef = useRef(false);
  const navigate = useNavigate();

  const makeId = () => `qr-external-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
    } catch (e) {
      console.warn('[ScanPage] safeStopScanner ignored error:', e);
    }
  };

  const stopAllCameraStreams = () => {
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach((video) => {
      const stream = video.srcObject;
      if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    });
    if (tempStreamRef.current) {
      tempStreamRef.current.getTracks().forEach((t) => t.stop());
      tempStreamRef.current = null;
    }
  };

  const removeAllOverlays = () => {
    document.querySelectorAll('.qr-overlay-external, .qr-external-container').forEach((el) => el.remove());
  };

  const applyStylesToInjectedElements = (container) => {
    const video = container?.querySelector('video');
    const canvas = container?.querySelector('canvas');
    [video, canvas].forEach((el) => {
      if (el) {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'cover';
        el.style.display = 'block';
      }
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      setStatus('checking');
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        if (!cameras || cameras.length === 0) {
          setStatus('no-camera');
          setErrorMsg('Không tìm thấy camera trên thiết bị này.');
          return;
        }

        setStatus('requesting');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStreamRef.current = stream;
        } catch {
          setErrorMsg('Quyền camera bị từ chối hoặc không khả dụng.');
          setStatus('error');
          return;
        } finally {
          stopTempStream();
        }

        // ===== TẠO OVERLAY TOÀN MÀN HÌNH =====
        const overlay = document.createElement('div');
        overlay.className =
          'qr-overlay-external fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-sm bg-black/60';

        // Khung chứa video
        const container = document.createElement('div');
        const containerId = makeId();
        container.id = containerId;
        container.className =
          'qr-external-container w-[420px] h-[420px] rounded-xl overflow-hidden bg-black shadow-[0_14px_40px_rgba(0,0,0,0.5)] relative';

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // ===== NÚT QUAY LẠI TRONG OVERLAY =====
        const backButton = document.createElement('button');
        backButton.className =
          'absolute top-4 left-4 bg-white/90 hover:bg-white text-black font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition';
        backButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Trở lại</span>
        `;
        backButton.onclick = async () => {
          await safeStopScanner();
          stopAllCameraStreams();
          removeAllOverlays();
          navigate(ROUTERS.STAFF.DASHBOARD);
        };
        overlay.appendChild(backButton);
        // ===============================

        containerDivRef.current = container;
        containerDivRef.current.__overlay = overlay;

        await new Promise((r) => requestAnimationFrame(r));
        if (!mountedRef.current) return;

        // ===== KHỞI TẠO HTML5 QR CODE =====
        scannerRef.current = new Html5Qrcode(containerId, false);
        const config = {
          fps: 10,
          qrbox: { width: 320, height: 320 },
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        };

        setStatus('scanning');
        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          async (decodedText) => {
            if (!mountedRef.current) return;
            setScanResult(decodedText);
            setStatus('stopped');
            await safeStopScanner();
            overlay.remove();
            stopAllCameraStreams();
            setScanned(true);
          },
          () => {}
        );

        applyStylesToInjectedElements(container);
        const observer = new MutationObserver(() => applyStylesToInjectedElements(container));
        observer.observe(container, { childList: true, subtree: true });
        container.__observer = observer;
      } catch (err) {
        console.error('[ScanPage] init error', err);
        setErrorMsg(err?.message || String(err));
        setStatus('error');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      (async () => {
        await safeStopScanner();
        stopTempStream();
        stopAllCameraStreams();
        if (containerDivRef.current?.__observer) containerDivRef.current.__observer.disconnect();
        removeAllOverlays();
      })();
    };
  }, []);

  const handleConfirm = async () => {
    await safeStopScanner();
    stopAllCameraStreams();
    removeAllOverlays();
    navigate(ROUTERS.STAFF.DASHBOARD);
  };

  const handleScanAgain = () => window.location.reload();

  const handleClose = async () => {
    await safeStopScanner();
    stopAllCameraStreams();
    removeAllOverlays();
    navigate(-1);
  };

  return (
    <div className="p-6 min-h-[60vh] text-center">
      <div className="flex items-center justify-center relative mb-2">
        <button onClick={handleClose} className="absolute left-0 text-blue-600 font-semibold">
          ← Trở lại
        </button>
        <h2 className="text-lg font-semibold">Quét mã QR</h2>
      </div>

      <div className="w-[420px] h-[420px] mx-auto border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center shadow-md">
        {status !== 'scanning' && !scanned && !scanResult && (
          <div className="text-gray-600">
            {status === 'checking' && 'Kiểm tra camera...'}
            {status === 'requesting' && 'Yêu cầu quyền camera...'}
            {status === 'no-camera' && 'Không tìm thấy camera.'}
            {status === 'error' && 'Lỗi khi mở camera.'}
            {status === 'init' && 'Chuẩn bị...'}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p>
          Trạng thái: <strong>{status}</strong>
        </p>
        {errorMsg && <p className="text-red-600 mt-1">Lỗi: {errorMsg}</p>}
      </div>

      {scanned && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100000]">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[92%] p-6 text-center">
            <div className="w-[86px] h-[86px] mx-auto mb-3 rounded-full bg-green-600 text-white text-[44px] font-bold flex items-center justify-center animate-[popIn_0.26s_ease-out_forwards]">
              ✓
            </div>
            <h3 className="text-lg font-semibold mb-1">Mã QR đã được quét</h3>
            <p className="font-semibold break-all">{scanResult}</p>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={handleConfirm}
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600"
              >
                Xác nhận lượt sạc
              </button>
              <button
                onClick={handleScanAgain}
                className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Quét lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Custom animation */
const style = document.createElement('style');
style.textContent = `
@keyframes popIn { to { transform: scale(1); opacity: 1; } }
.animate-[popIn_0.26s_ease-out_forwards] { transform: scale(0); opacity: 0; animation: popIn 0.26s ease-out forwards; }
`;
document.head.appendChild(style);
