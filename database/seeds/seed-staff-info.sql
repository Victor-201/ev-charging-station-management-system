
DO $$
DECLARE
    v_staff_user_id1 UUID;
    v_staff_user_id2 UUID;
    v_staff_user_id3 UUID;
    v_staff_user_id4 UUID;
    v_staff_user_id5 UUID;
    v_station_id1 UUID := '10000000-0000-0000-0000-000000000001';
    v_station_id2 UUID := '10000000-0000-0000-0000-000000000002';
    v_staff_info_id1 UUID;
    v_staff_info_id2 UUID;
    v_staff_info_id3 UUID;
BEGIN
    -- Get or create staff users
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

    -- Staff User 2: Supervisor
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'supervisor.tran@evcharging.com',
        'Trần Thị Giám Sát',
        '+84901234568',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id2;

    -- Staff User 3: Technician
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'tech.le@evcharging.com',
        'Lê Văn Kỹ Thuật',
        '+84901234569',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id3;

    -- Staff User 4: Customer Service
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'cs.pham@evcharging.com',
        'Phạm Thị Chăm Sóc',
        '+84901234570',
        'staff',
        true
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_user_id4;

    -- Staff User 5: Maintenance
    INSERT INTO users (id, email, full_name, phone_number, role, is_active)
    VALUES (
        gen_random_uuid(),
        'maint.hoang@evcharging.com',
        'Hoàng Văn Bảo Trì',
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
        (v_staff_user_id2, 'Trần Thị Giám Sát', '+84901234568', 'Hồ Chí Minh, Việt Nam'),
        (v_staff_user_id3, 'Lê Văn Kỹ Thuật', '+84901234569', 'Đà Nẵng, Việt Nam'),
        (v_staff_user_id4, 'Phạm Thị Chăm Sóc', '+84901234570', 'Hà Nội, Việt Nam'),
        (v_staff_user_id5, 'Hoàng Văn Bảo Trì', '+84901234571', 'Hồ Chí Minh, Việt Nam')
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert Staff Info
    -- Manager at Station 1
    INSERT INTO staff_info (
        id, user_id, station_id, staff_level, position, department,
        employee_code, hire_date, employment_status, salary_grade,
        emergency_contact_name, emergency_contact_phone,
        certifications, notes
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id1,
        v_station_id1,
        'MANAGER',
        'Station Manager',
        'Operations',
        'MGR-001',
        '2023-01-15',
        'ACTIVE',
        'G4',
        'Nguyễn Thị Mai',
        '+84912345678',
        '[
            {"name": "Station Management Certificate", "issued_date": "2023-02-01", "expiry_date": "2026-02-01"},
            {"name": "Safety Officer", "issued_date": "2023-03-01", "expiry_date": "2025-03-01"}
        ]'::jsonb,
        'Experienced manager with 5+ years in EV charging industry'
    )
    ON CONFLICT (user_id, station_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_info_id1;

    -- Supervisor at Station 1
    INSERT INTO staff_info (
        id, user_id, station_id, staff_level, position, department,
        employee_code, hire_date, employment_status, salary_grade,
        emergency_contact_name, emergency_contact_phone,
        certifications
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id2,
        v_station_id1,
        'SUPERVISOR',
        'Operations Supervisor',
        'Operations',
        'SUP-001',
        '2023-03-20',
        'ACTIVE',
        'G3',
        'Trần Văn Anh',
        '+84913456789',
        '[
            {"name": "Operations Management", "issued_date": "2023-04-01", "expiry_date": "2025-04-01"}
        ]'::jsonb
    )
    ON CONFLICT (user_id, station_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_info_id2;

    -- Technician at Station 2
    INSERT INTO staff_info (
        id, user_id, station_id, staff_level, position, department,
        employee_code, hire_date, employment_status, salary_grade,
        emergency_contact_name, emergency_contact_phone,
        certifications
    )
    VALUES (
        gen_random_uuid(),
        v_staff_user_id3,
        v_station_id2,
        'STAFF',
        'EV Charging Technician',
        'Maintenance',
        'TECH-001',
        '2023-06-01',
        'ACTIVE',
        'G2',
        'Lê Thị Lan',
        '+84914567890',
        '[
            {"name": "EV Technician Level 2", "issued_date": "2023-06-15", "expiry_date": "2025-06-15"},
            {"name": "Electrical Safety", "issued_date": "2023-07-01", "expiry_date": "2025-07-01"}
        ]'::jsonb
    )
    ON CONFLICT (user_id, station_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_staff_info_id3;

    -- Customer Service at Station 1
    INSERT INTO staff_info (
        user_id, station_id, staff_level, position, department,
        employee_code, hire_date, employment_status, salary_grade,
        emergency_contact_name, emergency_contact_phone
    )
    VALUES (
        v_staff_user_id4,
        v_station_id1,
        'STAFF',
        'Customer Service Representative',
        'Customer Support',
        'CS-001',
        '2023-08-10',
        'ACTIVE',
        'G2',
        'Phạm Văn Bình',
        '+84915678901'
    )
    ON CONFLICT (user_id, station_id) DO UPDATE SET updated_at = NOW();

    -- Maintenance Staff at Station 2
    INSERT INTO staff_info (
        user_id, station_id, staff_level, position, department,
        employee_code, hire_date, employment_status, salary_grade,
        emergency_contact_name, emergency_contact_phone,
        certifications
    )
    VALUES (
        v_staff_user_id5,
        v_station_id2,
        'STAFF',
        'Maintenance Specialist',
        'Maintenance',
        'MAINT-001',
        '2023-09-01',
        'ACTIVE',
        'G2',
        'Hoàng Thị Hoa',
        '+84916789012',
        '[
            {"name": "Equipment Maintenance", "issued_date": "2023-09-15", "expiry_date": "2025-09-15"}
        ]'::jsonb
    )
    ON CONFLICT (user_id, station_id) DO UPDATE SET updated_at = NOW();

    -- ============================================
    -- 2. INSERT WORK HISTORY
    -- ============================================

    -- Manager hired
    INSERT INTO staff_work_history (
        staff_info_id, action_type, new_station_id, new_level, new_position,
        reason, effective_date
    )
    VALUES (
        v_staff_info_id1,
        'HIRED',
        v_station_id1,
        'MANAGER',
        'Station Manager',
        'Initial hire as Station Manager',
        '2023-01-15'
    );

    -- Supervisor promoted from Staff
    INSERT INTO staff_work_history (
        staff_info_id, action_type, new_station_id, 
        old_level, new_level, old_position, new_position,
        reason, effective_date
    )
    VALUES (
        v_staff_info_id2,
        'PROMOTED',
        v_station_id1,
        'STAFF',
        'SUPERVISOR',
        'Operations Staff',
        'Operations Supervisor',
        'Promoted due to excellent performance',
        '2024-01-01'
    );

    -- Technician transferred
    INSERT INTO staff_work_history (
        staff_info_id, action_type,
        old_station_id, new_station_id,
        old_position, new_position,
        reason, effective_date
    )
    VALUES (
        v_staff_info_id3,
        'TRANSFERRED',
        v_station_id1,
        v_station_id2,
        'EV Charging Technician',
        'EV Charging Technician',
        'Transferred to support new station opening',
        '2024-03-01'
    );

    -- ============================================
    -- 3. INSERT SAMPLE SHIFTS (Current Week)
    -- ============================================

    -- Manager shifts (Full day)
    INSERT INTO staff_shifts (
        staff_info_id, station_id, shift_date, shift_type,
        start_time, end_time, status
    )
    SELECT 
        v_staff_info_id1,
        v_station_id1,
        CURRENT_DATE + i,
        'FULL_DAY',
        '08:00'::time,
        '17:00'::time,
        CASE WHEN i < 0 THEN 'COMPLETED' ELSE 'SCHEDULED' END
    FROM generate_series(-3, 4) i
    WHERE EXTRACT(DOW FROM CURRENT_DATE + i) NOT IN (0, 6); -- Skip weekends

    -- Supervisor shifts (Morning)
    INSERT INTO staff_shifts (
        staff_info_id, station_id, shift_date, shift_type,
        start_time, end_time, status
    )
    SELECT 
        v_staff_info_id2,
        v_station_id1,
        CURRENT_DATE + i,
        'MORNING',
        '06:00'::time,
        '14:00'::time,
        CASE WHEN i < 0 THEN 'COMPLETED' ELSE 'SCHEDULED' END
    FROM generate_series(-3, 4) i;

    -- Technician shifts (Afternoon)
    INSERT INTO staff_shifts (
        staff_info_id, station_id, shift_date, shift_type,
        start_time, end_time, status
    )
    SELECT 
        v_staff_info_id3,
        v_station_id2,
        CURRENT_DATE + i,
        'AFTERNOON',
        '14:00'::time,
        '22:00'::time,
        CASE WHEN i < 0 THEN 'COMPLETED' ELSE 'SCHEDULED' END
    FROM generate_series(-3, 4) i;

    RAISE NOTICE 'Staff info seeded successfully';
END $$;

-- Output summary
SELECT 
    'Staff Info Seed Completed' as status,
    (SELECT COUNT(*) FROM staff_info) as total_staff,
    (SELECT COUNT(*) FROM staff_work_history) as total_work_history,
    (SELECT COUNT(*) FROM staff_shifts) as total_shifts;
