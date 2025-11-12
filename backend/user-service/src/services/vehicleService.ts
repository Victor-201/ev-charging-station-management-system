import axios from 'axios';
import pool from '../config/database';
import { Vehicle } from '../types';
import logger from '../utils/logger';

export class VehicleService {
  // Add vehicle for user
  async addVehicle(userId: string, vehicleData: Partial<Vehicle>): Promise<string> {
    try {
      // Look up vehicle specifications from external API
      let vehicleSpecs: Partial<Vehicle> = {};
      if (vehicleData.brand && vehicleData.model) {
        vehicleSpecs = await this.lookupVehicle(vehicleData.brand, vehicleData.model);
      }

      // Combine user data with API data
      const finalVehicleData = { ...vehicleData, ...vehicleSpecs };

      const result = await pool.query(
        `INSERT INTO vehicles (user_id, plate_number, brand, model, battery_kwh, color, year, status, usable_battery_capacity, charge_port, max_charge_power)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9, $10)
         RETURNING id`,
        [
          userId,
          finalVehicleData.plate_number,
          finalVehicleData.brand,
          finalVehicleData.model,
          finalVehicleData.battery_kwh || null,
          finalVehicleData.color || null,
          finalVehicleData.year || null,
          finalVehicleData.usable_battery_capacity || null,
          finalVehicleData.charge_port || null,
          finalVehicleData.max_charge_power || null,
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

  // Look up vehicle specifications from external API
  async lookupVehicle(make: string, model: string): Promise<Partial<Vehicle>> {
    try {
      logger.info(`Looking up vehicle specs for make: ${make}, model: ${model}`);
      const apiKey = 'EfbKAwJ8fB+SiKHDfa4Ftw==58RwKUmF40m34Wui';
      const response = await axios.get('https://api.api-ninjas.com/v1/electricvehicle',
        {
          params: { make, model },
          headers: { 'X-Api-Key': apiKey },
        }
      );

      if (response.data && response.data.length > 0) {
        const vehicleData = response.data[0];
        logger.info('Vehicle data found from API:', vehicleData);

        const specs: Partial<Vehicle> = {};
        if (vehicleData.usable_battery_capacity) {
          specs.usable_battery_capacity = vehicleData.usable_battery_capacity;
        }
        if (vehicleData.charge_port) {
          specs.charge_port = vehicleData.charge_port;
        }
        // The API might use fast_charge_power for DC charging
        if (vehicleData.fast_charge_power) {
          specs.max_charge_power = vehicleData.fast_charge_power;
        } else if (vehicleData.max_charge_power) {
          specs.max_charge_power = vehicleData.max_charge_power;
        }

        return specs;
      }

      logger.warn(`No vehicle data found for make: ${make}, model: ${model}`);
      return {};
    } catch (error: any) {
      logger.error('Error looking up vehicle from API:', error.response?.data || error.message);
      // Do not block vehicle creation if API fails, just return empty object
      return {};
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
