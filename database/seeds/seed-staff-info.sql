-- Seed Staff and Attendance data
-- Database: ev_user_db
-- Note: Run after seed-user.sql and seed-auth.sql

DO $$
DECLARE
    v_staff_user_id1 UUID;
    v_staff_user_id2 UUID;
    v_staff_user_id3 UUID;
    v_staff_user_id4 UUID;
    v_staff_user_id5 UUID;
    v_station_id1 UUID := '10000000-0000-0000-0000-000000000001';
    v_station_id2 UUID := '10000000-0000-0000-0000-000000000002';
    v_staff_id1 UUID;
    v_staff_id2 UUID;
    v_staff_id3 UUID;
    v_staff_id4 UUID;
    v_staff_id5 UUID;
BEGIN
    -- ============================================
    -- 1. CREATE STAFF USERS
    -- ============================================
    
    -- Staff User 1: Manager
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'manager.nguyen@evcharging.com',
        'Nguyễn Văn Quản Lý',
        '+84901234567',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id1;

    -- Staff User 2: Technician
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'tech.tran@evcharging.com',
        'Trần Văn Kỹ Thuật',
        '+84901234568',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id2;

    -- Staff User 3: Operator 1
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'operator.le@evcharging.com',
        'Lê Thị Vận Hành',
        '+84901234569',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id3;

    -- Staff User 4: Operator 2
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'operator.pham@evcharging.com',
        'Phạm Văn Điều Hành',
        '+84901234570',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id4;

    -- Staff User 5: Manager at Station 2
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'manager.hoang@evcharging.com',
        'Hoàng Thị Quản Lý',
        '+84901234571',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id5;

    -- Create user profiles
    INSERT INTO user_profiles (user_id, name, phone, address)
    VALUES 
        (v_staff_user_id1, 'Nguyễn Văn Quản Lý', '+84901234567', 'Hà Nội, Việt Nam'),
        (v_staff_user_id2, 'Trần Văn Kỹ Thuật', '+84901234568', 'Hồ Chí Minh, Việt Nam'),
        (v_staff_user_id3, 'Lê Thị Vận Hành', '+84901234569', 'Đà Nẵng, Việt Nam'),
        (v_staff_user_id4, 'Phạm Văn Điều Hành', '+84901234570', 'Hà Nội, Việt Nam'),
        (v_staff_user_id5, 'Hoàng Thị Quản Lý', '+84901234571', 'Hồ Chí Minh, Việt Nam')
    ON CONFLICT (user_id) DO NOTHING;

    -- ============================================
    -- 2. INSERT STAFF INFO
    -- ============================================

    -- Manager at Station 1 (Morning shift)
    INSERT INTO staff (
        id, user_id, station_id,
        position, shift, hire_date, is_active, notes
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id1,
        v_station_id1,
        'manager',
        'morning',
        '2023-01-15',
        true,
        'Experienced manager with 5+ years in EV charging industry'
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_id1;

    -- Technician at Station 1 (Afternoon shift)
    INSERT INTO staff (
        id, user_id, station_id,
        position, shift, hire_date, is_active, notes
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id2,
        v_station_id1,
        'technician',
        'afternoon',
        '2023-03-20',
        true,
        'Certified EV technician'
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_id2;

    -- Operator at Station 2 (Morning shift)
    INSERT INTO staff (
        id, user_id, station_id,
        position, shift, hire_date, is_active
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id3,
        v_station_id2,
        'operator',
        'morning',
        '2023-06-01',
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_id3;

    -- Operator at Station 1 (Night shift)
    INSERT INTO staff (
        id, user_id, station_id,
        position, shift, hire_date, is_active
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id4,
        v_station_id1,
        'operator',
        'night',
        '2023-08-10',
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_id4;

    -- Manager at Station 2 (Morning shift)
    INSERT INTO staff (
        id, user_id, station_id,
        position, shift, hire_date, is_active
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id5,
        v_station_id2,
        'manager',
        'morning',
        '2023-09-01',
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_id5;

    -- ============================================
    -- 3. INSERT SAMPLE ATTENDANCE (Last 7 days + today)
    -- ============================================

    -- Manager 1 attendance (Station 1)
    INSERT INTO attendance (staff_id, work_date, check_in, check_out, status)
    SELECT 
        v_staff_id1,
        CURRENT_DATE + i,
        (CURRENT_DATE + i + TIME '08:00:00')::timestamp,
        (CURRENT_DATE + i + TIME '17:00:00')::timestamp,
        CASE 
            WHEN i < 0 THEN 'present'
            WHEN i = 0 THEN 'present'
            ELSE 'absent'
        END
    FROM generate_series(-7, 0) i
    WHERE EXTRACT(DOW FROM CURRENT_DATE + i) NOT IN (0, 6) -- Skip weekends
    ON CONFLICT (staff_id, work_date) DO NOTHING;

    -- Technician attendance (Station 1)
    INSERT INTO attendance (staff_id, work_date, check_in, check_out, status)
    SELECT 
        v_staff_id2,
        CURRENT_DATE + i,
        (CURRENT_DATE + i + TIME '14:00:00')::timestamp,
        (CURRENT_DATE + i + TIME '22:00:00')::timestamp,
        CASE 
            WHEN i < -1 THEN 'present'
            WHEN i = -1 THEN 'late' -- Late one day
            WHEN i = 0 THEN 'present'
            ELSE 'absent'
        END
    FROM generate_series(-7, 0) i
    ON CONFLICT (staff_id, work_date) DO NOTHING;

    -- Operator 1 attendance (Station 2)
    INSERT INTO attendance (staff_id, work_date, check_in, check_out, status)
    SELECT 
        v_staff_id3,
        CURRENT_DATE + i,
        (CURRENT_DATE + i + TIME '06:00:00')::timestamp,
        (CURRENT_DATE + i + TIME '14:00:00')::timestamp,
        CASE 
            WHEN i < -2 THEN 'present'
            WHEN i = -2 THEN 'leave' -- On leave
            WHEN i >= -1 THEN 'present'
            ELSE 'absent'
        END
    FROM generate_series(-7, 0) i
    ON CONFLICT (staff_id, work_date) DO NOTHING;

    -- Operator 2 attendance (Station 1) - Night shift
    INSERT INTO attendance (staff_id, work_date, check_in, check_out, status)
    SELECT 
        v_staff_id4,
        CURRENT_DATE + i,
        (CURRENT_DATE + i + TIME '22:00:00')::timestamp,
        (CURRENT_DATE + i + 1 + TIME '06:00:00')::timestamp,
        CASE 
            WHEN i < 0 THEN 'present'
            WHEN i = 0 THEN 'present'
            ELSE 'absent'
        END
    FROM generate_series(-7, 0) i
    ON CONFLICT (staff_id, work_date) DO NOTHING;

    -- Manager 2 attendance (Station 2)
    INSERT INTO attendance (staff_id, work_date, check_in, check_out, status)
    SELECT 
        v_staff_id5,
        CURRENT_DATE + i,
        (CURRENT_DATE + i + TIME '08:00:00')::timestamp,
        (CURRENT_DATE + i + TIME '17:00:00')::timestamp,
        CASE 
            WHEN i < -3 THEN 'present'
            WHEN i = -3 THEN 'absent' -- Absent one day
            WHEN i > -3 THEN 'present'
            ELSE 'absent'
        END
    FROM generate_series(-7, 0) i
    WHERE EXTRACT(DOW FROM CURRENT_DATE + i) NOT IN (0, 6) -- Skip weekends
    ON CONFLICT (staff_id, work_date) DO NOTHING;

    RAISE NOTICE 'Staff and attendance data seeded successfully';
END $$;

-- Output summary
SELECT 
    'Staff Seed Completed' as status,
    (SELECT COUNT(*) FROM staff) as total_staff,
    (SELECT COUNT(*) FROM attendance) as total_attendance_records;

