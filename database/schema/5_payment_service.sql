-- PAYMENT SERVICE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE payment_method AS ENUM ('wallet', 'bank_transfer', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE package_type AS ENUM ('subscription', 'prepaid', 'postpaid');

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    balance NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES charging_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(14,2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    invoice_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(14,2) NOT NULL,
    type package_type NOT NULL,
    duration INTERVAL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);
