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
          u.full_name ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex} OR 
          u.phone_number ILIKE $${paramIndex}
        )`);
        params.push(`%${filters.q}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM staff s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get staff data with user info
      const dataQuery = `
        SELECT 
          s.id,
          s.user_id,
          s.station_id,
          u.full_name,
          u.email,
          u.phone_number,
          s.position,
          s.shift,
          s.hire_date,
          s.is_active,
          s.notes,
          s.created_at,
          s.updated_at
        FROM staff s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
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
          s.id,
          s.user_id,
          s.station_id,
          u.full_name,
          u.email,
          u.phone_number,
          s.position,
          s.shift,
          s.hire_date,
          s.is_active,
          s.notes,
          s.created_at,
          s.updated_at
        FROM staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
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
          s.id,
          s.user_id,
          s.station_id,
          u.full_name,
          u.email,
          u.phone_number,
          s.position,
          s.shift,
          s.hire_date,
          s.is_active,
          s.notes,
          s.created_at,
          s.updated_at
        FROM staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1
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
          s.id,
          s.user_id,
          s.station_id,
          u.full_name,
          u.email,
          u.phone_number,
          s.position,
          s.shift,
          s.hire_date,
          s.is_active,
          s.notes,
          s.created_at,
          s.updated_at
        FROM staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.station_id = $1 AND s.is_active = true
        ORDER BY 
          CASE s.position
            WHEN 'manager' THEN 1
            WHEN 'technician' THEN 2
            WHEN 'operator' THEN 3
          END,
          s.hire_date ASC
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

  /**
   * Create new staff member
   */
  async createStaff(data: {
    user_id: string;
    station_id: string;
    position?: string;
    shift?: string;
    hire_date?: Date;
    notes?: string;
  }): Promise<StaffInfo> {
    try {
      const result = await pool.query(
        `INSERT INTO staff (user_id, station_id, position, shift, hire_date, is_active, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, station_id, position, shift, hire_date, is_active, notes, created_at, updated_at`,
        [
          data.user_id,
          data.station_id,
          data.position || 'operator',
          data.shift || 'morning',
          data.hire_date || new Date(),
          true,
          data.notes || null,
        ]
      );

      // Get user info to return complete staff info
      const userResult = await pool.query(
        `SELECT full_name, email, phone FROM users WHERE id = $1`,
        [data.user_id]
      );

      return {
        ...result.rows[0],
        full_name: userResult.rows[0]?.full_name || '',
        email: userResult.rows[0]?.email || '',
        phone_number: userResult.rows[0]?.phone || '',
      };
    } catch (error) {
      logger.error('Error in createStaff:', error);
      throw error;
    }
  }

  /**
   * Update staff information
   */
  async updateStaff(staffId: string, data: {
    station_id?: string;
    position?: string;
    shift?: string;
    hire_date?: Date;
    is_active?: boolean;
    notes?: string;
  }): Promise<StaffInfo> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.station_id !== undefined) {
        setClauses.push(`station_id = $${paramIndex}`);
        params.push(data.station_id);
        paramIndex++;
      }

      if (data.position !== undefined) {
        setClauses.push(`position = $${paramIndex}`);
        params.push(data.position);
        paramIndex++;
      }

      if (data.shift !== undefined) {
        setClauses.push(`shift = $${paramIndex}`);
        params.push(data.shift);
        paramIndex++;
      }

      if (data.hire_date !== undefined) {
        setClauses.push(`hire_date = $${paramIndex}`);
        params.push(data.hire_date);
        paramIndex++;
      }

      if (data.is_active !== undefined) {
        setClauses.push(`is_active = $${paramIndex}`);
        params.push(data.is_active);
        paramIndex++;
      }

      if (data.notes !== undefined) {
        setClauses.push(`notes = $${paramIndex}`);
        params.push(data.notes);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(staffId);

      const result = await pool.query(
        `UPDATE staff
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, user_id, station_id, position, shift, hire_date, is_active, notes, created_at, updated_at`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error('Staff not found');
      }

      // Get user info to return complete staff info
      const userResult = await pool.query(
        `SELECT full_name, email, phone FROM users WHERE id = $1`,
        [result.rows[0].user_id]
      );

      return {
        ...result.rows[0],
        full_name: userResult.rows[0]?.full_name || '',
        email: userResult.rows[0]?.email || '',
        phone_number: userResult.rows[0]?.phone || '',
      };
    } catch (error) {
      logger.error('Error in updateStaff:', error);
      throw error;
    }
  }

  /**
   * Delete staff member (soft delete by setting is_active = false)
   */
  async deleteStaff(staffId: string): Promise<void> {
    try {
      const result = await pool.query(
        `UPDATE staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [staffId]
      );

      if (result.rowCount === 0) {
        throw new Error('Staff not found');
      }
    } catch (error) {
      logger.error('Error in deleteStaff:', error);
      throw error;
    }
  }
}

export default new StaffService();
