-- =====================================================
-- EV_PAYMENT_DB — Database Schema (v3.2)
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
  -- Giao dịch: loại
  PERFORM 1 FROM pg_type WHERE typname = 'tx_type';
  IF NOT FOUND THEN
    CREATE TYPE tx_type AS ENUM (
      'topup',         -- Nạp tiền
      'payment',       -- Thanh toán
      'refund'         -- Hoàn tiền
    );
  END IF;

  -- Giao dịch: phương thức
  PERFORM 1 FROM pg_type WHERE typname = 'tx_method';
  IF NOT FOUND THEN
    CREATE TYPE tx_method AS ENUM (
      'wallet',          -- Ví nội bộ
      'bank_transfer',   -- Chuyển khoản ngân hàng
      'cash'             -- Tiền mặt
    );
  END IF;

  -- Giao dịch: trạng thái
  PERFORM 1 FROM pg_type WHERE typname = 'tx_status';
  IF NOT FOUND THEN
    CREATE TYPE tx_status AS ENUM (
      'pending',      -- Đã tạo, chờ xử lý/thanh toán
      'completed',    -- Thành công
      'failed',       -- Thất bại
      'cancelled'     -- Hủy
    );
  END IF;

  -- Giao dịch: đối tượng liên quan (thống nhất prefix)
  PERFORM 1 FROM pg_type WHERE typname = 'tx_related_type';
  IF NOT FOUND THEN
    CREATE TYPE tx_related_type AS ENUM (
      'subscription',      -- Đăng ký gói
      'booking',           -- Đặt chỗ
      'charging_session',  -- Phiên sạc
      'guest_charging'     -- Sạc cho khách vãng lai
    );
  END IF;

  -- Ví: trạng thái
  PERFORM 1 FROM pg_type WHERE typname = 'wallet_status';
  IF NOT FOUND THEN
    CREATE TYPE wallet_status AS ENUM ('active', 'suspended', 'closed');
  END IF;

  -- Loại giao dịch trong ví
  PERFORM 1 FROM pg_type WHERE typname = 'wallet_tx_type';
  IF NOT FOUND THEN
    CREATE TYPE wallet_tx_type AS ENUM ('topup', 'payment', 'refund');
  END IF;

  -- Hóa đơn: trạng thái
  PERFORM 1 FROM pg_type WHERE typname = 'invoice_status';
  IF NOT FOUND THEN
    CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'overdue', 'cancelled');
  END IF;

  -- Gói: loại
  PERFORM 1 FROM pg_type WHERE typname = 'plan_type';
  IF NOT FOUND THEN
    CREATE TYPE plan_type AS ENUM ('basic', 'standard', 'premium');
  END IF;

  -- Gói đăng ký: trạng thái
  PERFORM 1 FROM pg_type WHERE typname = 'subscription_status';
  IF NOT FOUND THEN
    CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'expired');
  END IF;

  -- Outbox: trạng thái
  PERFORM 1 FROM pg_type WHERE typname = 'outbox_status';
  IF NOT FOUND THEN
    CREATE TYPE outbox_status AS ENUM ('pending', 'processed', 'failed');
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
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
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
  status subscription_status DEFAULT 'pending',
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
  user_id UUID NOT NULL,                   -- Bắt buộc có user_id
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

  -- =====================
  -- Logic constraints
  -- =====================
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
-- Function: update_wallet_balance
-- =====================================================
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  rows_updated INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    CASE NEW.type
      WHEN 'topup', 'refund' THEN
        UPDATE wallets
        SET balance = balance + NEW.amount, updated_at = NOW()
        WHERE id = NEW.wallet_id;
      WHEN 'payment' THEN
        UPDATE wallets
        SET balance = balance - NEW.amount, updated_at = NOW()
        WHERE id = NEW.wallet_id AND balance >= NEW.amount;
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        IF rows_updated = 0 THEN
          RAISE EXCEPTION 'Insufficient balance for wallet_id=%', NEW.wallet_id;
        END IF;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_balance
AFTER INSERT ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();


-- =====================================================
-- Table: event_outbox
-- =====================================================
CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status outbox_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_outbox_updated
BEFORE UPDATE ON event_outbox
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- View: vw_wallet_balances
-- =====================================================
CREATE OR REPLACE VIEW vw_wallet_balances AS
SELECT
  id AS wallet_id,
  user_id,
  balance,
  status,
  updated_at
FROM wallets;


-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tx_user_created_at
  ON transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created_at
  ON wallet_transactions (wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_user_status
  ON invoices (user_id, status);
