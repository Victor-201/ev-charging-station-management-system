import express from 'express';
import userController from '../controllers/userController';
import vehicleController from '../controllers/vehicleController';
import subscriptionController from '../controllers/subscriptionController';
import walletController from '../controllers/walletController';
import notificationController from '../controllers/notificationController';
import fcmRoutes from './fcmRoutes';
import { authenticate, authorize, authorizeOwner } from '../middlewares/authMiddleware';
import { validate, updateUserSchema, changePasswordSchema, addVehicleSchema, updateVehicleSchema, subscriptionSchema, withdrawSchema, notificationSchema, scheduleNotificationSchema } from '../middlewares/validation';

const router = express.Router();

// ==================== USER ROUTES ====================
// GET /api/v1/auth/me - Get current user profile
router.get('/auth/me', authenticate, userController.getMe);

// GET /api/v1/users - Admin: Get list of users
router.get('/users', authenticate, authorize('admin'), userController.getUserList);

// GET /api/v1/users/:user_id - Get user details
router.get('/users/:user_id', authenticate, authorizeOwner, userController.getUserDetails);

// PUT /api/v1/users/:user_id - Update user information
router.put('/users/:user_id', authenticate, authorizeOwner, validate(updateUserSchema), userController.updateUser);

// PUT /api/v1/users/:user_id/change-password - Change password
router.put('/users/:user_id/change-password', authenticate, authorizeOwner, validate(changePasswordSchema), userController.changePassword);

// POST /api/v1/users/:user_id/deactivate - Admin: Deactivate user
router.post('/users/:user_id/deactivate', authenticate, authorize('admin'), userController.deactivateUser);

// GET /api/v1/users/:user_id/export-data - GDPR: Export user data
router.get('/users/:user_id/export-data', authenticate, authorizeOwner, userController.exportUserData);

// DELETE /api/v1/users/:user_id/erase - GDPR: Erase user data
router.delete('/users/:user_id/erase', authenticate, authorizeOwner, userController.eraseUserData);

// ==================== VEHICLE ROUTES ====================
// POST /api/v1/users/:user_id/vehicles - Add vehicle
router.post('/users/:user_id/vehicles', authenticate, authorizeOwner, validate(addVehicleSchema), vehicleController.addVehicle);

// GET /api/v1/users/:user_id/vehicles - Get user vehicles
router.get('/users/:user_id/vehicles', authenticate, authorizeOwner, vehicleController.getUserVehicles);

// GET /api/v1/vehicles/:vehicle_id - Get vehicle details
router.get('/vehicles/:vehicle_id', authenticate, vehicleController.getVehicleDetails);

// PUT /api/v1/vehicles/:vehicle_id - Update vehicle
router.put('/vehicles/:vehicle_id', authenticate, validate(updateVehicleSchema), vehicleController.updateVehicle);

// DELETE /api/v1/vehicles/:vehicle_id - Delete vehicle
router.delete('/vehicles/:vehicle_id', authenticate, vehicleController.deleteVehicle);

// ==================== SUBSCRIPTION ROUTES ====================
// GET /api/v1/users/:user_id/subscriptions - Get user subscriptions
router.get('/users/:user_id/subscriptions', authenticate, authorizeOwner, subscriptionController.getUserSubscriptions);

// POST /api/v1/users/:user_id/subscriptions - Subscribe to plan
router.post('/users/:user_id/subscriptions', authenticate, authorizeOwner, validate(subscriptionSchema), subscriptionController.subscribeToPlan);

// POST /api/v1/users/:user_id/subscriptions/:subscription_id/cancel - Cancel subscription
router.post('/users/:user_id/subscriptions/:subscription_id/cancel', authenticate, authorizeOwner, subscriptionController.cancelSubscription);

// ==================== WALLET ROUTES ====================
// POST /api/v1/wallets/:user_id/topup/callback - Topup callback (webhook, no auth)
router.post('/wallets/:user_id/topup/callback', walletController.handleTopupCallback);

// POST /api/v1/wallets/:user_id/withdraw - Withdraw request
router.post('/wallets/:user_id/withdraw', authenticate, authorizeOwner, validate(withdrawSchema), walletController.requestWithdrawal);

// GET /api/v1/wallets/:user_id/transactions - Get transaction history
router.get('/wallets/:user_id/transactions', authenticate, authorizeOwner, walletController.getTransactions);

// ==================== NOTIFICATION ROUTES ====================
// GET /api/v1/notifications/:user_id - Get user notifications
router.get('/notifications/:user_id', authenticate, authorizeOwner, notificationController.getNotifications);

// POST /api/v1/notifications/send - Send notification (service-to-service)
router.post('/notifications/send', authenticate, validate(notificationSchema), notificationController.sendNotification);

// POST /api/v1/notifications/schedule - Schedule notification
router.post('/notifications/schedule', authenticate, validate(scheduleNotificationSchema), notificationController.scheduleNotification);

// POST /api/v1/webhooks/bookings - Booking webhook (no auth - signature verified in controller)
router.post('/webhooks/bookings', notificationController.handleBookingWebhook);

// ==================== FCM PUSH NOTIFICATION ROUTES ====================
router.use('/notifications/fcm', fcmRoutes);

export default router;
