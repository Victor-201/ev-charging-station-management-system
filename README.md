# ⚡ EV Charging Station Management System

**Phần mềm quản lý trạm sạc xe điện** - Hệ thống toàn diện cho việc quản lý trạm sạc xe điện với kiến trúc microservices.

---

## 📋 Mô tả dự án

Hệ thống quản lý trạm sạc xe điện (EV Charging Station Management System) là một nền tảng hoàn chỉnh hỗ trợ:

- **Tài xế (EV Driver)**: Tìm kiếm trạm sạc, đặt chỗ, sạc xe, thanh toán và theo dõi lịch sử
- **Nhân viên trạm (CS Staff)**: Quản lý phiên sạc, thanh toán tại trạm, báo cáo sự cố
- **Quản trị viên (Admin)**: Quản lý toàn bộ hệ thống trạm sạc, người dùng, gói dịch vụ và báo cáo thống kê

---

## 🎯 Tính năng chính

### 👤 Tài xế (EV Driver)

| Tính năng               | Mô tả                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| Đăng ký/Đăng nhập       | Email, số điện thoại, mạng xã hội (Google Sign-In)                            |
| Quản lý hồ sơ           | Thông tin cá nhân, xe, lịch sử giao dịch                                      |
| Bản đồ trạm sạc         | Hiển thị theo vị trí, công suất, tình trạng, loại cổng sạc (CCS, CHAdeMO, AC) |
| Đặt trước điểm sạc      | Đặt lịch sạc theo thời gian mong muốn                                         |
| Khởi động phiên sạc     | Quét QR code để bắt đầu sạc                                                   |
| Theo dõi trạng thái sạc | SOC %, thời gian còn lại, chi phí realtime                                    |
| Thanh toán              | Theo kWh, theo thời gian, gói thuê bao, ví điện tử                            |
| Lịch sử & Thống kê      | Báo cáo chi phí hằng tháng, thói quen sạc                                     |

### 👷 Nhân viên trạm sạc (CS Staff)

| Tính năng          | Mô tả                                |
| ------------------ | ------------------------------------ |
| Quản lý phiên sạc  | Khởi động/dừng phiên sạc             |
| Thanh toán tại chỗ | Ghi nhận thanh toán trực tiếp        |
| Theo dõi điểm sạc  | Tình trạng online/offline, công suất |
| Báo cáo sự cố      | Ghi nhận và báo cáo sự cố tại trạm   |

### 🛡️ Quản trị viên (Admin)

| Tính năng               | Mô tả                                            |
| ----------------------- | ------------------------------------------------ |
| Quản lý trạm & điểm sạc | Theo dõi và điều khiển từ xa toàn bộ hệ thống    |
| Quản lý người dùng      | Khách hàng cá nhân/doanh nghiệp                  |
| Gói dịch vụ             | Tạo gói thuê bao trả trước, trả sau, VIP         |
| Phân quyền              | Quản lý quyền nhân viên trạm                     |
| Báo cáo thống kê        | Doanh thu, tần suất sử dụng, giờ cao điểm        |
| AI dự báo               | Gợi ý dự báo nhu cầu sử dụng để nâng cấp hạ tầng |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│   📱 Mobile App (React Native)     │    💻 Web Portal (React + Vite)    │
│   - iOS & Android                   │    - Admin Dashboard               │
│   - Driver Features                 │    - Staff Management              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Kong 3.7)                           │
│   - Rate Limiting   - CORS   - Routing   - Load Balancing                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Auth Service  │         │ User Service  │         │Station Service│
│   (Express)   │         │   (Express)   │         │   (NestJS)    │
│   Port: 3001  │         │   Port: 3002  │         │   Port: 3000  │
├───────────────┤         ├───────────────┤         ├───────────────┤
│  PostgreSQL   │         │  PostgreSQL   │         │    MySQL      │
│   (Auth DB)   │         │   (User DB)   │         │  (Station DB) │
└───────────────┘         └───────────────┘         └───────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Charging    │         │    Payment    │         │   Analytics   │
│Control Service│         │    Service    │         │    Service    │
│   (Express)   │         │   (Express)   │         │   (Express)   │
│   Port: 4002  │         │   Port: 8080  │         │   Port: 3000  │
├───────────────┤         ├───────────────┤         ├───────────────┤
│    MySQL      │         │  PostgreSQL   │         │    MySQL      │
│ (Charging DB) │         │  (Payment DB) │         │ (Analytics DB)│
└───────────────┘         └───────────────┘         └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
            ┌─────────────────────────────────────────────┐
            │              MESSAGE BROKER                  │
            │         RabbitMQ (AMQP Protocol)            │
            │   - Event-driven communication              │
            │   - Async processing                        │
            └─────────────────────────────────────────────┘
                                    │
                                    ▼
            ┌─────────────────────────────────────────────┐
            │                ETL / ANALYTICS               │
            │            Apache NiFi + Warehouse           │
            │   - Data integration                         │
            │   - Real-time analytics                      │
            └─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend Services

| Service                      | Framework               | Database   | Port |
| ---------------------------- | ----------------------- | ---------- | ---- |
| **auth-service**             | Express.js + TypeScript | PostgreSQL | 3001 |
| **user-service**             | Express.js + TypeScript | PostgreSQL | 3002 |
| **station-service**          | NestJS + Prisma         | MySQL      | 3000 |
| **charging-control-service** | Express.js              | MySQL      | 4002 |
| **payment-service**          | Express.js (ES Modules) | PostgreSQL | 8080 |
| **analytics-service**        | Express.js (ES Modules) | MySQL      | 3000 |

### Frontend

| Platform       | Technology                      | Features                                     |
| -------------- | ------------------------------- | -------------------------------------------- |
| **Mobile App** | React Native 0.82               | Maps, Push Notifications, QR Code, Socket.IO |
| **Web Portal** | React 18 + Vite + TailwindCSS 4 | i18n, Charts (Recharts), PDF Export          |

### Infrastructure

| Component             | Technology              | Purpose                           |
| --------------------- | ----------------------- | --------------------------------- |
| **API Gateway**       | Kong 3.7                | Routing, Rate Limiting, CORS      |
| **Message Broker**    | RabbitMQ 3              | Event-driven communication        |
| **ETL/Data Pipeline** | Apache NiFi             | Data integration & transformation |
| **Containerization**  | Docker & Docker Compose | Container orchestration           |
| **Orchestration**     | Kubernetes (K8s)        | Production deployment             |

### Databases

| Database            | Type          | Purpose                           |
| ------------------- | ------------- | --------------------------------- |
| **ev_auth_db**      | PostgreSQL 15 | Authentication data               |
| **ev_user_db**      | PostgreSQL 15 | User profiles, vehicles, wallets  |
| **ev_station_db**   | MySQL 8.0     | Stations & chargers               |
| **ev_charging_db**  | MySQL 8.0     | Charging sessions & bookings      |
| **ev_payment_db**   | PostgreSQL 15 | Payments, subscriptions, invoices |
| **ev_analytics_db** | MySQL 8.0     | Analytics & monitoring data       |
| **warehouse**       | MySQL 8.0     | Data warehouse for reporting      |

---

## 📁 Cấu trúc thư mục

```
ev-charging-station-management-system/
├── 📂 backend/                      # Backend microservices
│   ├── 📂 analytics-service/        # Báo cáo & thống kê
│   ├── 📂 auth-service/             # Xác thực & phân quyền (JWT)
│   ├── 📂 charging-control-service/ # Điều khiển phiên sạc (Socket.IO)
│   ├── 📂 payment-service/          # Thanh toán & hóa đơn (PDFKit)
│   ├── 📂 station-service/          # Quản lý trạm & điểm sạc (Prisma ORM)
│   └── 📂 user-service/             # Quản lý người dùng (Firebase)
│
├── 📂 frontend/
│   ├── 📂 mobile/evChargingApp/     # React Native mobile app
│   │   ├── 📂 src/
│   │   │   ├── 📂 api/              # API clients
│   │   │   ├── 📂 components/       # Reusable UI components
│   │   │   ├── 📂 hooks/            # Custom React hooks
│   │   │   ├── 📂 navigation/       # React Navigation setup
│   │   │   ├── 📂 screens/          # App screens
│   │   │   ├── 📂 services/         # Business logic services
│   │   │   ├── 📂 store/            # Redux store & slices
│   │   │   └── 📂 utils/            # Utility functions
│   │   └── ...
│   │
│   └── 📂 web/ev-charging-portal/   # React web portal
│       ├── 📂 src/
│       │   ├── 📂 api/              # API configuration
│       │   ├── 📂 components/       # UI components
│       │   ├── 📂 contexts/         # React contexts
│       │   ├── 📂 hooks/            # Custom hooks
│       │   ├── 📂 i18n/             # Internationalization (vi/en)
│       │   ├── 📂 layouts/          # Page layouts
│       │   ├── 📂 pages/            # Route pages
│       │   ├── 📂 providers/        # Context providers
│       │   ├── 📂 routes/           # Router configuration
│       │   ├── 📂 services/         # API services
│       │   └── 📂 utils/            # Utilities
│       └── ...
│
├── 📂 database/
│   ├── 📂 migrations/               # Database migrations
│   ├── 📂 schema/                   # SQL schema files
│   │   ├── ev_analytics_db.sql
│   │   ├── ev_auth_db.sql
│   │   ├── ev_charging_db.sql
│   │   ├── ev_payment_db.sql
│   │   ├── ev_station_db.sql
│   │   ├── ev_user_db.sql
│   │   └── ev_warehouse_db.sql
│   └── 📂 seeds/                    # Seed data
│
├── 📂 deployment/
│   ├── 📂 docker/
│   │   └── docker-compose.yml       # Full stack deployment
│   ├── 📂 k8s/                      # Kubernetes configs
│   ├── 📂 nifi/                     # Apache NiFi flows
│   ├── 📂 rabbitmq/                 # RabbitMQ service
│   └── 📂 scripts/                  # Deployment scripts
│
├── 📂 docs/
│   └── 📂 erd/
│       ├── ERD_all.png              # Entity Relationship Diagram
│       └── ERD_all.svg
│
└── 📂 kong/
    ├── kong.yaml                    # Kong declarative config
    └── kong_setup.md                # Setup instructions
```

---

## 🗄️ Database Schema (ERD)

![Entity Relationship Diagram](docs/erd/ERD_all.png)

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js** >= 20
- **Docker** & **Docker Compose**
- **Git**

### 1. Clone repository

```bash
git clone https://github.com/your-username/ev-charging-station-management-system.git
cd ev-charging-station-management-system
```

### 2. Khởi chạy với Docker Compose

```bash
cd deployment/docker
docker-compose up -d
```

Hệ thống sẽ tự động:

- Khởi tạo tất cả databases với schema và seed data
- Build và chạy tất cả microservices
- Cấu hình Kong API Gateway
- Kết nối RabbitMQ message broker
- Khởi động Apache NiFi

### 3. Kiểm tra trạng thái

```bash
docker-compose ps
```

### 4. Truy cập các dịch vụ

| Service                 | URL                    | Credentials   |
| ----------------------- | ---------------------- | ------------- |
| **Kong API Gateway**    | http://localhost:8000  | -             |
| **Kong Admin**          | http://localhost:8001  | -             |
| **RabbitMQ Management** | http://localhost:15672 | guest / guest |
| **Apache NiFi**         | https://localhost:9443 | -             |

---

## 📱 Chạy Frontend Applications

### Mobile App (React Native)

```bash
cd frontend/mobile/evChargingApp
npm install

# iOS
npm run ios

# Android
npm run android
```

### Web Portal

```bash
cd frontend/web/ev-charging-portal
npm install
npm run dev
```

Web portal sẽ chạy tại: http://localhost:5173

---

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Authentication

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| POST   | `/auth/register` | Đăng ký tài khoản           |
| POST   | `/auth/login`    | Đăng nhập                   |
| GET    | `/auth/me`       | Lấy thông tin user hiện tại |

### Users & Vehicles

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | `/users/profile` | Lấy thông tin profile |
| PUT    | `/users/profile` | Cập nhật profile      |
| GET    | `/vehicles`      | Danh sách xe          |
| POST   | `/vehicles`      | Thêm xe mới           |

### Stations & Chargers

| Method | Endpoint        | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/stations`     | Danh sách trạm sạc |
| GET    | `/stations/:id` | Chi tiết trạm sạc  |
| GET    | `/chargers`     | Danh sách điểm sạc |

### Booking & Charging

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| POST   | `/booking`         | Đặt trước điểm sạc |
| GET    | `/booking/history` | Lịch sử đặt chỗ    |
| POST   | `/charging/start`  | Bắt đầu phiên sạc  |
| POST   | `/charging/stop`   | Kết thúc phiên sạc |

### Payments

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/payments`      | Lịch sử thanh toán |
| POST   | `/payments`      | Tạo thanh toán mới |
| GET    | `/invoices`      | Danh sách hóa đơn  |
| GET    | `/subscriptions` | Gói đăng ký        |

### Wallets

| Method | Endpoint           | Description |
| ------ | ------------------ | ----------- |
| GET    | `/wallets/balance` | Số dư ví    |
| POST   | `/wallets/topup`   | Nạp tiền ví |

### Analytics

| Method | Endpoint             | Description        |
| ------ | -------------------- | ------------------ |
| GET    | `/analytics/revenue` | Thống kê doanh thu |
| GET    | `/analytics/usage`   | Thống kê sử dụng   |
| GET    | `/dashboards`        | Dashboard data     |
| GET    | `/monitoring`        | Giám sát realtime  |

---

## 🔐 Environment Variables

Mỗi service yêu cầu file `.env` riêng. Xem file `.env.example` trong mỗi thư mục service.

Các biến môi trường chính:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ev_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Firebase (cho push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

---

## 🧪 Testing

```bash
# Run tests for a specific service
cd backend/auth-service
npm test

# Run with coverage
npm run test:coverage
```

---

## 📜 License

MIT License

---

## 👥 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc Issue để thảo luận về các thay đổi.

---

## 📞 Liên hệ

- **Email**: [your-email@example.com]
- **Website**: [your-website.com]
