import { query } from '../config/database.js';

export const requestTelemetryExport = async ({ stationId, pointId, from, to, format }) => {
  const result = await query(
    `INSERT INTO telemetry_exports (station_id, point_id, range_start, range_end, format)
     VALUES (?, ?, ?, ?, ?)` ,
    [stationId || null, pointId || null, from || null, to || null, format || 'zip']
  );

  const exportFormat = format || 'zip';
  const periodTag = from
    ? new Date(from).toISOString().slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  const token = exportFormat === 'zip'
    ? `telemetry_${periodTag}`
    : `telemetry_${result.insertId || Date.now()}`;
  const downloadUrl = `https://storage.local/telemetry/${token}.${exportFormat}`;

  return { download_url: downloadUrl };
};
