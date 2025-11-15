-- Seed data for ev_auth_db
-- Password for all users: Password123!
-- Hash generated with: bcrypt.hash('Password123!', 12)

-- Insert test users
-- Note: 'driver' role has been deprecated and replaced with 'user'
INSERT INTO users (id, email, phone, password_hash, role, status, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', '0123456789', '$$2b$12$f26EFdXBzfsAW3MDkPkq7uAbjCh0Q/YMuJXDywJebJDZWylcR.U3S', 'user', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'staff@example.com', '0987654321', '$$2b$12$f26EFdXBzfsAW3MDkPkq7uAbjCh0Q/YMuJXDywJebJDZWylcR.U3S', 'staff', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', '0111222333', '$$2b$12$f26EFdXBzfsAW3MDkPkq7uAbjCh0Q/YMuJXDywJebJDZWylcR.U3S', 'admin', 'active', NOW());
