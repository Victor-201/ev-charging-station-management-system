import {
  getSystemHealth,
  getMetricsSeries,
  searchLogs,
  listActiveAlerts,
  acknowledgeAlert
} from '../services/monitoring.service.js';

export const healthCheck = async (req, res, next) => {
  try {
    const data = await getSystemHealth();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const metrics = async (req, res, next) => {
  try {
    const { metric, from, to, step } = req.query;
    const metricName = metric || 'requests_per_sec';
    const data = await getMetricsSeries({ metric: metricName, from, to, step });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const logs = async (req, res, next) => {
  try {
    const { q, from, to, level, page, size } = req.query;
    const data = await searchLogs({
      keyword: q,
      from,
      to,
      level,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const alerts = async (req, res, next) => {
  try {
    const data = await listActiveAlerts();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const acknowledge = async (req, res, next) => {
  try {
    const { alert_id: alertId, user_id: userId } = req.body;
    const result = await acknowledgeAlert({ alertId, userId });

    if (!result.success) {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    res.json({ status: 'acknowledged' });
  } catch (error) {
    next(error);
  }
};
