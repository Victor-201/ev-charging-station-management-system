# Auth Service

Authentication and Authorization microservice for EV Charging Station Management System.

## Features

- ✅ User registration with email/phone
- ✅ Email/SMS OTP verification
- ✅ Login with email and password
- ✅ OAuth 2.0 login (Google, Facebook)
- ✅ JWT-based authentication
- ✅ Refresh token mechanism
- ✅ Password reset flow
- ✅ Link/Unlink OAuth providers
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Security headers with Helmet

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Joi
- **Email:** Nodemailer
- **Logging:** Winston
- **Testing:** Jest

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- SMTP server (for email OTP and password reset)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ev_auth_user_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

4. Setup database:
```bash
# Create database
createdb ev_auth_user_db

# Run schema migration
psql -U postgres -d ev_auth_user_db -f ../../database/schema/ev_auth_user_db.sql

# Seed initial data (optional)
psql -U postgres -d ev_auth_user_db -f ../../database/seeds/seed.sql
```

## Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
npm run test:watch
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t auth-service .

# Run container
docker run -p 3001:3001 --env-file .env auth-service
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/verify` | Verify OTP |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/login/oauth` | OAuth login (Google/Facebook) |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/link-provider` | Link OAuth provider |
| POST | `/api/v1/auth/unlink-provider` | Unlink OAuth provider |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |

## Example Requests

### Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "0987654321",
    "password": "Password123!",
    "name": "Nguyen Van A",
    "vehicle": {
      "plate_number": "30A-12345",
      "brand": "Tesla",
      "model": "Model 3"
    }
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Access Protected Endpoint
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Project Structure

```
auth-service/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts  # Database connection
│   ├── controllers/     # Request handlers
│   │   └── authController.ts
│   ├── middlewares/     # Express middlewares
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── routes/          # API routes
│   │   └── authRoutes.ts
│   ├── services/        # Business logic
│   │   └── authService.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── email.ts
│   │   ├── helpers.ts
│   │   └── logger.ts
│   └── index.ts         # Entry point
├── tests/               # Test files
├── .env.example         # Environment variables template
├── .gitignore
├── Dockerfile
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- **Password Hashing:** bcrypt with 12 rounds
- **JWT Tokens:** Short-lived access tokens + long-lived refresh tokens
- **Rate Limiting:** Prevent brute force attacks
- **CORS:** Configurable origin whitelist
- **Helmet:** Security headers
- **Input Validation:** Joi schemas for all inputs
- **SQL Injection Protection:** Parameterized queries

## Test Accounts

After running seed data:

| Email | Password | Role |
|-------|----------|------|
| admin@evcharging.com | Password123! | admin |
| driver@example.com | Password123! | driver |
| staff@evcharging.com | Password123! | staff |

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### Email Not Sending
- Verify SMTP credentials
- Enable "Less secure app access" for Gmail
- Or use App-specific password

### JWT Token Errors
- Ensure JWT_SECRET is set
- Check token expiration time
- Verify Bearer token format

## License

MIT
