-- ===============================
-- RESERVATIONS
-- ===============================
CREATE TABLE reservations (
  reservation_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,         -- user_id từ user_service
  charging_point_id VARCHAR(50) NOT NULL,  -- thay cho station_id và point_id
  connector_type ENUM('CCS', 'CHAdeMO', 'Type2', 'GB/T', 'Other') DEFAULT 'Type2',
  start_time DATETIME(3),
  end_time DATETIME(3),
  status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'expired') DEFAULT 'pending',
  expires_at DATETIME(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_user_id (user_id),
  INDEX idx_charging_point (charging_point_id),
  INDEX idx_status (status)
);

-- ===============================
-- WAITLIST
-- ===============================
CREATE TABLE waitlist (
  waitlist_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  station_id VARCHAR(50) NOT NULL,
  connector_type ENUM('CCS', 'CHAdeMO', 'Type2', 'GB/T', 'Other') DEFAULT 'Type2',
  position INT CHECK (position > 0),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY uniq_wait (user_id, station_id, connector_type)
);

-- ===============================
-- SESSIONS
-- ===============================
CREATE TABLE sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  charging_point_id VARCHAR(50) NOT NULL,  -- thay cho point_id
  vehicle_id VARCHAR(50) NOT NULL,         -- từ user_service
  reservation_id VARCHAR(50) DEFAULT NULL,
  start_meter_wh INT DEFAULT NULL,
  end_meter_wh INT DEFAULT NULL,
  status ENUM('initiated', 'charging', 'completed', 'failed', 'cancelled') DEFAULT 'initiated',
  started_at DATETIME(3) DEFAULT NULL,
  ended_at DATETIME(3) DEFAULT NULL,
  base_total_price FLOAT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  kwh DECIMAL(10,3) GENERATED ALWAYS AS (
    CASE WHEN end_meter_wh IS NOT NULL AND start_meter_wh IS NOT NULL
         THEN (end_meter_wh - start_meter_wh)/1000
         ELSE 0 END
  ) STORED,
  cost BIGINT DEFAULT 0,
  metadata JSON DEFAULT NULL CHECK (JSON_VALID(metadata)),

  CONSTRAINT fk_session_reservation FOREIGN KEY (reservation_id)
      REFERENCES reservations(reservation_id)
      ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_charging_point (charging_point_id),
  INDEX idx_status (status)
);

-- ===============================
-- TELEMETRY
-- ===============================
CREATE TABLE telemetry (
  telemetry_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  timestamp DATETIME(3) NOT NULL,
  meter_wh INT,
  power_kw FLOAT,
  price_per_kw FLOAT,
  soc TINYINT CHECK (soc BETWEEN 0 AND 100),

  CONSTRAINT fk_telemetry_session FOREIGN KEY (session_id)
      REFERENCES sessions(session_id)
      ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_session_time (session_id, timestamp)
);

-- ===============================
-- NOTIFICATIONS
-- ===============================
CREATE TABLE notifications (
  notification_id VARCHAR(50) PRIMARY KEY,
  to_user VARCHAR(50) NOT NULL, -- từ user_service
  channels JSON CHECK (JSON_VALID(channels)),
  title VARCHAR(255),
  message TEXT,
  status ENUM('unread', 'sent', 'read') DEFAULT 'unread',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_to_user (to_user),
  INDEX idx_status (status)
);

-- ===============================
-- QR CODES
-- ===============================
CREATE TABLE qr_codes (
  qr_id VARCHAR(50) PRIMARY KEY,
  reservation_id VARCHAR(50) NOT NULL,
  expires_in INT CHECK (expires_in > 0),
  url VARCHAR(255),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_qr_reservation FOREIGN KEY (reservation_id)
      REFERENCES reservations(reservation_id)
      ON DELETE CASCADE ON UPDATE CASCADE
);
