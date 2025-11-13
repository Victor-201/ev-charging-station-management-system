export const ENDPOINTS = {
  // ==================== AUTH SERVICE (Port 3001) ====================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    RESEND_VERIFICATION_CODE: '/auth/resend-verification-code',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH: '/auth/refresh-token',
    OAUTH_LOGIN: '/auth/login/oauth',
    LINK_PROVIDER: '/auth/link-provider',
    UNLINK_PROVIDER: '/auth/unlink-provider',
    ME: '/auth/me',
    // Admin endpoints
    USERS_LIST: '/auth/users',
    DEACTIVATE_USER: '/auth/users/:user_id/deactivate',
  },

  // ==================== USER SERVICE (Port 3002) ====================
  USER: {
    ME: '/auth/me',
    PROFILE: '/users/profile',
    GET_USER: '/users/:user_id',
    UPDATE_USER: '/users/:user_id',
    CHANGE_PASSWORD: '/users/:user_id/change-password',
    DEACTIVATE: '/users/:user_id/deactivate',
    EXPORT_DATA: '/users/:user_id/export-data',
    ERASE_DATA: '/users/:user_id/erase',
        LIST: '/users',
    SOCIAL: {
      LIST: '/users/:user_id/social-accounts',
      UNLINK: '/users/:user_id/social-accounts/:provider',
    },
  },

  // Vehicle Management
  VEHICLE: {
    ADD: '/users/:user_id/vehicles',
    LIST: '/users/:user_id/vehicles',
    CURRENT_USER_VEHICLES: '/users/vehicles',
    DETAIL: '/vehicles/:vehicle_id',
    UPDATE: '/vehicles/:vehicle_id',
    DELETE: '/vehicles/:vehicle_id',
  },
    LOOKUP: '/vehicles/lookup',

  // Wallet Management
  WALLET: {
    TRANSACTIONS: '/payments/wallet/:user_id/transactions',
    WITHDRAW: '/payments/wallet/:user_id/withdraw',
    TOPUP_CALLBACK: '/payments/wallet/topup/callback',
  },

  // Subscription Management
  SUBSCRIPTION: {
    LIST: '/users/:user_id/subscriptions',
    SUBSCRIBE: '/users/:user_id/subscriptions',
    CANCEL: '/users/:user_id/subscriptions/:subscription_id/cancel',
  },

  // Notification Management
  NOTIFICATION: {
    LIST: '/notifications/:user_id',
    MARK_READ: '/notifications/:notification_id/read',
    MARK_ALL_READ: '/notifications/:user_id/read-all',
    SEND: '/notifications/send',
    SCHEDULE: '/notifications/schedule',
    FCM_REGISTER: '/notifications/fcm/register',
    FCM_UNREGISTER: '/notifications/fcm/unregister',
    GET_SETTINGS: '/users/:user_id/notifications/settings',
    UPDATE_SETTINGS: '/users/:user_id/notifications/settings',
  },

  // ==================== STATION SERVICE (Port 3003) ====================
  STATION: {
    SEARCH: '/stations/search',
    LIST: '/stations',
    DETAIL: '/stations/:id',
    CONNECTORS: '/stations/:id/connectors',
    PRICING: '/stations/:id/pricing',
    REPORT_ISSUE: '/stations/:id/report-issue',
    SCHEDULE_MAINTENANCE: '/stations/:id/maintenance',
    // Admin endpoints
    CREATE: '/stations',
    UPDATE: '/stations/:id',
    DELETE: '/stations/:id',
  },

  // ==================== CHARGING CONTROL SERVICE (Port 4002) ====================
  // Booking/Reservation
  BOOKING: {
    CHECK: '/booking/check',                      // Check availability
    CREATE: '/booking',                           // Create new reservation
    LIST: '/booking/user/:user_id',               // Get user's reservations
    DETAIL: '/booking/:reservation_id',           // Get reservation detail
    UPDATE: '/booking/:reservation_id',           // Update reservation
    CANCEL: '/booking/:reservation_id',           // Cancel reservation
    AUTO_CANCEL: '/booking/auto-cancel',          // Auto-cancel expired reservations
    // Waitlist
    WAITLIST_ADD: '/booking/waitlist',            // Add to waitlist
    WAITLIST_GET: '/booking/waitlist/:station_id', // Get station waitlist
    WAITLIST_UPDATE: '/booking/waitlist/:waitlist_id/status', // Update waitlist status
    WAITLIST_REMOVE: '/booking/waitlist/:waitlist_id', // Remove from waitlist
    // QR Code
    QR_GENERATE: '/booking/qr/generate',          // Generate QR for reservation
    QR_VALIDATE: '/booking/qr/:qr_id/validate',   // Validate QR code
    QR_MARK_USED: '/booking/qr/:qr_id/mark-used', // Mark QR as used
  },

  // Charging Session
  CHARGING: {
    INITIATE: '/charging/initiate',
    START: '/charging/start',
    STOP: '/charging/:session_id/stop',
    PAUSE: '/charging/:session_id/pause',
    RESUME: '/charging/:session_id/resume',
    DETAIL: '/charging/:session_id',
    TELEMETRY: '/charging/:session_id/telemetry',
    PUSH_METER: '/charging/:session_id/meter',
    GET_EVENTS: '/charging/:session_id/events',
    CONFIRM_PAYMENT: '/charging/:session_id/confirm-payment',
    GET_INVOICE: '/charging/:session_id/invoice',
    RECONCILE: '/charging/:session_id/reconcile',
    USER_SESSIONS: '/charging/:user_id/sessions',
    ACTIVE_POINTS: '/charging/:station_id/active-points',
  },

  // ==================== PAYMENT SERVICE (Port 3005) ====================
  PAYMENT: {
    // Transaction
    CREATE_TRANSACTION: '/payments/transaction',
    GET_TRANSACTION: '/payments/transaction/:id',
    CONFIRM_CASH: '/payments/transaction/:id/confirm',
    REFUND: '/payments/transaction/:id/refund',
    // Wallet
    GET_WALLET: '/payments/wallet/:user_id',
    TOPUP_WALLET: '/payments/wallet/topup',
    // Payment History
    USER_PAYMENTS: '/payments/user/:user_id/payments',
    // Webhook
    BANK_WEBHOOK: '/payments/webhook',
  },
};