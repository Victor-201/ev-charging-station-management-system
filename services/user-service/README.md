# User Service

User management microservice for the EV Charging Station Management System.

## Features

### User Management
- ✅ Get current user profile (`/api/v1/auth/me`)
- ✅ Admin: List all users with filtering and pagination
- ✅ Get user details with vehicles
- ✅ Update user profile
- ✅ Change password
- ✅ Admin: Deactivate user accounts
- ✅ GDPR: Export user data
- ✅ GDPR: Erase/anonymize user data

### Vehicle Management
- ✅ Add vehicle for user
- ✅ List user vehicles
- ✅ Get vehicle details
- ✅ Update vehicle information
- ✅ Delete vehicle (soft delete)

### Subscription Management
- ✅ Get user subscriptions
- ✅ Subscribe to charging plan
- ✅ Cancel subscription

### Wallet Operations
- ✅ Handle topup callback from payment gateway (webhook)
- ✅ Request withdrawal to bank account
- ✅ Get transaction history

### Notification Management
- ✅ Get user notifications
- ✅ Send notification (service-to-service)
- ✅ Schedule notification
- ✅ Handle booking webhooks

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (ev_user_db)
- **Authentication**: JWT (verified from auth-service)
- **Validation**: Joi
- **Logging**: Winston

## API Endpoints

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/auth/me` | Yes | Get current user profile |
| GET | `/api/v1/users` | Admin | List all users (filter, page) |
| GET | `/api/v1/users/:user_id` | Yes | Get user details |
| PUT | `/api/v1/users/:user_id` | Owner/Admin | Update user info |
| PUT | `/api/v1/users/:user_id/change-password` | Owner/Admin | Change password |
| POST | `/api/v1/users/:user_id/deactivate` | Admin | Deactivate user |
| GET | `/api/v1/users/:user_id/export-data` | Owner/Admin | Export user data (GDPR) |
| DELETE | `/api/v1/users/:user_id/erase` | Owner/Admin | Erase user data (GDPR) |

### Vehicle Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/users/:user_id/vehicles` | Owner/Admin | Add vehicle |
| GET | `/api/v1/users/:user_id/vehicles` | Owner/Admin | List vehicles |
| GET | `/api/v1/vehicles/:vehicle_id` | Yes | Get vehicle details |
| PUT | `/api/v1/vehicles/:vehicle_id` | Owner/Admin | Update vehicle |
| DELETE | `/api/v1/vehicles/:vehicle_id` | Owner/Admin | Delete vehicle |

### Subscription Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/:user_id/subscriptions` | Owner/Admin | Get subscriptions |
| POST | `/api/v1/users/:user_id/subscriptions` | Owner/Admin | Subscribe to plan |
| POST | `/api/v1/users/:user_id/subscriptions/:subscription_id/cancel` | Owner/Admin | Cancel subscription |

### Wallet Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/wallets/:user_id/topup/callback` | Webhook | Handle topup callback |
| POST | `/api/v1/wallets/:user_id/withdraw` | Owner/Admin | Request withdrawal |
| GET | `/api/v1/wallets/:user_id/transactions` | Owner/Admin | Get transactions |

### Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications/:user_id` | Owner/Admin | Get notifications |
| POST | `/api/v1/notifications/send` | Service | Send notification |
| POST | `/api/v1/notifications/schedule` | Service | Schedule notification |
| POST | `/api/v1/webhooks/bookings` | Webhook | Booking event webhook |

## Environment Variables

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DB_HOST=postgres-user
DB_PORT=5432
DB_NAME=ev_user_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT (for verifying auth tokens)
JWT_SECRET=your-jwt-secret

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
PAYMENT_SERVICE_URL=http://payment-service:3003
NOTIFICATION_SERVICE_URL=http://notification-gateway:3006

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload & Export
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EXPORT_DIR=./exports
EXPORT_URL_BASE=http://localhost:3002/exports

# Webhook Secrets
BOOKING_SERVICE_WEBHOOK_SECRET=your-webhook-secret
PAYMENT_SERVICE_WEBHOOK_SECRET=your-webhook-secret
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start

# Run tests
npm test
```

## Docker

```bash
# Build image
docker build -t user-service .

# Run container
docker run -d \
  --name user-service \
  -p 3002:3002 \
  --env-file .env \
  user-service
```

## Database Schema

### user_profiles
- Extended user profile information
- Links to users table in auth-service via user_id

### vehicles
- User vehicles for EV charging
- plate_number (unique), brand, model, battery_kwh

### subscriptions
- User subscription plans
- Links to plan-service via plan_id

### wallet_transactions
- Transaction history (topup, withdraw, payment, refund)
- Balance tracking is in payment-service

### notifications
- User notification inbox
- Types: SYSTEM, BOOKING, PAYMENT, CHARGING, PROMOTIONAL

### scheduled_notifications
- Future scheduled notifications
- Processed by background job

## GDPR Compliance

### Data Export (Article 15 - Right to Access)
**Endpoint**: `GET /api/v1/users/:user_id/export-data`

Exports all personal data in machine-readable format (JSON) packaged in ZIP file:
- User profile (name, phone, address, avatar)
- Vehicles (plate numbers, models, specs)
- Subscriptions history
- Wallet transactions (last 100)
- Notifications (last 100)

**Response**: Download URL with file size and export timestamp

**Authorization**: User can export own data, admin can export any user's data

### Data Erasure (Article 17 - Right to be Forgotten)
**Endpoint**: `DELETE /api/v1/users/:user_id/erase`

Anonymizes or deletes personal data with audit trail:
- **Anonymize**: user_profiles (name → "Deleted User", phone/avatar/address → NULL)
- **Delete**: vehicles (contains plate numbers - personal data)
- **Cancel**: subscriptions (keep for accounting, mark as CANCELLED)
- **Delete**: notifications (personal communications)
- **Anonymize**: wallet_transactions (keep amounts for accounting)
- **Audit**: Log all erasures in `data_erasure_log` table

**Response**: 202 Accepted with "erase_queued" status (processes within 30 days per GDPR)

**Authorization**: User can erase own data, admin can erase any user's data

**Database**: See `database/schema/ev_user_db.sql` for `data_erasure_log` table structure

## Security

- JWT authentication (tokens issued by auth-service)
- Role-based access control (ADMIN, STAFF, EV_DRIVER)
- Resource ownership validation (authorizeOwner middleware)
- Rate limiting on all endpoints
- Webhook signature verification
- GDPR Article 15 & 17 compliance (data export & erasure)
- Database transactions for data integrity
- Audit logging for sensitive operations

## Error Handling

All errors return JSON with structure:
```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

Status codes:
- 200: Success
- 201: Created
- 202: Accepted (async operations)
- 400: Bad request / Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict (duplicate)
- 500: Internal server error
- 503: Service unavailable

## Testing

Test users (from auth-service):
- **Driver**: driver@example.com / Password123!
- **Staff**: staff@example.com / Password123!
- **Admin**: admin@example.com / Password123!

## Monitoring

- Health check: `GET /health`
- Logs: `./logs/combined.log` and `./logs/error.log`
- Winston structured logging

## Architecture

```
┌─────────────────┐
│  Auth Service   │ ← JWT Verification
└─────────────────┘
        ↓
┌─────────────────┐
│  User Service   │ ← Main Service
└─────────────────┘
        ↓
┌─────────────────┬──────────────────┬──────────────────┐
│ Payment Service │ Booking Service  │ Notification GW  │
└─────────────────┴──────────────────┴──────────────────┘
```

## Future Enhancements

- [ ] Avatar upload with image processing
- [ ] Email notifications for critical events
- [ ] Push notification integration (FCM)
- [ ] SMS notifications
- [ ] User activity logging
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Data analytics endpoints
- [ ] Webhook retry mechanism
- [ ] Background job for scheduled notifications

## License

MIT
