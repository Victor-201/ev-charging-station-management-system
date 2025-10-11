import { Request, Response } from 'express';
import userService from '../services/userService';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

export class UserController {
  // GET /api/v1/auth/me - Get current user profile
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      // Get basic info from JWT token
      const userId = req.user!.user_id;
      const email = req.user!.email;
      const role = req.user!.role;
      
      // Get extended profile from database
      const profile = await userService.getUserById(userId);
      
      res.json({
        user_id: userId,
        email: email,
        name: profile?.name || null,
        role: role,
      });
    } catch (error) {
      logger.error('Error in getMe:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  // GET /api/v1/users - Admin: Get list of users
  async getUserList(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', size = '10', q, role, status } = req.query;
      
      // Extract token from request header to forward to auth service
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      const result = await userService.getUserList(
        {
          page: parseInt(page as string),
          size: parseInt(size as string),
          q: q as string,
          role: role as string,
          status: status as string,
        },
        token
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Error in getUserList:', error);
      
      // Forward error from auth service
      if (error.response?.data) {
        res.status(error.response.status || 500).json(error.response.data);
        return;
      }
      
      res.status(500).json({ error: 'Failed to get user list' });
    }
  }

  // GET /api/v1/users/:user_id - Get user details
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const user = await userService.getUserDetails(user_id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user_id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        vehicles: user.vehicles,
      });
    } catch (error) {
      logger.error('Error in getUserDetails:', error);
      res.status(500).json({ error: 'Failed to get user details' });
    }
  }

  // PUT /api/v1/users/:user_id - Update user information
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const updates = req.body;

      await userService.updateUser(user_id, updates);

      res.json({ status: 'updated' });
    } catch (error) {
      logger.error('Error in updateUser:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // PUT /api/v1/users/:user_id/change-password - Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { current_password, new_password } = req.body;

      const success = await userService.changePassword(user_id, current_password, new_password);

      if (!success) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      res.json({ status: 'password_changed' });
    } catch (error) {
      logger.error('Error in changePassword:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }

  // POST /api/v1/users/:user_id/deactivate - Admin: Deactivate user
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      
      // Extract token to forward to auth service
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      await userService.deactivateUser(user_id, token);

      res.json({ status: 'deactivated' });
    } catch (error: any) {
      logger.error('Error in deactivateUser:', error);
      
      // Forward error from auth service
      if (error.response?.data) {
        res.status(error.response.status || 500).json(error.response.data);
        return;
      }
      
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }

  // GET /api/v1/users/:user_id/export-data - GDPR: Export user data
  async exportUserData(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;

      const userData = await userService.exportUserData(user_id);

      // Create export directory if not exists
      const exportDir = process.env.EXPORT_DIR || './exports';
      await fs.mkdir(exportDir, { recursive: true });

      const exportFile = path.join(exportDir, `${user_id}.zip`);
      const output = await fs.open(exportFile, 'w');
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output.createWriteStream());
      archive.append(JSON.stringify(userData, null, 2), { name: 'user_data.json' });
      await archive.finalize();
      await output.close();

      const exportUrlBase = process.env.EXPORT_URL_BASE || 'http://localhost:3002/exports';
      const exportUrl = `${exportUrlBase}/${user_id}.zip`;

      res.json({ export_url: exportUrl });
    } catch (error) {
      logger.error('Error in exportUserData:', error);
      res.status(500).json({ error: 'Failed to export user data' });
    }
  }

  // DELETE /api/v1/users/:user_id/erase - GDPR: Erase user data
  async eraseUserData(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;

      // Queue erase operation (should be handled asynchronously)
      await userService.eraseUserData(user_id);

      res.status(202).json({ status: 'erase_queued' });
    } catch (error) {
      logger.error('Error in eraseUserData:', error);
      res.status(500).json({ error: 'Failed to erase user data' });
    }
  }
}

export default new UserController();
