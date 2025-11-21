-- ===============================
-- RESERVATIONS
-- ===============================
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,         -- user_id từ user_service
  station_id VARCHAR(50) NOT NULL,      -- station_id từ station_service
  point_id VARCHAR(50) NOT NULL,        -- point_id từ station_service
  connector_type ENUM('CCS', 'CHAdeMO', 'Type2', 'GB/T', 'Other') DEFAULT 'Type2',
  start_time DATETIME(3),
  end_time DATETIME(3),
  status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'expired') DEFAULT 'pending',
  expires_at DATETIME(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX idx_user_id (user_id),
  INDEX idx_station_point (station_id, point_id),
  INDEX idx_status (status),

  price_per_min INT NOT NULL DEFAULT 1000 COMMENT 'Giá VND trên 1 phút (mặc định 1000)',
  reserved_minutes INT DEFAULT NULL COMMENT 'Số phút đã tính (null nếu chưa tính)',
  total_cost BIGINT NOT NULL DEFAULT 0 COMMENT 'Tổng tiền (VND) = reserved_minutes * price_per_min',
  final_cost BIGINT DEFAULT NULL COMMENT 'Số tiền thực tế sau khi kết thúc (VND). NULL nếu chưa finalize'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================
-- WAITLIST
-- ===============================
CREATE TABLE IF NOT EXISTS waitlist (
  waitlist_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  station_id VARCHAR(50) NOT NULL,
  connector_type ENUM('CCS','CHAdeMO','Type2','GB/T','Other') DEFAULT 'Type2',
  position INT,
  status ENUM('waiting','served','cancelled') DEFAULT 'waiting',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_wait (user_id, station_id, connector_type),
  CHECK (position > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================
-- SESSIONS
-- ===============================
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  station_id VARCHAR(50) NOT NULL,  
  point_id VARCHAR(50) NOT NULL,
  reservation_id VARCHAR(50) DEFAULT NULL,
  start_meter_wh INT DEFAULT NULL,
  end_meter_wh INT DEFAULT NULL,
  status ENUM('initiated','charging','paused','failed','cancelled','pending','confirmed') DEFAULT 'initiated',
  started_at DATETIME(3) DEFAULT NULL,
  ended_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  kwh DECIMAL(10,3) GENERATED ALWAYS AS (
    CASE
      WHEN end_meter_wh IS NOT NULL AND start_meter_wh IS NOT NULL
      THEN (end_meter_wh - start_meter_wh) / 1000
      ELSE 0
    END
  ) STORED,

  cost BIGINT DEFAULT 0,
  metadata JSON DEFAULT NULL,

  CONSTRAINT fk_session_reservation FOREIGN KEY (reservation_id)
      REFERENCES reservations(reservation_id)
      ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_point_id (point_id),
  INDEX idx_status (status),
  CHECK (JSON_VALID(metadata))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================
-- TELEMETRY
-- ===============================
CREATE TABLE IF NOT EXISTS telemetry (
  telemetry_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  timestamp DATETIME(3) NOT NULL,
  meter_wh INT,
  power_kw FLOAT,
  price_per_kw FLOAT,
  soc TINYINT,
  
  CONSTRAINT fk_telemetry_session FOREIGN KEY (session_id)
      REFERENCES sessions(session_id)
      ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_session_time (session_id, timestamp),
  CHECK (soc BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================
-- NOTIFICATIONS
-- ===============================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(50) PRIMARY KEY,
  to_user VARCHAR(50) NOT NULL,
  channels JSON,
  title VARCHAR(255),
  message TEXT,
  metadata JSON,
  status ENUM('unread', 'sent', 'read') DEFAULT 'unread',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_to_user (to_user),
  INDEX idx_status (status),
  CHECK (JSON_VALID(channels)),
  CHECK (JSON_VALID(metadata))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================
-- QR CODES
-- ===============================
CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id VARCHAR(50) PRIMARY KEY,
  reservation_id VARCHAR(50) NOT NULL,
  expires_in INT,
  url VARCHAR(255),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_qr_reservation FOREIGN KEY (reservation_id)
      REFERENCES reservations(reservation_id)
      ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (expires_in > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- EVENT OUTBOX (for RabbitMQ events)
-- ===============================
CREATE TABLE IF NOT EXISTS event_outbox (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','processed','failed') DEFAULT 'pending',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
