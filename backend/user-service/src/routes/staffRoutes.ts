import express from 'express';
import staffController from '../controllers/staffController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// ==================== STAFF ROUTES ====================

// GET /api/v1/staff - Get all staff with filters (Admin, Station Owner, Manager)
router.get(
  '/',
  authenticate,
  authorize('admin', 'station_owner', 'staff'),
  staffController.getAllStaff
);

// GET /api/v1/staff/statistics - Get staff statistics (Admin only)
router.get(
  '/statistics',
  authenticate,
  authorize('admin'),
  staffController.getStaffStatistics
);

// GET /api/v1/staff/station/:station_id - Get all staff at a station
router.get(
  '/station/:station_id',
  authenticate,
  authorize('admin', 'station_owner', 'staff'),
  staffController.getStaffByStation
);

// GET /api/v1/staff/user/:user_id - Get staff info by user ID
router.get(
  '/user/:user_id',
  authenticate,
  staffController.getStaffByUserId
);

// GET /api/v1/staff/:staff_id/shifts - Get staff shifts
router.get(
  '/:staff_id/attendance',
  authenticate,
  authorize('admin', 'station_owner', 'staff'),
  staffController.getStaffAttendance
);

// GET /api/v1/staff/:staff_id/attendance/summary - Get attendance summary
router.get(
  '/:staff_id/attendance/summary',
  authenticate,
  authorize('admin', 'station_owner', 'staff'),
  staffController.getAttendanceSummary
);

// GET /api/v1/staff/:staff_id - Get staff details by ID
router.get(
  '/:staff_id',
  authenticate,
  authorize('admin', 'station_owner', 'staff'),
  staffController.getStaffById
);

export default router;
