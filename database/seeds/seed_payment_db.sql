-- =====================================================
-- EV_PAYMENT_DB — Seed Data (Full, constraint-safe, unique reference_code)
-- Author: Victor
-- Updated: 2025-11
-- =====================================================

-- Xoá dữ liệu cũ
TRUNCATE TABLE wallet_transactions, invoices, transactions, wallets, subscriptions, plans RESTART IDENTITY CASCADE;

-- =====================================================
-- Plans
-- =====================================================
INSERT INTO plans (name, description, type, price, duration_days)
VALUES
  ('Basic Plan', 'Gói cơ bản cho người dùng mới', 'basic', 10000, 30),
  ('Standard Plan', 'Gói tiêu chuẩn cho người dùng thường xuyên', 'standard', 15000, 90),
  ('Premium Plan', 'Gói cao cấp có nhiều ưu đãi', 'premium', 20000, 180);

-- =====================================================
-- Subscriptions (10 users)
-- =====================================================
INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
SELECT
  gen_random_uuid(),
  (SELECT id FROM plans ORDER BY random() LIMIT 1),
  NOW() - (random() * INTERVAL '10 days'),
  NOW() + (random() * INTERVAL '90 days'),
  (ARRAY['active','cancelled','expired'])[floor(random()*3 + 1)]::subscription_status
FROM generate_series(1,10);

-- =====================================================
-- Wallets (10 users)
-- =====================================================
INSERT INTO wallets (user_id, balance, status)
SELECT
  user_id,
  round((random() * 900000 + 100000)::numeric, 2),
  (ARRAY['active','suspended','active','active','active'])[floor(random()*5 + 1)]::wallet_status
FROM subscriptions;

-- =====================================================
-- Transactions (30 rows, constraint-safe, unique reference_code, random datetime)
-- =====================================================
WITH tx_seed AS (
  SELECT
    s.user_id,
    CASE
      WHEN i <= 10 THEN 'topup'::tx_type
      WHEN i <= 20 THEN 'payment'::tx_type
      ELSE 'refund'::tx_type
    END AS tx_type,
    round((random() * 400000 + 50000)::numeric, 2) AS amount,
    (ARRAY['subscription','booking','charging_session','guest_charging'])[floor(random()*4 + 1)] AS rtype,
    s.id AS sid,
    i
  FROM subscriptions s, generate_series(1,30) i
)
INSERT INTO transactions (user_id, type, amount, method, related_id, related_type, status, reference_code, created_at, updated_at)
SELECT
  user_id,
  tx_type,
  amount,
  CASE
    WHEN tx_type = 'topup' THEN 'bank_transfer'::tx_method
    WHEN tx_type = 'payment' THEN
      CASE
        WHEN rtype IN ('subscription','booking') THEN (ARRAY['wallet','bank_transfer'])[floor(random()*2 + 1)]
        WHEN rtype = 'charging_session' THEN (ARRAY['wallet','cash','bank_transfer'])[floor(random()*3 + 1)]
        WHEN rtype = 'guest_charging' THEN (ARRAY['cash','bank_transfer'])[floor(random()*2 + 1)]
      END::tx_method
    WHEN tx_type = 'refund' THEN 'wallet'::tx_method
  END,
  CASE
    WHEN tx_type = 'payment' THEN sid
    ELSE NULL
  END,
  CASE
    WHEN tx_type = 'payment' THEN rtype::tx_related_type
    ELSE NULL
  END,
  (ARRAY['pending','completed','failed','cancelled'])[floor(random()*4 + 1)]::tx_status,
  'TX-' || gen_random_uuid()::text,
  NOW() - (random() * INTERVAL '365 days') 
      - (random() * INTERVAL '30 days') 
      - (random() * INTERVAL '24 hours') 
      - (random() * INTERVAL '60 minutes') 
      - (random() * INTERVAL '60 seconds'),
  NOW()
FROM tx_seed;
-- =====================================================
-- Invoices (15 rows)
-- =====================================================
INSERT INTO invoices (transaction_id, user_id, total_amount, due_date, status)
SELECT
  t.id,
  t.user_id,
  t.amount,
  NOW() + (random() * INTERVAL '15 days'),
  (ARRAY['unpaid','paid','overdue','cancelled'])[floor(random()*4 + 1)]::invoice_status
FROM transactions t
ORDER BY random()
LIMIT 15;

-- =====================================================
-- Wallet Transactions (20 rows, trigger tự update balance)
-- =====================================================
INSERT INTO wallet_transactions (wallet_id, transaction_id, amount, type, note)
SELECT
  w.id,
  t.id,
  round((random() * 200000 + 20000)::numeric, 2),
  CASE
    WHEN t.type = 'topup' THEN 'topup'::wallet_tx_type
    WHEN t.type = 'payment' THEN 'payment'::wallet_tx_type
    WHEN t.type = 'refund' THEN 'refund'::wallet_tx_type
  END,
  'Auto test transaction #' || gen_random_uuid()::text
FROM wallets w
JOIN transactions t ON t.user_id = w.user_id
ORDER BY random()
LIMIT 20;

-- =====================================================
-- Verify counts
-- =====================================================
SELECT COUNT(*) AS plans FROM plans;
SELECT COUNT(*) AS subscriptions FROM subscriptions;
SELECT COUNT(*) AS wallets FROM wallets;
SELECT COUNT(*) AS transactions FROM transactions;
SELECT COUNT(*) AS invoices FROM invoices;
SELECT COUNT(*) AS wallet_transactions FROM wallet_transactions;

-- =====================================================
-- View tổng hợp ví
-- =====================================================
SELECT * FROM vw_wallet_balances ORDER BY updated_at DESC;
