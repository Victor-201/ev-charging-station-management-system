-- transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100),
    user_id UUID,
    session_id UUID,
    amount NUMERIC(12,2),
    method VARCHAR(50), -- ewallet, banking, cash
    status VARCHAR(50)
);

-- invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50),
    transaction_id UUID REFERENCES transactions(id),
    amount NUMERIC(12,2)
);

-- invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    description VARCHAR(255),
    quantity NUMERIC(10,2),
    unit_price NUMERIC(12,2),
    total NUMERIC(12,2)
);
