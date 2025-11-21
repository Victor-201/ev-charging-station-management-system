import express from 'express';
import userController from '../controllers/userController';
import vehicleController from '../controllers/vehicleController';
import subscriptionController from '../controllers/subscriptionController';
import walletController from '../controllers/walletController';
import notificationController from '../controllers/notificationController';
import fcmRoutes from './fcmRoutes';
import staffRoutes from './staffRoutes';
import { authenticate, authorize, authorizeOwner } from '../middlewares/authMiddleware';
import { validate, updateUserSchema, changePasswordSchema, addVehicleSchema, updateVehicleSchema, subscriptionSchema, withdrawSchema, notificationSchema, scheduleNotificationSchema } from '../middlewares/validation';

const router = express.Router();

// ==================== STAFF ROUTES ====================
router.use('/staff', staffRoutes);

// ==================== USER ROUTES ====================


// GET /api/v1/users/profile - Get current user profile (convenience route)
router.get('/users/profile', authenticate, userController.getMe);



// GET /api/v1/users - Admin: Get list of users
router.get('/users', authenticate, authorize('admin'), userController.getUserList);

// GET /api/v1/users/:user_id - Get user details
router.get('/users/:user_id', authenticate, authorize('admin', 'staff'), userController.getUserDetails);

// PUT /api/v1/users/:user_id - Update user information
router.put('/users/:user_id', authenticate, authorizeOwner, validate(updateUserSchema), userController.updateUser);

// PUT /api/v1/users/:user_id/change-password - Change password
router.put('/users/:user_id/change-password', authenticate, authorizeOwner, validate(changePasswordSchema), userController.changePassword);

// POST /api/v1/users/:user_id/deactivate - Admin: Deactivate user
router.post('/users/:user_id/deactivate', authenticate, authorize('admin'), userController.deactivateUser);

// POST /api/v1/users/:user_id/activate - Admin: Activate user (reactivate)
router.post('/users/:user_id/activate', authenticate, authorize('admin'), userController.activateUser);

// GET /api/v1/users/:user_id/export-data - GDPR: Export user data
router.get('/users/:user_id/export-data', authenticate, authorizeOwner, userController.exportUserData);

// DELETE /api/v1/users/:user_id/erase - GDPR: Erase user data
router.delete('/users/:user_id/erase', authenticate, authorizeOwner, userController.eraseUserData);


// GET /api/v1/users/:user_id/social-accounts - Get linked social accounts
router.get('/users/:user_id/social-accounts', authenticate, authorizeOwner, userController.getSocialAccounts);

// DELETE /api/v1/users/:user_id/social-accounts/:provider - Unlink a social account
router.delete('/users/:user_id/social-accounts/:provider', authenticate, authorizeOwner, userController.unlinkSocialAccount);


// GET /api/v1/users/:user_id/notifications/settings - Get notification settings
router.get('/users/:user_id/notifications/settings', authenticate, authorizeOwner, notificationController.getNotificationSettings);

// PUT /api/v1/users/:user_id/notifications/settings - Update notification settings
router.put('/users/:user_id/notifications/settings', authenticate, authorizeOwner, notificationController.updateNotificationSettings);

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


// POST /api/v1/vehicles/lookup - Look up vehicle specs from external API
// router.post('/vehicles/lookup', authenticate, vehicleController.lookupVehicle);

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
// GET /api/v1/notifications/:user_id - Get user notifications (inbox)
router.get('/notifications/:user_id', authenticate, authorizeOwner, notificationController.getNotifications);

// PUT /api/v1/notifications/:notification_id/read - Mark notification as read
router.put('/notifications/:notification_id/read', authenticate, notificationController.markAsRead);

// PUT /api/v1/notifications/:user_id/read-all - Mark all notifications as read
router.put('/notifications/:user_id/read-all', authenticate, authorizeOwner, notificationController.markAllAsRead);

// POST /api/v1/notifications/send - Send notification (service-to-service or internal)
router.post('/notifications/send', authenticate, validate(notificationSchema), notificationController.sendNotification);

// POST /api/v1/notifications/schedule - Schedule notification
router.post('/notifications/schedule', authenticate, validate(scheduleNotificationSchema), notificationController.scheduleNotification);

// POST /api/v1/webhooks/bookings - Booking webhook (no auth - signature verified in controller)
router.post('/webhooks/bookings', notificationController.handleBookingWebhook);

// ==================== FCM PUSH NOTIFICATION ROUTES ====================
router.use('/notifications/fcm', fcmRoutes);

export default router;
