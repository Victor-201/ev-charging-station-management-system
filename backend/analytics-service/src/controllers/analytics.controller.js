import {
  getUserMonthlyReport,
  getStationDailyReport,
  getRevenueReport,
  startForecastTraining,
  getStationForecast
} from '../services/analytics.service.js';

export const userMonthly = async (req, res, next) => {
  try {
    const { user_id: userId } = req.params;
    const { month = '2025-09' } = req.query;
    const report = await getUserMonthlyReport({ userId, month });

    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const stationDaily = async (req, res, next) => {
  try {
    const { station_id: stationId } = req.params;
    const { date = '2025-10-01' } = req.query;
    const report = await getStationDailyReport({ stationId, date });

    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const revenueReport = async (req, res, next) => {
  try {
    const {
      station_id: stationId,
      from = '2025-09-01',
      to = '2025-10-31',
      group_by: groupBy
    } = req.query;
    const report = await getRevenueReport({ stationId, from, to, groupBy });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const forecastTrain = async (req, res, next) => {
  try {
    const { model, stations, from, to } = req.body;
    const job = await startForecastTraining({ model, stations, from, to });
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
};

export const stationForecast = async (req, res, next) => {
  try {
    const { station_id: stationId } = req.params;
    const { horizon_days: horizonDays } = req.query;
    const report = await getStationForecast({ stationId, horizonDays: Number(horizonDays) });
    res.json(report);
  } catch (error) {
    next(error);
  }
};
