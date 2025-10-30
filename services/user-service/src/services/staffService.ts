import pool from '../config/database';
import logger from '../utils/logger';

interface StaffFilters {
  page?: number;
  size?: number;
  station_id?: string;
  position?: string;
  shift?: string;
  is_active?: boolean;
  q?: string; // Search query
}

interface StaffInfo {
  id: string;
  user_id: string;
  station_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  position: string;
  shift: string;
  hire_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export class StaffService {
  /**
   * Get all staff with filters and pagination
   */
  async getAllStaff(filters: StaffFilters = {}): Promise<{
    data: StaffInfo[];
    pagination: {
      page: number;
      size: number;
      total: number;
      total_pages: number;
    };
  }> {
    try {
      const page = filters.page || 1;
      const size = filters.size || 20;
      const offset = (page - 1) * size;

      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.station_id) {
        conditions.push(`station_id = $${paramIndex}`);
        params.push(filters.station_id);
        paramIndex++;
      }

      if (filters.position) {
        conditions.push(`position = $${paramIndex}`);
        params.push(filters.position);
        paramIndex++;
      }

      if (filters.shift) {
        conditions.push(`shift = $${paramIndex}`);
        params.push(filters.shift);
        paramIndex++;
      }

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex}`);
        params.push(filters.is_active);
        paramIndex++;
      }

      if (filters.q) {
        conditions.push(`(
          full_name ILIKE $${paramIndex} OR 
          email ILIKE $${paramIndex} OR 
          phone_number ILIKE $${paramIndex}
        )`);
        params.push(`%${filters.q}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM staff
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get staff data
      const dataQuery = `
        SELECT 
          id,
          user_id,
          station_id,
          full_name,
          email,
          phone_number,
          position,
          shift,
          hire_date,
          is_active,
          notes,
          created_at,
          updated_at
        FROM staff
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(size, offset);

      const result = await pool.query(dataQuery, params);

      return {
        data: result.rows,
        pagination: {
          page,
          size,
          total,
          total_pages: Math.ceil(total / size),
        },
      };
    } catch (error) {
      logger.error('Error in getAllStaff:', error);
      throw error;
    }
  }

  /**
   * Get staff details by ID
   */
  async getStaffById(staffId: string): Promise<StaffInfo | null> {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          station_id,
          full_name,
          email,
          phone_number,
          position,
          shift,
          hire_date,
          is_active,
          notes,
          created_at,
          updated_at
        FROM staff
        WHERE id = $1
      `;
      const result = await pool.query(query, [staffId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error in getStaffById:', error);
      throw error;
    }
  }

  /**
   * Get staff by user ID
   */
  async getStaffByUserId(userId: string): Promise<StaffInfo | null> {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          station_id,
          full_name,
          email,
          phone_number,
          position,
          shift,
          hire_date,
          is_active,
          notes,
          created_at,
          updated_at
        FROM staff
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error in getStaffByUserId:', error);
      throw error;
    }
  }

  /**
   * Get staff by station ID
   */
  async getStaffByStation(stationId: string): Promise<StaffInfo[]> {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          station_id,
          full_name,
          email,
          phone_number,
          position,
          shift,
          hire_date,
          is_active,
          notes,
          created_at,
          updated_at
        FROM staff
        WHERE station_id = $1 AND is_active = true
        ORDER BY 
          CASE position
            WHEN 'manager' THEN 1
            WHEN 'technician' THEN 2
            WHEN 'operator' THEN 3
          END,
          hire_date ASC
      `;
      const result = await pool.query(query, [stationId]);

      return result.rows;
    } catch (error) {
      logger.error('Error in getStaffByStation:', error);
      throw error;
    }
  }

  /**
   * Get staff statistics
   */
  async getStaffStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_staff,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_staff,
          COUNT(CASE WHEN position = 'manager' THEN 1 END) as managers,
          COUNT(CASE WHEN position = 'technician' THEN 1 END) as technicians,
          COUNT(CASE WHEN position = 'operator' THEN 1 END) as operators,
          COUNT(CASE WHEN shift = 'morning' THEN 1 END) as morning_shift,
          COUNT(CASE WHEN shift = 'afternoon' THEN 1 END) as afternoon_shift,
          COUNT(CASE WHEN shift = 'night' THEN 1 END) as night_shift,
          COUNT(DISTINCT station_id) as stations_with_staff
        FROM staff
      `;
      const result = await pool.query(query);

      return result.rows[0];
    } catch (error) {
      logger.error('Error in getStaffStatistics:', error);
      throw error;
    }
  }

  /**
   * Get staff attendance records
   */
  async getStaffAttendance(staffId: string, filters: {
    start_date?: string;
    end_date?: string;
    status?: string;
  } = {}): Promise<AttendanceRecord[]> {
    try {
      const conditions: string[] = ['staff_id = $1'];
      const params: any[] = [staffId];
      let paramIndex = 2;

      if (filters.start_date) {
        conditions.push(`work_date >= $${paramIndex}`);
        params.push(filters.start_date);
        paramIndex++;
      }

      if (filters.end_date) {
        conditions.push(`work_date <= $${paramIndex}`);
        params.push(filters.end_date);
        paramIndex++;
      }

      if (filters.status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      const query = `
        SELECT 
          id,
          staff_id,
          work_date,
          check_in,
          check_out,
          status,
          notes,
          created_at,
          updated_at
        FROM attendance
        WHERE ${conditions.join(' AND ')}
        ORDER BY work_date DESC
      `;
      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      logger.error('Error in getStaffAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a staff
   */
  async getAttendanceSummary(staffId: string, month?: string, year?: string): Promise<any> {
    try {
      const conditions: string[] = ['staff_id = $1'];
      const params: any[] = [staffId];
      let paramIndex = 2;

      if (year) {
        conditions.push(`EXTRACT(YEAR FROM work_date) = $${paramIndex}`);
        params.push(year);
        paramIndex++;
      }

      if (month) {
        conditions.push(`EXTRACT(MONTH FROM work_date) = $${paramIndex}`);
        params.push(month);
        paramIndex++;
      }

      const query = `
        SELECT 
          COUNT(*) as total_days,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days,
          COUNT(CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL THEN 1 END) as completed_days
        FROM attendance
        WHERE ${conditions.join(' AND ')}
      `;
      const result = await pool.query(query, params);

      return result.rows[0];
    } catch (error) {
      logger.error('Error in getAttendanceSummary:', error);
      throw error;
    }
  }
}

export default new StaffService();
