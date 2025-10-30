import { Request, Response } from 'express';
import staffService from '../services/staffService';
import logger from '../utils/logger';

export class StaffController {
  /**
   * GET /api/v1/staff - Get all staff with filters
   */
  async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      const { page, size, station_id, staff_level, employment_status, department, q } = req.query;

      const result = await staffService.getAllStaff({
        page: page ? parseInt(page as string) : undefined,
        size: size ? parseInt(size as string) : undefined,
        station_id: station_id as string,
        staff_level: staff_level as string,
        employment_status: employment_status as string,
        department: department as string,
        q: q as string,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in getAllStaff:', error);
      res.status(500).json({ error: 'Failed to get staff list' });
    }
  }

  /**
   * GET /api/v1/staff/:staff_id - Get staff details by ID
   */
  async getStaffById(req: Request, res: Response): Promise<void> {
    try {
      const { staff_id } = req.params;

      const staff = await staffService.getStaffById(staff_id);

      if (!staff) {
        res.status(404).json({ error: 'Staff not found' });
        return;
      }

      res.json(staff);
    } catch (error) {
      logger.error('Error in getStaffById:', error);
      res.status(500).json({ error: 'Failed to get staff details' });
    }
  }

  /**
   * GET /api/v1/staff/user/:user_id - Get staff info by user ID
   */
  async getStaffByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;

      const staff = await staffService.getStaffByUserId(user_id);

      if (!staff) {
        res.status(404).json({ error: 'Staff not found for this user' });
        return;
      }

      res.json(staff);
    } catch (error) {
      logger.error('Error in getStaffByUserId:', error);
      res.status(500).json({ error: 'Failed to get staff details' });
    }
  }

  /**
   * GET /api/v1/staff/station/:station_id - Get all staff at a station
   */
  async getStaffByStation(req: Request, res: Response): Promise<void> {
    try {
      const { station_id } = req.params;

      const staff = await staffService.getStaffByStation(station_id);

      res.json({
        station_id,
        total: staff.length,
        staff,
      });
    } catch (error) {
      logger.error('Error in getStaffByStation:', error);
      res.status(500).json({ error: 'Failed to get station staff' });
    }
  }

  /**
   * GET /api/v1/staff/statistics - Get staff statistics
   */
  async getStaffStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const statistics = await staffService.getStaffStatistics();

      res.json(statistics);
    } catch (error) {
      logger.error('Error in getStaffStatistics:', error);
      res.status(500).json({ error: 'Failed to get staff statistics' });
    }
  }

  /**
   * GET /api/v1/staff/:staff_id/shifts - Get staff shifts
   */
  async getStaffAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { staff_id } = req.params;
      const { start_date, end_date, status } = req.query;

      const attendance = await staffService.getStaffAttendance(staff_id, {
        start_date: start_date as string,
        end_date: end_date as string,
        status: status as string,
      });

      res.json({
        staff_id,
        total: attendance.length,
        attendance,
      });
    } catch (error) {
      logger.error('Error in getStaffAttendance:', error);
      res.status(500).json({ error: 'Failed to get staff attendance' });
    }
  }

  /**
   * GET /api/v1/staff/:staff_id/attendance/summary - Get attendance summary
   */
  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { staff_id } = req.params;
      const { month, year } = req.query;

      const summary = await staffService.getAttendanceSummary(
        staff_id,
        month as string,
        year as string
      );

      res.json({
        staff_id,
        month: month || 'all',
        year: year || 'all',
        summary,
      });
    } catch (error) {
      logger.error('Error in getAttendanceSummary:', error);
      res.status(500).json({ error: 'Failed to get attendance summary' });
    }
  }
}

export default new StaffController();
