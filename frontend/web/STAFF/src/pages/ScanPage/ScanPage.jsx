// src/pages/ScanPage/ScanPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import './scanpage.scss';

/**
 * ScanPage - quét QR overlay toàn màn hình.
 * - Tạo overlay & container ngoài document.body để tránh xung đột với React DOM.
 * - Khi quét thành công: dừng scanner, dừng mọi MediaStream, gỡ overlay, show modal confirm.
 * - Khi confirm: đảm bảo dừng mọi track và navigate về /dashboard.
 */

export default function ScanPage() {
  const [status, setStatus] = useState('init'); // init | checking | requesting | scanning | stopped | error | no-camera
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanned, setScanned] = useState(false);

  const scannerRef = useRef(null);
  const tempStreamRef = useRef(null);
  const containerDivRef = useRef(null);
  const mountedRef = useRef(false);
  const navigate = useNavigate();

  const makeId = () => `qr-external-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  /* ---- Helpers ---- */

  // dừng stream tạm (chỉ dùng để trigger permission)
  const stopTempStream = () => {
    try {
      if (tempStreamRef.current) {
        tempStreamRef.current.getTracks().forEach((t) => t.stop());
        tempStreamRef.current = null;
      }
    } catch (e) {
      console.warn('[ScanPage] stopTempStream error', e);
    }
  };

  // dừng scanner instance an toàn (stop + clear)
  const safeStopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        try {
          await scannerRef.current.clear();
        } catch (e) {
          // ignore clear errors (defensive)
        }
        scannerRef.current = null;
      }
    } catch (e) {
      console.warn('[ScanPage] safeStopScanner ignored error:', e);
    }
  };

  // dừng tất cả MediaStream tracks đang active trên trang
  const stopAllCameraStreams = () => {
    try {
      const videos = Array.from(document.querySelectorAll('video'));
      videos.forEach((video) => {
        try {
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              try { track.stop(); } catch (e) { /*ignore*/ }
            });
          }
        } catch (e) {
          console.warn('[ScanPage] stop video srcObject error', e);
        }
        try { video.srcObject = null; } catch (e) {}
        try {
          if (video.src && video.src.startsWith('blob:')) {
            try { URL.revokeObjectURL(video.src); } catch (e) {}
            video.removeAttribute('src');
          }
        } catch (e) {}
      });

      if (tempStreamRef.current) {
        try {
          tempStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
        } catch (e) {}
        tempStreamRef.current = null;
      }

      console.log('[ScanPage] stopAllCameraStreams executed');
    } catch (e) {
      console.warn('[ScanPage] stopAllCameraStreams error', e);
    }
  };

  // remove overlays/containers do ta tạo (phòng trường hợp sót)
  const removeAllOverlays = () => {
    try {
      document.querySelectorAll('.qr-overlay-external, .qr-external-container').forEach((el) => {
        try { el.remove(); } catch (e) { /* ignore */ }
      });
      // remove any element id starting with qr-external- (extra defensive)
      document.querySelectorAll('[id^="qr-external-"]').forEach((el) => {
        try { el.remove(); } catch (e) {}
      });
    } catch (e) {
      console.warn('[ScanPage] removeAllOverlays error', e);
    }
  };

  // apply styles cho video/canvas do thư viện chèn vào container
  const applyStylesToInjectedElements = (container) => {
    try {
      if (!container) return;
      const video = container.querySelector('video');
      if (video) {
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.display = 'block';
      }
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
      }
      container.style.background = 'transparent';
      container.style.overflow = 'hidden';
      container.style.display = 'block';
    } catch (e) {
      console.warn('[ScanPage] applyStyles error', e);
    }
  };

  /* ---- Effect: init scanner ---- */
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      setStatus('checking');
      try {
        const cameras = await Html5Qrcode.getCameras();
        console.log('[ScanPage] cameras:', cameras);
        if (!mountedRef.current) return;

        if (!cameras || cameras.length === 0) {
          setStatus('no-camera');
          setErrorMsg('Không tìm thấy camera trên thiết bị này.');
          return;
        }

        // request quyền camera (sẽ show prompt), sau đó stop ngay
        setStatus('requesting');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStreamRef.current = stream;
        } catch (permErr) {
          console.error('[ScanPage] getUserMedia permission error', permErr);
          setErrorMsg('Quyền camera bị từ chối hoặc không khả dụng.');
          setStatus('error');
          return;
        } finally {
          stopTempStream();
        }

        // tạo overlay + container ngoài body (đè toàn trang)
        const overlay = document.createElement('div');
        overlay.className = 'qr-overlay-external';

        const centerWrap = document.createElement('div');
        centerWrap.style.display = 'flex';
        centerWrap.style.justifyContent = 'center';
        centerWrap.style.alignItems = 'center';
        centerWrap.style.width = '100%';
        centerWrap.style.height = '100%';

        const container = document.createElement('div');
        const containerId = makeId();
        container.setAttribute('id', containerId);
        container.className = 'qr-external-container';

        centerWrap.appendChild(container);
        overlay.appendChild(centerWrap);
        document.body.appendChild(overlay);

        containerDivRef.current = container;
        containerDivRef.current.__overlay = overlay;

        // đợi 1 frame cho DOM ổn định
        await new Promise((r) => requestAnimationFrame(r));
        if (!mountedRef.current) return;

        // tạo instance html5-qrcode
        scannerRef.current = new Html5Qrcode(containerId, false);

        const config = {
          fps: 10,
          qrbox: { width: Math.min(360, Math.floor(container.clientWidth * 0.85)), height: Math.min(360, Math.floor(container.clientWidth * 0.85)) },
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        };

        setStatus('scanning');

        try {
          await scannerRef.current.start(
            { facingMode: 'environment' },
            config,
            async (decodedText) => {
              // Khi quét thành công
              console.log('[ScanPage] decoded:', decodedText);
              if (!mountedRef.current) return;

              setScanResult(decodedText);
              setStatus('stopped');

              // dừng scanner + clear
              await safeStopScanner();

              // remove overlay (ẩn camera)
              try {
                if (containerDivRef.current) {
                  const ov = containerDivRef.current.__overlay;
                  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
                }
              } catch (e) {
                console.warn('[ScanPage] remove overlay after decode failed', e);
              }

              // đảm bảo dừng mọi camera stream
              stopAllCameraStreams();

              containerDivRef.current = null;
              setScanned(true);
            },
            (feedback) => {
              // feedback quét realtime (không cần show)
            },
          );

          // áp style và observer lại khi DOM thay đổi
          applyStylesToInjectedElements(containerDivRef.current);
          const observer = new MutationObserver(() => applyStylesToInjectedElements(containerDivRef.current));
          observer.observe(containerDivRef.current, { childList: true, subtree: true });
          containerDivRef.current.__observer = observer;

        } catch (startErr) {
          console.error('[ScanPage] scanner.start error', startErr);
          setErrorMsg('Không thể khởi động scanner: ' + (startErr?.message || startErr));
          setStatus('error');
        }
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
        try {
          if (containerDivRef.current?.__observer) {
            containerDivRef.current.__observer.disconnect();
            delete containerDivRef.current.__observer;
          }
        } catch (e) {}
        if (containerDivRef.current) {
          try {
            const ov = containerDivRef.current.__overlay;
            if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
          } catch (e) {
            console.warn('[ScanPage] remove external container failed', e);
          }
          containerDivRef.current = null;
        }
        // remove any stray overlays defensively
        removeAllOverlays();
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Actions: xác nhận, quét lại, đóng ---- */

  // Khi nhấn Xác nhận: dừng mọi thứ, gỡ overlay nếu còn, rồi navigate về dashboard
  const handleConfirm = async () => {
    try { await safeStopScanner(); } catch (e) { console.warn('safeStopScanner during confirm failed', e); }
    stopAllCameraStreams();
    removeAllOverlays();

    // cleanup observer ref nếu có
    try {
      if (containerDivRef.current?.__observer) {
        containerDivRef.current.__observer.disconnect();
        delete containerDivRef.current.__observer;
      }
    } catch (e) {}
    containerDivRef.current = null;

    // TODO: nếu cần gửi API để confirm, gọi ở đây và chờ result trước khi navigate

    navigate('/dashboard');
  };

  // Quét lại: reload để khởi tạo lại scanner (đơn giản & đáng tin cậy)
  const handleScanAgain = () => {
    window.location.reload();
  };

  // Đóng overlay (Back)
  const handleClose = async () => {
    try { await safeStopScanner(); } catch (e) { console.warn('safeStopScanner during close failed', e); }
    stopAllCameraStreams();
    removeAllOverlays();
    try {
      if (containerDivRef.current?.__observer) {
        containerDivRef.current.__observer.disconnect();
        delete containerDivRef.current.__observer;
      }
    } catch (e) {}
    containerDivRef.current = null;
    navigate(-1);
  };

  /* ---- Render UI (Placeholder + modal confirm) ---- */
  return (
    <div className="scan-page">
      <div className="scan-header">
        <button className="back-btn" onClick={handleClose}>← Trở lại</button>
        <h2>Quét mã QR</h2>
      </div>

      <div className="qr-reader-placeholder" style={{ width: 420, height: 420, margin: '12px auto' }}>
        {/* placeholder để layout; camera thực tế mount vào overlay ngoài body */}
        {status !== 'scanning' && !scanned && !scanResult && (
          <div className="reader-placeholder">
            {status === 'checking' && 'Kiểm tra camera...'}
            {status === 'requesting' && 'Yêu cầu quyền camera...'}
            {status === 'no-camera' && 'Không tìm thấy camera.'}
            {status === 'error' && 'Lỗi khi mở camera.'}
            {status === 'init' && 'Chuẩn bị...'}
          </div>
        )}
      </div>

      <div className="scan-status">
        <p>Trạng thái: <strong>{status}</strong></p>
        {errorMsg && <p className="error">Lỗi: {errorMsg}</p>}
      </div>

      {scanned && (
        <div className="confirm-modal">
          <div className="confirm-card">
            <div className="checkmark">✓</div>
            <h3>Mã QR đã được quét</h3>
            <p className="code">{scanResult}</p>
            <div className="confirm-actions">
              <button className="confirm-btn" onClick={handleConfirm}>Xác nhận lượt sạc</button>
              <button className="again-btn" onClick={handleScanAgain}>Quét lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
