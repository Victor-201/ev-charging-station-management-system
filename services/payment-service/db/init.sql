-- =====================================================
-- EV_PAYMENT_DB — SEED DATA
-- Version: v3.2
-- Author: Victor
-- Last Updated: 2025-11
-- =====================================================

-- Xóa dữ liệu cũ (nếu có)
TRUNCATE TABLE event_outbox, wallet_transactions, wallets, invoices, transactions, subscriptions, plans RESTART IDENTITY CASCADE;

-- =====================================================
-- PLANS
-- =====================================================
INSERT INTO plans (id, name, description, type, price, duration_days)
VALUES
  (gen_random_uuid(), 'Basic Plan', 'Gói cơ bản cho người mới bắt đầu', 'basic', 99000, 30),
  (gen_random_uuid(), 'Standard Plan', 'Gói tiêu chuẩn dành cho người dùng thường xuyên', 'standard', 199000, 30),
  (gen_random_uuid(), 'Premium Plan', 'Gói cao cấp với nhiều ưu đãi hơn', 'premium', 299000, 30);

-- =====================================================
-- USERS (giả lập user_id để tham chiếu)
-- =====================================================
-- user_1: khách hàng thông thường
-- user_2: nhân viên (dùng cho guest_charging)
DO $$
DECLARE
  user1 UUID := gen_random_uuid();
  user2 UUID := gen_random_uuid();
BEGIN
  -- =====================================================
  -- WALLETS
  -- =====================================================
  INSERT INTO wallets (id, user_id, balance)
  VALUES
    (gen_random_uuid(), user1, 0),
    (gen_random_uuid(), user2, 0);

  -- =====================================================
  -- SUBSCRIPTIONS
  -- =====================================================
  INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, status)
  SELECT gen_random_uuid(), user1, id, NOW(), NOW() + INTERVAL '30 days', 'active'
  FROM plans WHERE type = 'standard' LIMIT 1;

  -- =====================================================
  -- TRANSACTIONS
  -- =====================================================

  -- 1️⃣ Nạp tiền (topup)
  INSERT INTO transactions (id, user_id, type, amount, method, status)
  VALUES (
    gen_random_uuid(), user1, 'topup', 500000, 'bank_transfer', 'completed'
  );

  -- 2️⃣ Thanh toán subscription (bằng ví)
  INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
  SELECT gen_random_uuid(), user1, 'payment', 199000, 'wallet', 'subscription', s.id, 'completed'
  FROM subscriptions s WHERE s.user_id = user1;

  -- 3️⃣ Thanh toán booking (bằng bank)
  INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
  VALUES (
    gen_random_uuid(), user1, 'payment', 150000, 'bank_transfer', 'booking', gen_random_uuid(), 'completed'
  );

  -- 4️⃣ Thanh toán charging_session (bằng cash)
  INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
  VALUES (
    gen_random_uuid(), user1, 'payment', 80000, 'cash', 'charging_session', gen_random_uuid(), 'completed'
  );

  -- 5️⃣ Thanh toán guest_charging (bằng bank) - user2 quản lý
  INSERT INTO transactions (id, user_id, type, amount, method, related_type, related_id, status)
  VALUES (
    gen_random_uuid(), user2, 'payment', 100000, 'bank_transfer', 'guest_charging', gen_random_uuid(), 'completed'
  );

  -- 6️⃣ Hoàn tiền (refund)
  INSERT INTO transactions (id, user_id, type, amount, method, status)
  VALUES (
    gen_random_uuid(), user1, 'refund', 50000, 'wallet', 'completed'
  );

  -- =====================================================
  -- WALLET TRANSACTIONS
  -- =====================================================
  INSERT INTO wallet_transactions (wallet_id, amount, type, note)
  SELECT w.id, 500000, 'topup', 'Nạp tiền qua ngân hàng'
  FROM wallets w WHERE w.user_id = user1;

  INSERT INTO wallet_transactions (wallet_id, amount, type, note)
  SELECT w.id, 199000, 'payment', 'Thanh toán gói Standard'
  FROM wallets w WHERE w.user_id = user1;

  INSERT INTO wallet_transactions (wallet_id, amount, type, note)
  SELECT w.id, 50000, 'refund', 'Hoàn tiền đơn đặt chỗ bị hủy'
  FROM wallets w WHERE w.user_id = user1;

  -- =====================================================
  -- INVOICES
  -- =====================================================
  INSERT INTO invoices (transaction_id, user_id, total_amount, due_date, status)
  SELECT id, user_id, amount, NOW() + INTERVAL '5 days', 'paid' FROM transactions WHERE status = 'completed';

  -- =====================================================
  -- EVENT_OUTBOX (mô phỏng publish event)
  -- =====================================================
  INSERT INTO event_outbox (aggregate_type, aggregate_id, type, payload, status)
  SELECT
    'transaction', id, 'TransactionCompleted',
    jsonb_build_object('transaction_id', id, 'amount', amount, 'type', type, 'status', status),
    'pending'
  FROM transactions WHERE status = 'completed';
END$$;
