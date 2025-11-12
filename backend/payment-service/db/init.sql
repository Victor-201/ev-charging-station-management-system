-- =====================================================
-- EV_PAYMENT_DB — Database Schema (v3.5)
-- Service: Payment Service
-- Author: Victor
-- Last Updated: 2025-11
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM definitions
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_type') THEN
    CREATE TYPE tx_type AS ENUM ('topup','payment','refund');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_method') THEN
    CREATE TYPE tx_method AS ENUM ('wallet','bank_transfer','cash');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status') THEN
    CREATE TYPE tx_status AS ENUM ('pending','completed','failed','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_related_type') THEN
    CREATE TYPE tx_related_type AS ENUM ('subscription','booking','charging_session','guest_charging');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_status') THEN
    CREATE TYPE wallet_status AS ENUM ('active','suspended','closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_tx_type') THEN
    CREATE TYPE wallet_tx_type AS ENUM ('topup','payment','refund');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('unpaid','paid','overdue','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('basic','standard','premium');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active','cancelled','expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outbox_status') THEN
    CREATE TYPE outbox_status AS ENUM ('pending','processed','failed');
  END IF;
END$$;

-- =====================================================
-- Trigger function: auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Table: plans
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type plan_type NOT NULL DEFAULT 'basic',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  duration INTERVAL,
  duration_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_plans_updated
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status subscription_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date > start_date)
);
CREATE TRIGGER trg_subs_updated
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type tx_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) DEFAULT 'VND',
  method tx_method NOT NULL,
  related_id UUID,
  related_type tx_related_type,
  external_id VARCHAR(100),
  reference_code VARCHAR(100) UNIQUE,
  status tx_status DEFAULT 'pending',
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (type = 'topup' AND method = 'bank_transfer' AND related_id IS NULL AND related_type IS NULL)
    OR
    (type = 'payment' AND related_type IN ('subscription','booking') AND method IN ('wallet','bank_transfer'))
    OR
    (type = 'payment' AND related_type = 'charging_session' AND method IN ('wallet','cash','bank_transfer'))
    OR
    (type = 'payment' AND related_type = 'guest_charging' AND method IN ('cash','bank_transfer'))
    OR
    (type = 'refund' AND method = 'wallet')
  )
);
CREATE TRIGGER trg_tx_updated
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: wallets
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  balance NUMERIC(14,2) DEFAULT 0 CHECK (balance >= 0),
  status wallet_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_wallet_updated
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: wallet_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type wallet_tx_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_wallet_tx_updated
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: invoices
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  due_date TIMESTAMPTZ,
  status invoice_status DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_invoice_updated
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed: Plans
-- =====================================================
INSERT INTO plans (id, name, description, type, price, duration_days)
VALUES
  ('11111111-1111-1111-1111-111111111111','Basic Plan','Gói cơ bản','basic',12000,30),
  ('22222222-2222-2222-2222-222222222222','Standard Plan','Gói tiêu chuẩn','standard',15000,30),
  ('33333333-3333-3333-3333-333333333333','Premium Plan','Gói cao cấp','premium',18000,30);

-- =====================================================
-- Seed: Wallets & Users
-- =====================================================
INSERT INTO wallets (id, user_id, balance)
VALUES
  ('aaaa1111-1111-1111-1111-aaaaaaaa1111','bbbb1111-1111-1111-1111-bbbbbbbbbbbb',50000),
  ('aaaa2222-2222-2222-2222-aaaaaaaa2222','bbbb2222-2222-2222-2222-bbbbbbbbbbbb',50000),
  ('aaaa3333-3333-3333-3333-aaaaaaaa3333','bbbb3333-3333-3333-3333-bbbbbbbbbbbb',50000);

-- =====================================================
-- Seed: Subscriptions
-- =====================================================
INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, status)
VALUES
  ('ssss1111-1111-1111-1111-aaaaaaaa1111','bbbb1111-1111-1111-1111-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222',NOW(),NOW()+INTERVAL '30 days','active'),
  ('ssss2222-2222-2222-2222-aaaaaaaa2222','bbbb2222-2222-2222-2222-bbbbbbbbbbbb','33333333-3333-3333-3333-333333333333',NOW(),NOW()+INTERVAL '30 days','active');

-- =====================================================
-- Seed: Transactions
-- =====================================================
INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
VALUES
  ('11111111-1111-1111-1111-aaaaaaaaaaaa','bbbb1111-1111-1111-1111-bbbbbbbbbbbb','topup',20000,'bank_transfer',NULL,NULL,'completed'),
  ('22222222-2222-2222-2222-aaaaaaaabbbb','bbbb2222-2222-2222-2222-bbbbbbbbbbbb','topup',20000,'bank_transfer',NULL,NULL,'completed'),
  ('33333333-3333-3333-3333-cccccccccccc','bbbb1111-1111-1111-1111-bbbbbbbbbbbb','payment',12000,'wallet','subscription','ssss1111-1111-1111-1111-aaaaaaaa1111','completed'),
  ('44444444-4444-4444-4444-dddddddddddd','bbbb2222-2222-2222-2222-bbbbbbbbbbbb','payment',15000,'bank_transfer','booking','aaaa4444-4444-4444-4444-aaaaaaaa4444','completed'),
  ('55555555-5555-5555-5555-eeeeeeeeeeee','bbbb1111-1111-1111-1111-bbbbbbbbbbbb','refund',10000,'wallet',NULL,NULL,'completed');

-- =====================================================
-- Seed: Wallet Transactions
-- =====================================================
INSERT INTO wallet_transactions (id, wallet_id, transaction_id, amount, type, note)
VALUES
  ('aaaaaaa1-1111-1111-1111-aaaaaaaa1111','aaaa1111-1111-1111-1111-aaaaaaaa1111','11111111-1111-1111-1111-aaaaaaaaaaaa',20000,'topup','Nạp tiền seed'),
  ('aaaaaaa2-2222-2222-2222-aaaaaaaa2222','aaaa2222-2222-2222-2222-aaaaaaaa2222','22222222-2222-2222-2222-aaaaaaaabbbb',20000,'topup','Nạp tiền seed'),
  ('aaaaaaa3-3333-3333-3333-cccccccccccc','aaaa1111-1111-1111-1111-aaaaaaaa1111','33333333-3333-3333-3333-cccccccccccc',12000,'payment','Thanh toán seed'),
  ('aaaaaaa4-4444-4444-4444-dddddddddddd','aaaa2222-2222-2222-2222-aaaaaaaa2222','44444444-4444-4444-4444-dddddddddddd',15000,'payment','Thanh toán seed'),
  ('aaaaaaa5-5555-5555-5555-eeeeeeeeeeee','aaaa1111-1111-1111-1111-aaaaaaaa1111','55555555-5555-5555-5555-eeeeeeeeeeee',10000,'refund','Hoàn tiền seed');

-- =====================================================
-- Seed: Invoices
-- =====================================================
INSERT INTO invoices (id, transaction_id, user_id, total_amount, due_date, status)
VALUES
  ('iiii1111-1111-1111-1111-aaaaaaaa1111','33333333-3333-3333-3333-cccccccccccc','bbbb1111-1111-1111-1111-bbbbbbbbbbbb',12000,NOW()+INTERVAL '5 days','paid'),
  ('iiii2222-2222-2222-2222-bbbbbbbb2222','44444444-4444-4444-4444-dddddddddddd','bbbb2222-2222-2222-2222-bbbbbbbbbbbb',15000,NOW()+INTERVAL '5 days','paid'),
  ('iiii3333-3333-3333-3333-eeeeeeee3333','55555555-5555-5555-5555-eeeeeeeeeeee','bbbb1111-1111-1111-1111-bbbbbbbbbbbb',10000,NOW()+INTERVAL '5 days','paid');
