-- User Service Database Schema
-- Database: ev_user_db

-- User Profiles (extended from auth service)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY, -- References users.id from auth service
    name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);


-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    battery_kwh DECIMAL(5,2),
    color VARCHAR(30),
    year INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);


-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);


-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'SYSTEM' CHECK (type IN ('SYSTEM', 'BOOKING', 'PAYMENT', 'CHARGING', 'PROMOTIONAL')),
    status VARCHAR(20) DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ')),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);


-- Scheduled Notifications
CREATE TABLE scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'SENT', 'FAILED')),
    channels JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_send_at ON scheduled_notifications(send_at);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status);


-- GDPR Compliance: Data Erasure Audit Log
CREATE TABLE data_erasure_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    erased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    erased_tables TEXT[] NOT NULL,
    requested_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_erasure_log_user_id ON data_erasure_log(user_id);
CREATE INDEX idx_data_erasure_log_erased_at ON data_erasure_log(erased_at);

COMMENT ON TABLE data_erasure_log IS 'Audit log for GDPR Article 17 (Right to Erasure) compliance. Tracks all user data deletion requests.';
COMMENT ON COLUMN data_erasure_log.user_id IS 'ID of user whose data was erased';
COMMENT ON COLUMN data_erasure_log.erased_tables IS 'Array of table names where data was deleted or anonymized';
COMMENT ON COLUMN data_erasure_log.requested_by IS 'User ID who initiated the erasure request (self or admin)';


-- Users table (synced from Auth Service via RabbitMQ events)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'station_owner')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts synced from Auth Service via event-driven architecture';
COMMENT ON COLUMN users.id IS 'User ID from Auth Service (same UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.role IS 'User role for authorization';


-- Processed Events table for idempotency
CREATE TABLE processed_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_processed_events_event_id ON processed_events(event_id);
CREATE INDEX idx_processed_events_processed_at ON processed_events(processed_at);
CREATE INDEX idx_processed_events_event_type ON processed_events(event_type);

COMMENT ON TABLE processed_events IS 'Tracks processed events for idempotency in event-driven architecture. Prevents duplicate processing of RabbitMQ messages.';
COMMENT ON COLUMN processed_events.event_id IS 'Unique identifier of the processed event (from RabbitMQ message)';
COMMENT ON COLUMN processed_events.event_type IS 'Type of the event (e.g., user.created, user.updated, user.deactivated)';
COMMENT ON COLUMN processed_events.processed_at IS 'Timestamp when the event was successfully processed';


-- FCM Tokens table for push notifications
CREATE TABLE user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX idx_user_fcm_tokens_is_active ON user_fcm_tokens(is_active);
CREATE INDEX idx_user_fcm_tokens_device_type ON user_fcm_tokens(device_type);

COMMENT ON TABLE user_fcm_tokens IS 'Firebase Cloud Messaging (FCM) tokens for push notifications. Each user can have multiple tokens for different devices.';
COMMENT ON COLUMN user_fcm_tokens.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN user_fcm_tokens.device_type IS 'Type of device: ios, android, or web';
COMMENT ON COLUMN user_fcm_tokens.is_active IS 'Whether the token is still valid and active';


-- Staff Information
CREATE TABLE staff_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id UUID, -- Reference to station (logical reference to station_db)
    staff_level VARCHAR(50) NOT NULL DEFAULT 'STAFF' CHECK (staff_level IN ('STAFF', 'SUPERVISOR', 'MANAGER', 'SENIOR_MANAGER')),
    position VARCHAR(100), -- e.g., 'Technician', 'Customer Service', 'Maintenance'
    department VARCHAR(100), -- e.g., 'Operations', 'Maintenance', 'Customer Support'
    employee_code VARCHAR(50) UNIQUE,
    hire_date DATE,
    employment_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')),
    salary_grade VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    certifications JSONB, -- Array of certifications: [{"name": "EV Technician", "issued_date": "2024-01-01", "expiry_date": "2025-01-01"}]
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, station_id)
);

CREATE INDEX idx_staff_info_user_id ON staff_info(user_id);
CREATE INDEX idx_staff_info_station_id ON staff_info(station_id);
CREATE INDEX idx_staff_info_level ON staff_info(staff_level);
CREATE INDEX idx_staff_info_status ON staff_info(employment_status);
CREATE INDEX idx_staff_info_employee_code ON staff_info(employee_code);

COMMENT ON TABLE staff_info IS 'Staff information for users with staff role, includes station assignment and hierarchy level';
COMMENT ON COLUMN staff_info.user_id IS 'Reference to users table (staff user)';
COMMENT ON COLUMN staff_info.station_id IS 'Logical reference to station in station_db (UUID)';
COMMENT ON COLUMN staff_info.staff_level IS 'Hierarchy level: STAFF < SUPERVISOR < MANAGER < SENIOR_MANAGER';
COMMENT ON COLUMN staff_info.employee_code IS 'Unique employee identification code';
COMMENT ON COLUMN staff_info.certifications IS 'JSON array of staff certifications and training records';


-- Staff Work History (track station transfers and promotions)
CREATE TABLE staff_work_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_info_id UUID NOT NULL REFERENCES staff_info(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('HIRED', 'PROMOTED', 'DEMOTED', 'TRANSFERRED', 'POSITION_CHANGE', 'TERMINATED')),
    old_station_id UUID,
    new_station_id UUID,
    old_level VARCHAR(50),
    new_level VARCHAR(50),
    old_position VARCHAR(100),
    new_position VARCHAR(100),
    reason TEXT,
    effective_date DATE NOT NULL,
    approved_by UUID REFERENCES users(id), -- Admin or manager who approved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_work_history_staff ON staff_work_history(staff_info_id);
CREATE INDEX idx_staff_work_history_action ON staff_work_history(action_type);
CREATE INDEX idx_staff_work_history_date ON staff_work_history(effective_date DESC);

COMMENT ON TABLE staff_work_history IS 'Audit trail of all staff changes including transfers, promotions, and position changes';
COMMENT ON COLUMN staff_work_history.action_type IS 'Type of change: HIRED, PROMOTED, DEMOTED, TRANSFERRED, POSITION_CHANGE, TERMINATED';


-- Staff Shift Schedule
CREATE TABLE staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_info_id UUID NOT NULL REFERENCES staff_info(id) ON DELETE CASCADE,
    station_id UUID NOT NULL,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FULL_DAY')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_shifts_staff ON staff_shifts(staff_info_id);
CREATE INDEX idx_staff_shifts_station ON staff_shifts(station_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(shift_date);
CREATE INDEX idx_staff_shifts_status ON staff_shifts(status);
CREATE UNIQUE INDEX uq_staff_shift_date ON staff_shifts(staff_info_id, shift_date, shift_type);

COMMENT ON TABLE staff_shifts IS 'Staff work shift scheduling and attendance tracking';
COMMENT ON COLUMN staff_shifts.check_in_time IS 'Actual check-in timestamp';
COMMENT ON COLUMN staff_shifts.check_out_time IS 'Actual check-out timestamp';
