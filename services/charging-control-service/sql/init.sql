-- Tạo database
CREATE DATABASE IF NOT EXISTS ev_charging;
USE ev_charging;

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    role ENUM('driver', 'staff', 'admin') DEFAULT 'driver'
);

-- Bảng đặt chỗ
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    station_id VARCHAR(50) NOT NULL,
    point_id VARCHAR(50) NOT NULL,
    connector_type VARCHAR(20),
    start_time DATETIME,
    end_time DATETIME,
    status VARCHAR(20),
    expires_at DATETIME
);

-- Bảng chờ đặt (waitlist)
CREATE TABLE IF NOT EXISTS waitlist (
    waitlist_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    station_id VARCHAR(50),
    connector_type VARCHAR(20),
    position INT
);

-- Bảng phiên sạc
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  point_id VARCHAR(50),
  vehicle_id VARCHAR(50),
  reservation_id VARCHAR(50) DEFAULT NULL,
  start_meter_wh INT DEFAULT NULL,
  end_meter_wh INT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'initiated',
  started_at DATETIME(3) DEFAULT NULL,
  ended_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  kwh DECIMAL(10,3) DEFAULT 0.000,
  cost BIGINT DEFAULT 0,
  metadata JSON DEFAULT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_point_id (point_id),
  INDEX idx_status (status),
  INDEX idx_reservation_id (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Bảng telemetry
CREATE TABLE IF NOT EXISTS telemetry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50),
    timestamp DATETIME,
    meter_wh INT,
    power_kw FLOAT,
    soc INT
);

-- Bảng thông báo
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    to_user VARCHAR(50),
    channels JSON,
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(20)
);

-- Bảng QR codes
CREATE TABLE IF NOT EXISTS qr_codes (
    qr_id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50),
    expires_in INT,
    url VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS stations (
    station_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng điểm sạc (charging points)
CREATE TABLE IF NOT EXISTS points (
    point_id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    connector_type VARCHAR(50),
    status ENUM('available', 'in_use', 'maintenance') DEFAULT 'available',
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
);
CREATE TABLE vehicles (
  vehicle_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  license_plate VARCHAR(50),
  brand VARCHAR(100),
  model VARCHAR(100)
);
INSERT INTO vehicles (vehicle_id, user_id, license_plate, brand, model)
VALUES ('V001', 'U12345', '51A-12345', 'Tesla', 'Model 3');


-- ⚡ Dữ liệu mẫu để test nhanh
INSERT INTO stations (station_id, name, location, total_points)
VALUES ('station_01', 'EV Station 1', 'Hanoi', 4);

INSERT INTO points (point_id, station_id, connector_type, status)
VALUES 
('P001', 'station_01', 'CCS', 'available'),
('P002', 'station_01', 'Type2', 'available'),
('P003', 'station_01', 'CCS', 'maintenance'),
('P004', 'station_01', 'CHAdeMO', 'available');
INSERT INTO users (user_id, name, email, role)
VALUES ('U001', 'Nguyen Van A', 'a@example.com', 'driver');

