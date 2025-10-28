import { requestTelemetryExport } from '../services/telemetry.service.js';

export const exportTelemetry = async (req, res, next) => {
  try {
    const {
      station_id: stationId = 'ST001',
      point_id: pointId,
      from = '2025-10-01',
      to,
      format = 'zip'
    } = req.query;
    const result = await requestTelemetryExport({ stationId, pointId, from, to, format });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
