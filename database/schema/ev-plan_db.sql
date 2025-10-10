-- plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    description TEXT,
    type VARCHAR(50), -- prepaid, postpaid, vip
    price NUMERIC(12,2),
    duration INTERVAL
);
