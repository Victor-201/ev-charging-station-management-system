import { Request, Response } from 'express';
import vehicleService from '../services/vehicleService';
import logger from '../utils/logger';

export class VehicleController {
  // POST /api/v1/users/:user_id/vehicles - Add vehicle
  async addVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const vehicleData = req.body;

      const vehicleId = await vehicleService.addVehicle(user_id, vehicleData);

      res.status(201).json({
        vehicle_id: vehicleId,
        status: 'created',
      });
    } catch (error: any) {
      logger.error('Error in addVehicle:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add vehicle' });
      }
    }
  }

  // GET /api/v1/users/:user_id/vehicles - Get user vehicles
  async getUserVehicles(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;

      const vehicles = await vehicleService.getVehiclesByUser(user_id);

      res.json({ vehicles });
    } catch (error) {
      logger.error('Error in getUserVehicles:', error);
      res.status(500).json({ error: 'Failed to get vehicles' });
    }
  }

  // GET /api/v1/vehicles/:vehicle_id - Get vehicle details
  async getVehicleDetails(req: Request, res: Response): Promise<void> {
    try {
      const { vehicle_id } = req.params;

      const vehicle = await vehicleService.getVehicleById(vehicle_id);

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      res.json(vehicle);
    } catch (error) {
      logger.error('Error in getVehicleDetails:', error);
      res.status(500).json({ error: 'Failed to get vehicle details' });
    }
  }

  // PUT /api/v1/vehicles/:vehicle_id - Update vehicle
  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicle_id } = req.params;
      const updates = req.body;

      // Check ownership
      const userId = req.user!.user_id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isAdmin) {
        const isOwner = await vehicleService.checkVehicleOwnership(vehicle_id, userId);
        if (!isOwner) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      await vehicleService.updateVehicle(vehicle_id, updates);

      res.json({ status: 'updated' });
    } catch (error: any) {
      logger.error('Error in updateVehicle:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update vehicle' });
      }
    }
  }

  // DELETE /api/v1/vehicles/:vehicle_id - Delete vehicle
  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicle_id } = req.params;

      // Check ownership
      const userId = req.user!.user_id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isAdmin) {
        const isOwner = await vehicleService.checkVehicleOwnership(vehicle_id, userId);
        if (!isOwner) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      await vehicleService.deleteVehicle(vehicle_id);

      res.json({ status: 'deleted' });
    } catch (error) {
      logger.error('Error in deleteVehicle:', error);
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  }
}

export default new VehicleController();
