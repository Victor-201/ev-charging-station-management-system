-- Seed data for User Service
-- Database: ev_user_db

-------------------------------------------------------------
-- 1. USERS (phải seed trước vì user_profiles phụ thuộc)
-------------------------------------------------------------
INSERT INTO users (id, email, full_name, phone, date_of_birth, role, status, email_verified)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'a@example.com', 'Nguyen Van A', '0987654321', '2000-01-01', 'user', 'active', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'b@example.com', 'Tran Thi B', '0976543210', '1999-02-01', 'user', 'active', TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', 'Admin User', '0965432109', '1995-03-01', 'admin', 'active', TRUE);


-------------------------------------------------------------
-- 2. USER PROFILES
-------------------------------------------------------------
INSERT INTO user_profiles (user_id, avatar_url, address)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'https://example.com/avatar1.jpg', 'Hanoi, Vietnam'),
('550e8400-e29b-41d4-a716-446655440002', 'https://example.com/avatar2.jpg', 'Hanoi, Vietnam'),
('550e8400-e29b-41d4-a716-446655440003', 'https://example.com/avatar3.jpg', 'HCMC, Vietnam');


-------------------------------------------------------------
-- 3. VEHICLES
-------------------------------------------------------------
INSERT INTO vehicles (user_id, plate_number, brand, model, battery_kwh, color, year, status)
VALUES
('550e8400-e29b-41d4-a716-446655440001', '30A-12345', 'Tesla', 'Model 3', 75.0, 'White', 2023, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440001', '30B-67890', 'VinFast', 'VF8', 87.5, 'Blue', 2024, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440002', '51H-11111', 'Hyundai', 'Ioniq 5', 72.6, 'Black', 2023, 'ACTIVE');


-------------------------------------------------------------
-- 4. SUBSCRIPTIONS
-------------------------------------------------------------
INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'PLAN_BASIC', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'PLAN_PREMIUM', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', TRUE);


-------------------------------------------------------------
-- 5. NOTIFICATIONS
-------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type, status)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Welcome!', 'Welcome to EV Charging Station Management System', 'SYSTEM', 'UNREAD'),
('550e8400-e29b-41d4-a716-446655440001', 'Charging Complete', 'Your vehicle is fully charged at Station ABC', 'CHARGING', 'UNREAD'),
('550e8400-e29b-41d4-a716-446655440002', 'Payment Successful', 'Your payment of 150,000 VND has been processed', 'PAYMENT', 'READ');
