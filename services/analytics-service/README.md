# EV Charging Analytics & Monitoring Service

Microservice cung cấp các API Monitoring, Analytics, Telemetry và Dashboard cho hệ thống quản lý trạm sạc xe điện.

## Yêu cầu

- Node.js 20+
- Docker / Docker Compose

## Cấu trúc thư mục

```text
src/
  controllers/
  services/
  routes/
  config/
  app.js
  server.js
sql/
  init.sql
```

## Biến môi trường

```env
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=ev_charging
```

## Chạy bằng Docker Compose

```bash
docker compose up --build
```

- API chạy tại `http://localhost:3000`
- MySQL map port `3306`

## Các endpoint chính

- `GET /api/v1/monitoring/health`
- `GET /api/v1/analytics/reports/user/:user_id/monthly`
- `POST /api/v1/analytics/forecast/train`
- `GET /api/v1/telemetry/raw`
- `POST /api/v1/dashboards`
- `GET /api/v1/analytics/ai/forecast/:station_id`

## Chạy cục bộ (không Docker)

```bash
npm install
npm run dev
```
