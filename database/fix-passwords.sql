-- Fix passwords for testing
-- password123 hashed with bcryptjs (10 rounds)
UPDATE users SET password_hash = '$2a$10$aAkBea5yHH3kNUdGBnQp6eQGEIGocB72uySFJa2wDvjn6OgZ9uPTS' 
WHERE email IN ('driver@example.com', 'staff@example.com', 'admin@example.com');
