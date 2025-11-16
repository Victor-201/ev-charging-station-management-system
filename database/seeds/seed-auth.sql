INSERT INTO users (id, email, phone, full_name, date_of_birth, password_hash, role, status, email_verified, created_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'user@gmail.com', '0123456789',
     'User Example', '2000-01-01',
     '$2a$12$Vf2aWzXWhVqP606Jg02AEO1b266ZniLxg3J5lnlgzR9zXzVomm8ne',
     'user', 'active', true, NOW()),

    ('550e8400-e29b-41d4-a716-446655440002', 'staff@gmail.com', '0987654321',
     'Staff Example', '1998-05-12',
     '$2a$12$Vf2aWzXWhVqP606Jg02AEO1b266ZniLxg3J5lnlgzR9zXzVomm8ne',
     'staff', 'active', true, NOW()),

    ('550e8400-e29b-41d4-a716-446655440003', 'admin@gmail.com', '0111222333',
     'Admin Example', '1995-09-20',
     '$2a$12$Vf2aWzXWhVqP606Jg02AEO1b266ZniLxg3J5lnlgzR9zXzVomm8ne',
     'admin', 'active', true, NOW());
