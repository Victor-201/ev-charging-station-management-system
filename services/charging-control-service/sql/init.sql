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
    start_meter_wh INT,
    end_meter_wh INT,
    status VARCHAR(20),
    started_at DATETIME,
    ended_at DATETIME,
    kwh FLOAT,
    cost FLOAT
);

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
