import express from "express";
import {
  getSystemStats,
  analyzeUserBehavior,
  forecastStationDemand
} from "../controllers/analyticsAI.controller.js";

const router = express.Router();

// Hệ thống thống kê tổng hợp
router.get("/stats", getSystemStats);

// Phân tích hành vi người dùng
router.get("/users", analyzeUserBehavior);

// Dự báo nhu cầu trạm sạc
router.get("/forecast/:station_id", forecastStationDemand);

export default router;
