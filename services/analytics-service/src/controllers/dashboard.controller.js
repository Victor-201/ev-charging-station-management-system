import { listDashboards, createDashboard } from '../services/dashboard.service.js';

export const getDashboards = async (_req, res, next) => {
  try {
    const result = await listDashboards();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const postDashboard = async (req, res, next) => {
  try {
    const { name, widgets } = req.body;
    const result = await createDashboard({ name, widgets });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
