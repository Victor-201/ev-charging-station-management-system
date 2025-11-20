import React, { useEffect, useState, useCallback, useRef } from 'react';
import Card from '../../components/staff/Card/index';
import stationService from '@/services/stationService';
import { useStation } from '@/hooks/useStation';
import { useAuth } from '@/hooks/useAuth';

export default function IncidentReport() {
  const { user } = useAuth();
  const user_id = user?.user_id;

  const {
    stations = [],
    currentStation,
    connectors = [],
    getAll,
    getById,
    getConnectors,
    loading,
  } = useStation();

  const [managedStation, setManagedStation] = useState(null);
  const [form, setForm] = useState({ station: '', point: '', issue: '', description: '' });
  const [reports, setReports] = useState([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  // NEW: loading khi fetch lịch sử báo cáo
  const [loadingReports, setLoadingReports] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [lastReport, setLastReport] = useState(null);

  const loadedRef = useRef({ stationId: null });

  const ISSUE_OPTIONS = [
    { value: '', label: 'Chọn vấn đề' },
    { value: 'charging_error', label: 'Lỗi sạc' },
    { value: 'power_outage', label: 'Mất điện' },
    { value: 'hardware', label: 'Lỗi phần cứng' },
    { value: 'network', label: 'Mất mạng' },
    { value: 'other', label: 'Khác' },
  ];

  // Load stations 1 lần
  useEffect(() => {
    if (getAll) getAll();
  }, [getAll]);

  // Xác định trạm quản lý
  useEffect(() => {
    if (!stations || stations.length === 0) return;

    const managerKeys = ['manager_id', 'managed_by', 'staff_id', 'owner_id', 'user_id'];
    const found = user_id
      ? stations.find((s) => managerKeys.some((k) => s[k] && String(s[k]) === String(user_id)))
      : null;

    const chosen = found || currentStation || stations[0];
    if (!chosen) return;

    setManagedStation(chosen);
    setForm((f) => ({ ...f, station: chosen.id }));

    const id = chosen.id;
    if (id && loadedRef.current.stationId !== id) {
      if (getById) getById(id);
      if (getConnectors) getConnectors(id);
      loadedRef.current.stationId = id;
    }
  }, [stations, currentStation, user_id, getById, getConnectors]);

  const points = (connectors && connectors.length ? connectors : currentStation?.chargers) || [];

  // NEW: fetch lịch sử báo cáo cho trạm đang quản lý
  useEffect(() => {
    let cancelled = false;

    async function loadReportHistory(stationId) {
      if (!stationId) return;
      setLoadingReports(true);
      setError(null);
      try {
        // gọi API GET api/v1/stations/:id/report-issues
        const res = await stationService.getReportIssues(stationId);
        const data = res?.data ?? res;

        // giả sử data là mảng; nếu API trả object { items: [], meta: {} } hãy thay đổi tương ứng
        const arr = Array.isArray(data) ? data : data?.items || [];

        const mapped = arr.map((item) => {
          // các tên trường giả định: id, point_id, issue_type, description, reported_at, status, reported_by
          const pointKey = item.point_id || item.point || item.pointId || item.connector_id || item.connectorId;
          const pointName =
            points.find(
              (p) =>
                p.id === pointKey ||
                p.point_id === pointKey ||
                p.external_id === pointKey ||
                p.connector_id === pointKey
            )?.name || pointKey || 'N/A';

          const issueLabel =
            ISSUE_OPTIONS.find((o) => o.value === (item.issue_type || item.issue))?.label ||
            item.issue_type ||
            item.issue ||
            'Không rõ';

          return {
            id: item.id || item._id || Date.now() + Math.random(),
            station: managedStation?.name || stationId,
            point: pointName,
            issue: issueLabel,
            description: item.description || item.detail || '',
            time: item.reported_at ? new Date(item.reported_at).toLocaleString() : (item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString()),
            status: item.status || 'unknown',
            raw: item,
          };
        });

        if (!cancelled) {
          // đặt lịch sử từ API trước (những report mới gửi sẽ được unshift ở phía trên khi gửi thành công/không thành công)
          setReports(mapped.sort((a, b) => {
            // sắp theo thời gian giảm dần nếu có thể
            const ta = new Date(a.time).getTime || Date.parse(a.time) || 0;
            const tb = new Date(b.time).getTime || Date.parse(b.time) || 0;
            return tb - ta;
          }));
        }
      } catch (err) {
        console.error('Load report history error', err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoadingReports(false);
      }
    }

    if (managedStation?.id) {
      loadReportHistory(managedStation.id);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedStation, /* points intentionally included? Keep out to avoid refetch on connectors update; if you want, add points */]);

  const submitReport = useCallback(async () => {
    if (!form.station) {
      alert('Vui lòng chọn trạm');
      return;
    }
    if (!form.issue) {
      alert('Vui lòng chọn vấn đề');
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    const payload = {
      point_id: form.point || null,
      issue_type: form.issue,
      description: form.description || '',
      reported_by: user_id || null,
      reported_at: new Date().toISOString(),
    };

    try {
      const res = await stationService.reportIssue(form.station, payload);
      const data = res?.data ?? res;

      const reportObj = {
        id: data?.id || Date.now(),
        station: managedStation?.name || form.station,
        point:
          points.find(
            (p) =>
              p.id === form.point ||
              p.point_id === form.point ||
              p.external_id === form.point
          )?.name || form.point || 'N/A',
        issue: ISSUE_OPTIONS.find((o) => o.value === form.issue)?.label || form.issue,
        description: form.description,
        time: new Date().toLocaleString(),
        status: 'submitted',
        raw: data,
      };

      // thêm vào đầu danh sách hiển thị (cùng với dữ liệu từ API)
      setReports((prev) => [reportObj, ...prev]);
      setLastReport(reportObj);
      setShowModal(true);

      setForm((f) => ({ ...f, point: '', issue: '', description: '' }));
      setLoadingSubmit(false);
      return { success: true, data };
    } catch (err) {
      console.error('reportIssue error', err);
      setError(err);
      setLoadingSubmit(false);

      const reportObj = {
        id: Date.now(),
        station: managedStation?.name || form.station,
        point:
          points.find(
            (p) =>
              p.id === form.point ||
              p.point_id === form.point ||
              p.external_id === form.point
          )?.name || form.point || 'N/A',
        issue: ISSUE_OPTIONS.find((o) => o.value === form.issue)?.label || form.issue,
        description: form.description,
        time: new Date().toLocaleString(),
        status: 'failed',
        raw: err,
      };

      setReports((prev) => [reportObj, ...prev]);
      setLastReport(reportObj);
      setShowModal(true);
      return { success: false, error: err };
    }
  }, [form, managedStation, points, user_id]);

  const handleStationChange = (val) => {
    // Không cho thay đổi trạm, giữ nguyên managedStation
    setForm((f) => ({ ...f, station: managedStation?.id || '' }));
  };

  function ReportModal({ open, onClose, report }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-xl p-6 z-10">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold">Xác nhận Báo Cáo Sự Cố</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Đóng ✕</button>
          </div>

         <div className="mt-4 border rounded-lg p-4 bg-gray-50">
  {/* Tên trạm nổi bật */}
  <div className="flex justify-between items-start border-b pb-3 mb-3">
    <div>
      <div className="text-sm text-gray-500">Trạm</div>
      <div className="font-bold text-2xl text-gray-900 leading-tight">
        {report.station}
      </div>
    </div>

    <div className="text-right text-sm text-gray-500">
      <div>{report.time}</div>
      <div className="mt-1 capitalize font-medium text-gray-600">
        {report.status}
      </div>
    </div>
  </div>

  {/* Phần còn lại giữ nguyên */}
  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
    <div>
      <div className="text-sm text-gray-500">Trụ</div>
      <div className="font-medium text-gray-800">{report.point}</div>
    </div>
    <div>
      <div className="text-sm text-gray-500">Vấn đề</div>
      <div className="font-medium text-gray-800">{report.issue}</div>
    </div>
  </div>

  <div className="mt-4">
    <div className="text-sm text-gray-500">Mô tả</div>
    <div className="mt-1 p-3 bg-white border rounded text-sm">
      {report.description || '—'}
    </div>
  </div>

  <div className="mt-4 text-xs text-gray-500">
    <div>Người báo: {user?.name || user_id || 'Không rõ'}</div>
    <div className="mt-1">ID báo cáo: {report.id}</div>
  </div>
</div>


          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                } catch (e) {}
                onClose();
              }}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Sao chép JSON
            </button>
            <button
              onClick={() => {
                const html = `
                  <html>
                    <head>
                      <title>Report ${report.id}</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <style>body{font-family: Arial, Helvetica, sans-serif;padding:20px;} .box{border:1px solid #ddd;padding:16px;border-radius:8px;}</style>
                    </head>
                    <body>
                      <h2>Report sự cố</h2>
                      <div class="box">
                        <p><strong>Trạm:</strong> ${report.station}</p>
                        <p><strong>Trụ:</strong> ${report.point}</p>
                        <p><strong>Vấn đề:</strong> ${report.issue}</p>
                        <p><strong>Mô tả:</strong><br/>${(report.description || '').replace(/\n/g,'<br/>')}</p>
                        <p><strong>Thời gian:</strong> ${report.time}</p>
                        <p><strong>ID:</strong> ${report.id}</p>
                      </div>
                      <script>window.print()</script>
                    </body>
                  </html>
                `;
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(html);
                  w.document.close();
                } else {
                  alert('Không thể mở cửa sổ in, vui lòng kiểm tra pop-up blocker.');
                }
              }}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              In báo cáo
            </button>
            <button onClick={onClose} className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 ml-64 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Báo cáo Sự Cố</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tạo báo cáo mới">
          <div className="space-y-4">
            <label className="block text-base font-semibold mb-2">Trạm</label>
<input
  type="text"
  value={managedStation?.name || ''}
  disabled
  className="w-full p-4 bg-gray-50 text-lg font-medium text-gray-800 rounded-lg border-0 cursor-not-allowed focus:outline-none focus:ring-0 disabled:opacity-100"
/>

            <label className="block text-sm font-medium">Trụ (Point)</label>
            <select
              value={form.point}
              onChange={(e) => setForm((f) => ({ ...f, point: e.target.value }))}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Trụ cần báo cáo</option>
              {points.map((p) => (
                <option key={p.id || p.point_id || p.external_id} value={p.id || p.point_id || p.external_id}>
                  {p.name || p.label || p.id || p.point_id || p.external_id}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium">Vấn đề</label>
            <select value={form.issue} onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))} className="w-full p-3 border rounded-lg">
              {ISSUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium">Mô tả chi tiết</label>
            <textarea
              placeholder="Mô tả chi tiết..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full p-3 border rounded-lg h-32"
            />

            <button
              onClick={submitReport}
              disabled={loadingSubmit}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-60"
            >
              {loadingSubmit ? 'Đang gửi...' : 'Gửi Báo Cáo'}
            </button>

            {error && <div className="text-sm text-red-600">Có lỗi: {error.message || String(error)}</div>}
          </div>
        </Card>

        <Card title="Lịch sử báo cáo">
          {loadingReports ? (
            <p className="text-gray-500">Đang tải lịch sử báo cáo...</p>
          ) : reports.length ? (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{r.station}</strong> - {r.issue}
                      <div className="text-sm mt-1">{r.description}</div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{r.time}</div>
                      <div className="mt-1">{r.status}</div>
                      <button
                        onClick={() => {
                          setLastReport(r);
                          setShowModal(true);
                        }}
                        className="mt-2 text-blue-600 text-xs"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có báo cáo</p>
          )}
        </Card>
      </div>

      <ReportModal open={showModal} onClose={() => setShowModal(false)} report={lastReport || {}} />
    </div>
  );
}
