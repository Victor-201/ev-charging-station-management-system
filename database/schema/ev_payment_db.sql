-- payment_db

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- prepaid, postpaid, vip
    price NUMERIC(12,2) DEFAULT 0,
    duration INTERVAL, -- length of subscription
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_type ON plans(type);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- logical reference to auth_db.users
    plan_id UUID NOT NULL, -- references plans.id within this DB
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON subscriptions(user_id);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) UNIQUE, -- from payment gateway
    user_id UUID NOT NULL, -- logical reference
    session_id UUID, -- logical reference to charging_db.charging_sessions.id
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    method VARCHAR(50), -- wallet, bank, cash
    status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, refunded
    meta JSONB, -- gateway response, fees, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_session ON transactions(session_id);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    transaction_id UUID NOT NULL, -- references transactions.id in same DB
    amount NUMERIC(12,2) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_invoices_tx ON invoices(transaction_id);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL, -- references invoices.id
    description VARCHAR(255),
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- wallet_transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('TOPUP', 'PAYMENT', 'REFUND')),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wt_user ON wallet_transactions(user_id);

-- optional: outbox for events to user_db/analytics
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
