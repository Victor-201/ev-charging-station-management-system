-- =====================================================
-- EV_PAYMENT_DB — FULL SAFE SEED (10 users, ~25 transactions)
-- Author: Victor
-- Last Updated: 2025-11
-- =====================================================

-- Xóa dữ liệu cũ
TRUNCATE TABLE wallet_transactions, wallets, invoices, transactions, subscriptions, plans RESTART IDENTITY CASCADE;

-- =====================================================
-- PLANS
-- =====================================================
INSERT INTO plans (id, name, description, type, price, duration_days)
VALUES
  (gen_random_uuid(),'Basic Plan','Gói cơ bản cho người mới bắt đầu','basic',99000,30),
  (gen_random_uuid(),'Standard Plan','Gói tiêu chuẩn dành cho người dùng thường xuyên','standard',199000,30),
  (gen_random_uuid(),'Premium Plan','Gói cao cấp với nhiều ưu đãi hơn','premium',299000,30);

-- =====================================================
-- WALLETS & USERS (10 users)
-- =====================================================
INSERT INTO wallets (id, user_id, balance)
SELECT gen_random_uuid(), gen_random_uuid(), 0
FROM generate_series(1,10);

-- =====================================================
-- SUBSCRIPTIONS (1-2 subscription / user)
-- =====================================================
WITH w AS (SELECT id AS wallet_id, user_id FROM wallets),
     p AS (SELECT id, type FROM plans)
INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, status)
SELECT gen_random_uuid(), w.user_id, p.id,
       NOW(), NOW() + INTERVAL '30 days', 'active'::subscription_status
FROM w
JOIN p ON p.type IN ('standard','premium')
WHERE random() > 0.3;

-- =====================================================
-- 1️⃣ TRANSACTIONS: Topup đảm bảo balance
-- =====================================================
INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
SELECT gen_random_uuid(), w.user_id, 'topup'::tx_type, 500000, 'bank_transfer'::tx_method, NULL, NULL, 'completed'::tx_status
FROM wallets w;

-- WALLET_TRANSACTIONS tương ứng cho topup
INSERT INTO wallet_transactions (id, wallet_id, transaction_id, amount, type, note)
SELECT gen_random_uuid(), w.id, t.id, t.amount, t.type::text::wallet_tx_type,
       'Nạp tiền seed đảm bảo balance'
FROM wallets w
JOIN transactions t ON t.user_id = w.user_id
WHERE t.type='topup';

-- COMMIT để trigger cập nhật balance trước các payment bằng ví
COMMIT;

-- =====================================================
-- 2️⃣ TRANSACTIONS: Các payment / refund tiếp theo (~20-25)
-- =====================================================
WITH w AS (SELECT id AS wallet_id, user_id FROM wallets),
     s AS (SELECT * FROM subscriptions)
INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
SELECT gen_random_uuid(),
       w.user_id,
       v.t_type::tx_type,
       CASE v.t_type
         WHEN 'topup' THEN 300000 + round(random()*200000)
         WHEN 'payment' THEN 80000 + round(random()*250000)
         WHEN 'refund' THEN 50000 + round(random()*50000)
       END,
       v.t_method::tx_method,
       v.rel_type::tx_related_type,
       v.rel_id,
       'completed'::tx_status
FROM w,
LATERAL (
  VALUES
    ('topup','bank_transfer',NULL,NULL),
    ('payment','wallet','subscription', (SELECT id FROM s WHERE s.user_id=w.user_id ORDER BY random() LIMIT 1)),
    ('payment','bank_transfer','booking', gen_random_uuid()),
    ('payment','cash','charging_session', gen_random_uuid()),
    ('payment','bank_transfer','guest_charging', gen_random_uuid()),
    ('refund','wallet',NULL,NULL)
) AS v(t_type, t_method, rel_type, rel_id)
WHERE random() > 0.2
LIMIT 25;

-- =====================================================
-- WALLET TRANSACTIONS
-- =====================================================
INSERT INTO wallet_transactions (id, wallet_id, transaction_id, amount, type, note)
SELECT gen_random_uuid(),
       w.id AS wallet_id,
       tx.id AS transaction_id,
       tx.amount,
       tx.type::text::wallet_tx_type,
       CASE tx.type
         WHEN 'topup' THEN 'Nạp tiền seed'
         WHEN 'payment' THEN 'Thanh toán seed'
         WHEN 'refund' THEN 'Hoàn tiền seed'
       END
FROM wallets w
JOIN transactions tx 
  ON tx.user_id = w.user_id
WHERE tx.type IN ('topup','payment','refund');

-- =====================================================
-- INVOICES
-- =====================================================
INSERT INTO invoices (id, transaction_id, user_id, total_amount, due_date, status)
SELECT gen_random_uuid(),
       tx.id,
       tx.user_id,
       tx.amount,
       NOW() + INTERVAL '5 days',
       'paid'::invoice_status
FROM transactions tx
WHERE tx.status='completed';
