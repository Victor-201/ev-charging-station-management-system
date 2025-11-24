
// Lightweight date/number helpers for the mobile app
// No external deps to keep bundle small

export function timeAgo(input) {
  if (!input) return '';
  const date = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week} tuần`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} tháng`;
  const year = Math.floor(day / 365);
  return `${year} năm`;
}

export function formatCurrencyVND(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('vi-VN') + ' đ';
}

export function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}
