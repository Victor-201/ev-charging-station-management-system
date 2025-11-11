-- ============================================
-- STATION SERVICE DATABASE - MySQL Seed Data
-- ============================================
-- Special Focus: 70 Tô Ký, Quận 12, HCM
-- ============================================

USE evcs_db;

-- Clean up existing test data
DELETE FROM chargers WHERE station_id IN (SELECT id FROM stations WHERE name LIKE '%Test%' OR address LIKE '%Tô Ký%');
DELETE FROM stations WHERE name LIKE '%Test%' OR address LIKE '%Tô Ký%';

-- ============================================
-- Insert Main Station: 70 Tô Ký, Quận 12, HCM
-- ============================================

INSERT INTO stations (
    id,
    name,
    address,
    latitude,
    longitude,
    city,
    district,
    ward,
    operator_id,
    total_chargers,
    available_chargers,
    status,
    opening_hours,
    amenities,
    images,
    rating,
    total_reviews,
    created_at,
    updated_at
) VALUES (
    'station-to-ky-q12-001',
    'Trạm Sạc EV 70 Tô Ký',
    '70 Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP. Hồ Chí Minh',
    10.8523,  -- Latitude for 70 Tô Ký, Q12
    106.6258, -- Longitude for 70 Tô Ký, Q12
    'Hồ Chí Minh',
    'Quận 12',
    'Phường Trung Mỹ Tây',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', -- operator1@example.com
    8,  -- Total chargers
    6,  -- Available chargers
    'active',
    '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}',
    '["parking", "wifi", "restroom", "cafe", "convenience_store", "security_camera", "covered_parking"]',
    '["https://example.com/images/to-ky-station-1.jpg", "https://example.com/images/to-ky-station-2.jpg"]',
    4.5,
    128,
    NOW(),
    NOW()
);

-- ============================================
-- Insert Chargers for 70 Tô Ký Station
-- ============================================

-- Fast DC Chargers (CCS2 - 150kW)
INSERT INTO chargers (
    id,
    station_id,
    charger_code,
    connector_type,
    power_output,
    status,
    current_session_id,
    price_per_kwh,
    created_at,
    updated_at
) VALUES 
    ('charger-to-ky-dc-001', 'station-to-ky-q12-001', 'TK-DC-001', 'CCS2', 150.0, 'available', NULL, 5500, NOW(), NOW()),
    ('charger-to-ky-dc-002', 'station-to-ky-q12-001', 'TK-DC-002', 'CCS2', 150.0, 'available', NULL, 5500, NOW(), NOW()),
    ('charger-to-ky-dc-003', 'station-to-ky-q12-001', 'TK-DC-003', 'CCS2', 150.0, 'charging', 'session-001', 5500, NOW(), NOW()),
    ('charger-to-ky-dc-004', 'station-to-ky-q12-001', 'TK-DC-004', 'CCS2', 150.0, 'available', NULL, 5500, NOW(), NOW());

-- Fast DC Chargers (CHAdeMO - 100kW)
INSERT INTO chargers (
    id,
    station_id,
    charger_code,
    connector_type,
    power_output,
    status,
    current_session_id,
    price_per_kwh,
    created_at,
    updated_at
) VALUES 
    ('charger-to-ky-ch-001', 'station-to-ky-q12-001', 'TK-CH-001', 'CHAdeMO', 100.0, 'available', NULL, 5000, NOW(), NOW()),
    ('charger-to-ky-ch-002', 'station-to-ky-q12-001', 'TK-CH-002', 'CHAdeMO', 100.0, 'maintenance', NULL, 5000, NOW(), NOW());

-- AC Chargers (Type 2 - 22kW)
INSERT INTO chargers (
    id,
    station_id,
    charger_code,
    connector_type,
    power_output,
    status,
    current_session_id,
    price_per_kwh,
    created_at,
    updated_at
) VALUES 
    ('charger-to-ky-ac-001', 'station-to-ky-q12-001', 'TK-AC-001', 'Type2', 22.0, 'available', NULL, 3500, NOW(), NOW()),
    ('charger-to-ky-ac-002', 'station-to-ky-q12-001', 'TK-AC-002', 'Type2', 22.0, 'available', NULL, 3500, NOW(), NOW());

-- ============================================
-- Insert Additional Stations in HCM
-- ============================================

-- Station 2: Quận 1 (Downtown)
INSERT INTO stations (
    id, name, address, latitude, longitude, city, district, ward,
    operator_id, total_chargers, available_chargers, status,
    opening_hours, amenities, rating, total_reviews, created_at, updated_at
) VALUES (
    'station-q1-nguyen-hue-001',
    'Trạm Sạc EV Nguyễn Huệ',
    '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    10.7756, 106.7019,
    'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    6, 5, 'active',
    '{"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "08:00-20:00", "sunday": "08:00-20:00"}',
    '["parking", "wifi", "restroom", "shopping_mall"]',
    4.7, 256, NOW(), NOW()
);

-- Chargers for Nguyen Hue Station
INSERT INTO chargers (id, station_id, charger_code, connector_type, power_output, status, price_per_kwh, created_at, updated_at)
VALUES 
    ('charger-q1-dc-001', 'station-q1-nguyen-hue-001', 'NH-DC-001', 'CCS2', 150.0, 'available', 6000, NOW(), NOW()),
    ('charger-q1-dc-002', 'station-q1-nguyen-hue-001', 'NH-DC-002', 'CCS2', 150.0, 'available', 6000, NOW(), NOW()),
    ('charger-q1-dc-003', 'station-q1-nguyen-hue-001', 'NH-DC-003', 'CHAdeMO', 100.0, 'available', 5500, NOW(), NOW()),
    ('charger-q1-ac-001', 'station-q1-nguyen-hue-001', 'NH-AC-001', 'Type2', 22.0, 'available', 4000, NOW(), NOW()),
    ('charger-q1-ac-002', 'station-q1-nguyen-hue-001', 'NH-AC-002', 'Type2', 22.0, 'charging', 4000, NOW(), NOW()),
    ('charger-q1-ac-003', 'station-q1-nguyen-hue-001', 'NH-AC-003', 'Type2', 11.0, 'available', 3500, NOW(), NOW());

-- Station 3: Quận 7 (Phú Mỹ Hưng)
INSERT INTO stations (
    id, name, address, latitude, longitude, city, district, ward,
    operator_id, total_chargers, available_chargers, status,
    opening_hours, amenities, rating, total_reviews, created_at, updated_at
) VALUES (
    'station-q7-phu-my-hung-001',
    'Trạm Sạc EV Phú Mỹ Hưng',
    'Đường Nguyễn Lương Bằng, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    10.7295, 106.7195,
    'Hồ Chí Minh', 'Quận 7', 'Phường Tân Phú',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    10, 8, 'active',
    '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}',
    '["parking", "wifi", "restroom", "cafe", "restaurant", "security_camera", "covered_parking", "valet_parking"]',
    4.8, 342, NOW(), NOW()
);

-- Chargers for Phu My Hung Station
INSERT INTO chargers (id, station_id, charger_code, connector_type, power_output, status, price_per_kwh, created_at, updated_at)
VALUES 
    ('charger-q7-dc-001', 'station-q7-phu-my-hung-001', 'PMH-DC-001', 'CCS2', 200.0, 'available', 6500, NOW(), NOW()),
    ('charger-q7-dc-002', 'station-q7-phu-my-hung-001', 'PMH-DC-002', 'CCS2', 200.0, 'available', 6500, NOW(), NOW()),
    ('charger-q7-dc-003', 'station-q7-phu-my-hung-001', 'PMH-DC-003', 'CCS2', 150.0, 'available', 5500, NOW(), NOW()),
    ('charger-q7-dc-004', 'station-q7-phu-my-hung-001', 'PMH-DC-004', 'CCS2', 150.0, 'charging', 5500, NOW(), NOW()),
    ('charger-q7-ch-001', 'station-q7-phu-my-hung-001', 'PMH-CH-001', 'CHAdeMO', 100.0, 'available', 5000, NOW(), NOW()),
    ('charger-q7-ch-002', 'station-q7-phu-my-hung-001', 'PMH-CH-002', 'CHAdeMO', 100.0, 'available', 5000, NOW(), NOW()),
    ('charger-q7-ac-001', 'station-q7-phu-my-hung-001', 'PMH-AC-001', 'Type2', 22.0, 'available', 3500, NOW(), NOW()),
    ('charger-q7-ac-002', 'station-q7-phu-my-hung-001', 'PMH-AC-002', 'Type2', 22.0, 'available', 3500, NOW(), NOW()),
    ('charger-q7-ac-003', 'station-q7-phu-my-hung-001', 'PMH-AC-003', 'Type2', 11.0, 'available', 3000, NOW(), NOW()),
    ('charger-q7-ac-004', 'station-q7-phu-my-hung-001', 'PMH-AC-004', 'Type2', 11.0, 'available', 3000, NOW(), NOW());

-- Station 4: Thủ Đức (Khu Công Nghệ Cao)
INSERT INTO stations (
    id, name, address, latitude, longitude, city, district, ward,
    operator_id, total_chargers, available_chargers, status,
    opening_hours, amenities, rating, total_reviews, created_at, updated_at
) VALUES (
    'station-thu-duc-khu-cong-nghe-cao-001',
    'Trạm Sạc EV Khu Công Nghệ Cao',
    'Đường Số 2, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
    10.8709, 106.8034,
    'Hồ Chí Minh', 'TP. Thủ Đức', 'Phường Hiệp Phú',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    12, 10, 'active',
    '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}',
    '["parking", "wifi", "restroom", "cafe", "security_camera", "covered_parking", "solar_panels"]',
    4.9, 512, NOW(), NOW()
);

-- Chargers for Thu Duc Station (High-tech zone)
INSERT INTO chargers (id, station_id, charger_code, connector_type, power_output, status, price_per_kwh, created_at, updated_at)
VALUES 
    ('charger-td-dc-001', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-001', 'CCS2', 350.0, 'available', 7500, NOW(), NOW()),
    ('charger-td-dc-002', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-002', 'CCS2', 350.0, 'available', 7500, NOW(), NOW()),
    ('charger-td-dc-003', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-003', 'CCS2', 200.0, 'available', 6500, NOW(), NOW()),
    ('charger-td-dc-004', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-004', 'CCS2', 200.0, 'available', 6500, NOW(), NOW()),
    ('charger-td-dc-005', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-005', 'CCS2', 150.0, 'charging', 5500, NOW(), NOW()),
    ('charger-td-dc-006', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-DC-006', 'CCS2', 150.0, 'available', 5500, NOW(), NOW()),
    ('charger-td-ch-001', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-CH-001', 'CHAdeMO', 100.0, 'available', 5000, NOW(), NOW()),
    ('charger-td-ch-002', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-CH-002', 'CHAdeMO', 100.0, 'available', 5000, NOW(), NOW()),
    ('charger-td-ac-001', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-AC-001', 'Type2', 22.0, 'available', 3500, NOW(), NOW()),
    ('charger-td-ac-002', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-AC-002', 'Type2', 22.0, 'available', 3500, NOW(), NOW()),
    ('charger-td-ac-003', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-AC-003', 'Type2', 11.0, 'available', 3000, NOW(), NOW()),
    ('charger-td-ac-004', 'station-thu-duc-khu-cong-nghe-cao-001', 'TD-AC-004', 'Type2', 11.0, 'maintenance', 3000, NOW(), NOW());

-- ============================================
-- Summary
-- ============================================
SELECT 
    '✓ Station seed data inserted successfully!' AS status,
    COUNT(DISTINCT s.id) AS total_stations,
    COUNT(c.id) AS total_chargers,
    SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END) AS available_chargers
FROM stations s
LEFT JOIN chargers c ON s.id = c.station_id
WHERE s.id LIKE 'station-%';

