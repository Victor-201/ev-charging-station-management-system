-- =======================================================
-- SEED DATA FOR payment_db (clean & valid sample dataset)
-- =======================================================

-- Clear existing data (for dev only)
TRUNCATE TABLE 
  invoice_items,
  invoices,
  transactions,
  subscriptions,
  plans,
  wallet_transactions,
  outbox_events
RESTART IDENTITY CASCADE;

-- =======================================================
-- 1️⃣ PLANS
-- =======================================================
INSERT INTO plans (name, description, type, price, duration)
VALUES
  ('Basic Plan', '30-day prepaid plan for casual EV users', 'prepaid', 100000, INTERVAL '30 days'),
  ('Pro Plan', 'Postpaid plan with 20% discount on sessions', 'postpaid', 250000, INTERVAL '30 days'),
  ('VIP Plan', 'Annual membership with unlimited support', 'vip', 2000000, INTERVAL '365 days'),
  ('Student Plan', 'Discounted plan for verified students', 'prepaid', 70000, INTERVAL '30 days'),
  ('Family Plan', 'Multi-user shared plan for households', 'postpaid', 500000, INTERVAL '30 days'),
  ('Enterprise Plan', 'Corporate subscription for fleets', 'vip', 5000000, INTERVAL '365 days');

-- =======================================================
-- 2️⃣ SUBSCRIPTIONS
-- =======================================================
INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM plans WHERE name='Basic Plan'), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 'active'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM plans WHERE name='VIP Plan'), CURRENT_DATE - INTERVAL '200 days', CURRENT_DATE + INTERVAL '165 days', 'active'),
  ('33333333-3333-3333-3333-333333333333', (SELECT id FROM plans WHERE name='Student Plan'), CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 'active'),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM plans WHERE name='Pro Plan'), CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days', 'expired'),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM plans WHERE name='Family Plan'), CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 'active'),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM plans WHERE name='Enterprise Plan'), CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '30 days', 'cancelled');

-- =======================================================
-- 3️⃣ TRANSACTIONS
-- =======================================================
INSERT INTO transactions (external_id, user_id, amount, currency, method, status, meta)
VALUES
  ('TXN001', '11111111-1111-1111-1111-111111111111', 100000, 'VND', 'ewallet', 'success', '{"provider":"Momo","fee":1500}'),
  ('TXN002', '22222222-2222-2222-2222-222222222222', 2000000, 'VND', 'banking', 'success', '{"bank":"Vietcombank"}'),
  ('TXN003', '33333333-3333-3333-3333-333333333333', 70000, 'VND', 'ewallet', 'pending', '{"provider":"ZaloPay"}'),
  ('TXN004', '44444444-4444-4444-4444-444444444444', 250000, 'VND', 'banking', 'failed', '{"error":"Insufficient balance"}'),
  ('TXN005', '55555555-5555-5555-5555-555555555555', 500000, 'VND', 'cash', 'success', '{"staff":"Nguyen Van A"}'),
  ('TXN006', '66666666-6666-6666-6666-666666666666', 5000000, 'VND', 'banking', 'success', '{"bank":"Techcombank","note":"Annual corporate"}'),
  ('TXN007', '11111111-1111-1111-1111-111111111111', 150000, 'VND', 'ewallet', 'success', '{"provider":"Momo","topup":true}'),
  ('TXN008', '22222222-2222-2222-2222-222222222222', 250000, 'VND', 'banking', 'refunded', '{"reason":"Duplicate"}');

-- =======================================================
-- 4️⃣ INVOICES
-- =======================================================
INSERT INTO invoices (invoice_no, transaction_id, amount, metadata)
SELECT 
  CONCAT('INV-', LPAD(ROW_NUMBER() OVER ()::TEXT, 3, '0')),
  id,
  amount,
  jsonb_build_object('note', 'Generated invoice for transaction')
FROM transactions
LIMIT 10;

-- =======================================================
-- 5️⃣ INVOICE ITEMS
-- =======================================================
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  COALESCE(p.name, 'Charging Session'),
  1,
  t.amount,
  t.amount
FROM invoices i
JOIN transactions t ON t.id = i.transaction_id
LEFT JOIN plans p ON t.amount = p.price
LIMIT 8;

-- =======================================================
-- 6️⃣ WALLET TRANSACTIONS
-- =======================================================
INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'topup', 150000, 150000),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'topup', 3000000, 3000000),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'charge', -70000, 2930000),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'refund', 250000, 2750000),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'topup', 1000000, 1000000),
  (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'charge', -5000000, 0);

-- =======================================================
-- 7️⃣ OUTBOX EVENTS
-- =======================================================
INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, published)
SELECT 
  'Transaction',
  id,
  CASE 
    WHEN status = 'success' THEN 'PAYMENT_SUCCESS'
    WHEN status = 'failed' THEN 'PAYMENT_FAILED'
    WHEN status = 'refunded' THEN 'PAYMENT_REFUNDED'
    ELSE 'PAYMENT_PENDING'
  END,
  jsonb_build_object('amount', amount, 'user_id', user_id, 'status', status),
  FALSE
FROM transactions;

-- =======================================================
-- END OF SEED DATA
-- =======================================================
