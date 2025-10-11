-- Seed data for ev_auth_db
-- Password for all users: Password123!
-- Hash generated with: bcrypt.hash('Password123!', 12)

-- Insert test users
INSERT INTO users (id, email, phone, password_hash, role, status, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'driver@example.com', '0123456789', '$2a$12$0J4lK58q2vkKjNhFCW10v.Q0zhWsfrOklV73D74VNV1ZUs0TqMZkO', 'driver', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'staff@example.com', '0987654321', '$2a$12$0J4lK58q2vkKjNhFCW10v.Q0zhWsfrOklV73D74VNV1ZUs0TqMZkO', 'staff', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', '0111222333', '$2a$12$0J4lK58q2vkKjNhFCW10v.Q0zhWsfrOklV73D74VNV1ZUs0TqMZkO', 'admin', 'active', NOW());
