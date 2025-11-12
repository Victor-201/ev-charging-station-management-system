import pool from '../config/database';
import { Vehicle } from '../types';
import logger from '../utils/logger';

export class VehicleService {
  // Add vehicle for user
  async addVehicle(userId: string, vehicleData: Partial<Vehicle>): Promise<string> {
    try {
      const result = await pool.query(
        `INSERT INTO vehicles (user_id, plate_number, brand, model, battery_kwh, color, year, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         RETURNING id`,
        [
          userId,
          vehicleData.plate_number,
          vehicleData.brand,
          vehicleData.model,
          vehicleData.battery_kwh || null,
          vehicleData.color || null,
          vehicleData.year || null,
        ]
      );
      return result.rows[0].id;
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Vehicle with this plate number already exists');
      }
      logger.error('Error adding vehicle:', error);
      throw error;
    }
  }

  // Get vehicles by user
  async getVehiclesByUser(userId: string): Promise<Vehicle[]> {
    try {
      const result = await pool.query(
        `SELECT id AS vehicle_id, plate_number, brand, model, battery_kwh, color, year, status, created_at
         FROM vehicles WHERE user_id = $1 AND status = 'ACTIVE'
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting vehicles by user:', error);
      throw error;
    }
  }

  // Get vehicle details
  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    try {
      const result = await pool.query(
        `SELECT id AS vehicle_id, user_id, plate_number, brand, model, battery_kwh, color, year, status, created_at, updated_at
         FROM vehicles WHERE id = $1`,
        [vehicleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting vehicle by ID:', error);
      throw error;
    }
  }

  // Update vehicle
  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.plate_number !== undefined) {
        setClauses.push(`plate_number = $${paramIndex}`);
        params.push(updates.plate_number);
        paramIndex++;
      }

      if (updates.brand !== undefined) {
        setClauses.push(`brand = $${paramIndex}`);
        params.push(updates.brand);
        paramIndex++;
      }

      if (updates.model !== undefined) {
        setClauses.push(`model = $${paramIndex}`);
        params.push(updates.model);
        paramIndex++;
      }

      if (updates.battery_kwh !== undefined) {
        setClauses.push(`battery_kwh = $${paramIndex}`);
        params.push(updates.battery_kwh);
        paramIndex++;
      }

      if (updates.color !== undefined) {
        setClauses.push(`color = $${paramIndex}`);
        params.push(updates.color);
        paramIndex++;
      }

      if (updates.year !== undefined) {
        setClauses.push(`year = $${paramIndex}`);
        params.push(updates.year);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(vehicleId);

      await pool.query(
        `UPDATE vehicles SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        params
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Vehicle with this plate number already exists');
      }
      logger.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle (soft delete)
  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE vehicles SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [vehicleId]
      );
    } catch (error) {
      logger.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Check vehicle ownership
  async checkVehicleOwnership(vehicleId: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
        [vehicleId, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking vehicle ownership:', error);
      throw error;
    }
  }
}

export default new VehicleService();
