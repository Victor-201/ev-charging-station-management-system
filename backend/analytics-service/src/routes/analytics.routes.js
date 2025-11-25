// routes/analytics.routes.js
import { Router } from "express";
import {
  getMonitoringHealth,
  getMonitoringMetrics,
  getMonitoringLogs,
  getMonitoringAlerts,
  acknowledgeAlert,

  usersMonthlyList,
  stationsMonthlyList,
  revenueReport,

  forecastTrain,
  stationForecast,
} from "../controllers/analytics.controller.js";

const router = Router();

/* =============== MONITORING (prefix /api/v1/analytics) ================= */
router.get("/monitoring/health", getMonitoringHealth);
router.get("/monitoring/metrics", getMonitoringMetrics);
router.get("/monitoring/logs", getMonitoringLogs);
router.get("/monitoring/alerts", getMonitoringAlerts);
router.post("/monitoring/alerts/ack", acknowledgeAlert);

/* =============== ANALYTICS LIST MODE ================= */
router.get("/reports/users/monthly", usersMonthlyList);
router.get("/reports/stations/monthly", stationsMonthlyList);

/* =============== OPTIONAL REVENUE SUMMARY ================= */
router.get("/reports/revenue", revenueReport);

/* =============== FORECAST ================== */
router.post("/forecast/train", forecastTrain);
router.get("/forecast/:station_id", stationForecast);

export default router;
