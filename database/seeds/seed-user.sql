-- Seed data for User Service
-- Database: ev_user_db

-- Insert user profiles (matching users from auth service)
INSERT INTO user_profiles (user_id, name, phone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Nguyen Van A', '0987654321'),
('550e8400-e29b-41d4-a716-446655440002', 'Tran Thi B', '0976543210'),
('550e8400-e29b-41d4-a716-446655440003', 'Admin User', '0965432109');

-- Insert test vehicles
INSERT INTO vehicles (user_id, plate_number, brand, model, battery_kwh, color, year, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '30A-12345', 'Tesla', 'Model 3', 75.0, 'White', 2023, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440001', '30B-67890', 'VinFast', 'VF8', 87.5, 'Blue', 2024, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440002', '51H-11111', 'Hyundai', 'Ioniq 5', 72.6, 'Black', 2023, 'ACTIVE');

-- Insert test subscriptions
INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'PLAN_BASIC', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
('550e8400-e29b-41d4-a716-446655440002', 'PLAN_PREMIUM', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', true);

-- Insert test notifications
INSERT INTO notifications (user_id, title, message, type, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Welcome!', 'Welcome to EV Charging Station Management System', 'SYSTEM', 'UNREAD'),
('550e8400-e29b-41d4-a716-446655440001', 'Charging Complete', 'Your vehicle is fully charged at Station ABC', 'CHARGING', 'UNREAD'),
('550e8400-e29b-41d4-a716-446655440002', 'Payment Successful', 'Your payment of 150,000 VND has been processed', 'PAYMENT', 'READ');
