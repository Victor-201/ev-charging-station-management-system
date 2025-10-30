import pool from '../config/database';
import logger from '../utils/logger';

interface StaffFilters {
  page?: number;
  size?: number;
  station_id?: string;
  staff_level?: string;
  employment_status?: string;
  department?: string;
  q?: string; // Search query
}

interface StaffInfo {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  station_id: string | null;
  staff_level: string;
  position: string | null;
  department: string | null;
  employee_code: string | null;
  hire_date: string | null;
  employment_status: string;
  salary_grade: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  certifications: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffDetails extends StaffInfo {
  work_history?: any[];
  upcoming_shifts?: any[];
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
        conditions.push(`si.station_id = $${paramIndex}`);
        params.push(filters.station_id);
        paramIndex++;
      }

      if (filters.staff_level) {
        conditions.push(`si.staff_level = $${paramIndex}`);
        params.push(filters.staff_level);
        paramIndex++;
      }

      if (filters.employment_status) {
        conditions.push(`si.employment_status = $${paramIndex}`);
        params.push(filters.employment_status);
        paramIndex++;
      }

      if (filters.department) {
        conditions.push(`si.department = $${paramIndex}`);
        params.push(filters.department);
        paramIndex++;
      }

      if (filters.q) {
        conditions.push(`(
          u.full_name ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex} OR 
          si.employee_code ILIKE $${paramIndex} OR
          si.position ILIKE $${paramIndex}
        )`);
        params.push(`%${filters.q}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM staff_info si
        JOIN users u ON si.user_id = u.id
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get staff data
      const dataQuery = `
        SELECT 
          si.id,
          si.user_id,
          u.email,
          u.full_name,
          u.phone_number,
          si.station_id,
          si.staff_level,
          si.position,
          si.department,
          si.employee_code,
          si.hire_date,
          si.employment_status,
          si.salary_grade,
          si.emergency_contact_name,
          si.emergency_contact_phone,
          si.certifications,
          si.notes,
          si.created_at,
          si.updated_at
        FROM staff_info si
        JOIN users u ON si.user_id = u.id
        ${whereClause}
        ORDER BY si.created_at DESC
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
  async getStaffById(staffId: string): Promise<StaffDetails | null> {
    try {
      const query = `
        SELECT 
          si.id,
          si.user_id,
          u.email,
          u.full_name,
          u.phone_number,
          si.station_id,
          si.staff_level,
          si.position,
          si.department,
          si.employee_code,
          si.hire_date,
          si.employment_status,
          si.salary_grade,
          si.emergency_contact_name,
          si.emergency_contact_phone,
          si.certifications,
          si.notes,
          si.created_at,
          si.updated_at
        FROM staff_info si
        JOIN users u ON si.user_id = u.id
        WHERE si.id = $1
      `;
      const result = await pool.query(query, [staffId]);

      if (result.rows.length === 0) {
        return null;
      }

      const staff = result.rows[0];

      // Get work history
      const historyQuery = `
        SELECT 
          id,
          action_type,
          old_station_id,
          new_station_id,
          old_level,
          new_level,
          old_position,
          new_position,
          reason,
          effective_date,
          approved_by,
          created_at
        FROM staff_work_history
        WHERE staff_info_id = $1
        ORDER BY effective_date DESC
        LIMIT 10
      `;
      const historyResult = await pool.query(historyQuery, [staffId]);

      // Get upcoming shifts
      const shiftsQuery = `
        SELECT 
          id,
          station_id,
          shift_date,
          shift_type,
          start_time,
          end_time,
          status,
          check_in_time,
          check_out_time,
          notes
        FROM staff_shifts
        WHERE staff_info_id = $1 
          AND shift_date >= CURRENT_DATE
          AND status IN ('SCHEDULED', 'COMPLETED')
        ORDER BY shift_date ASC, start_time ASC
        LIMIT 10
      `;
      const shiftsResult = await pool.query(shiftsQuery, [staffId]);

      return {
        ...staff,
        work_history: historyResult.rows,
        upcoming_shifts: shiftsResult.rows,
      };
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
          si.id,
          si.user_id,
          u.email,
          u.full_name,
          u.phone_number,
          si.station_id,
          si.staff_level,
          si.position,
          si.department,
          si.employee_code,
          si.hire_date,
          si.employment_status,
          si.salary_grade,
          si.emergency_contact_name,
          si.emergency_contact_phone,
          si.certifications,
          si.notes,
          si.created_at,
          si.updated_at
        FROM staff_info si
        JOIN users u ON si.user_id = u.id
        WHERE si.user_id = $1
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
          si.id,
          si.user_id,
          u.email,
          u.full_name,
          u.phone_number,
          si.station_id,
          si.staff_level,
          si.position,
          si.department,
          si.employee_code,
          si.hire_date,
          si.employment_status,
          si.salary_grade,
          si.emergency_contact_name,
          si.emergency_contact_phone,
          si.certifications,
          si.notes,
          si.created_at,
          si.updated_at
        FROM staff_info si
        JOIN users u ON si.user_id = u.id
        WHERE si.station_id = $1 
          AND si.employment_status = 'ACTIVE'
        ORDER BY 
          CASE si.staff_level
            WHEN 'SENIOR_MANAGER' THEN 1
            WHEN 'MANAGER' THEN 2
            WHEN 'SUPERVISOR' THEN 3
            WHEN 'STAFF' THEN 4
          END,
          si.hire_date ASC
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
          COUNT(CASE WHEN employment_status = 'ACTIVE' THEN 1 END) as active_staff,
          COUNT(CASE WHEN employment_status = 'ON_LEAVE' THEN 1 END) as on_leave,
          COUNT(CASE WHEN employment_status = 'SUSPENDED' THEN 1 END) as suspended,
          COUNT(CASE WHEN staff_level = 'SENIOR_MANAGER' THEN 1 END) as senior_managers,
          COUNT(CASE WHEN staff_level = 'MANAGER' THEN 1 END) as managers,
          COUNT(CASE WHEN staff_level = 'SUPERVISOR' THEN 1 END) as supervisors,
          COUNT(CASE WHEN staff_level = 'STAFF' THEN 1 END) as staff_members,
          COUNT(DISTINCT station_id) as stations_with_staff,
          COUNT(DISTINCT department) as departments
        FROM staff_info
      `;
      const result = await pool.query(query);

      return result.rows[0];
    } catch (error) {
      logger.error('Error in getStaffStatistics:', error);
      throw error;
    }
  }

  /**
   * Get staff shifts
   */
  async getStaffShifts(staffId: string, filters: {
    start_date?: string;
    end_date?: string;
    status?: string;
  } = {}): Promise<any[]> {
    try {
      const conditions: string[] = ['staff_info_id = $1'];
      const params: any[] = [staffId];
      let paramIndex = 2;

      if (filters.start_date) {
        conditions.push(`shift_date >= $${paramIndex}`);
        params.push(filters.start_date);
        paramIndex++;
      }

      if (filters.end_date) {
        conditions.push(`shift_date <= $${paramIndex}`);
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
          station_id,
          shift_date,
          shift_type,
          start_time,
          end_time,
          status,
          check_in_time,
          check_out_time,
          notes,
          created_at,
          updated_at
        FROM staff_shifts
        WHERE ${conditions.join(' AND ')}
        ORDER BY shift_date DESC, start_time ASC
      `;
      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      logger.error('Error in getStaffShifts:', error);
      throw error;
    }
  }
}

export default new StaffService();
