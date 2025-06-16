-- Create sales order payments table for multiple payment methods per order
CREATE TABLE sales_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('credit', 'cash', 'upi', 'bank_transfer', 'credit_increase')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reference_number TEXT,
  proof_url TEXT,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer credit limit extensions table
CREATE TABLE customer_credit_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_sales_order_payments_order_id ON sales_order_payments(sales_order_id);
CREATE INDEX idx_sales_order_payments_type ON sales_order_payments(payment_type);
CREATE INDEX idx_sales_order_payments_status ON sales_order_payments(status);
CREATE INDEX idx_customer_credit_extensions_customer_id ON customer_credit_extensions(customer_id);
CREATE INDEX idx_customer_credit_extensions_order_id ON customer_credit_extensions(sales_order_id);
CREATE INDEX idx_customer_credit_extensions_status ON customer_credit_extensions(status);

-- Add RLS policies
ALTER TABLE sales_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit_extensions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for your auth system)
CREATE POLICY "Allow all operations on sales_order_payments for authenticated users" ON sales_order_payments
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on customer_credit_extensions for authenticated users" ON customer_credit_extensions
  FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_order_payments_updated_at BEFORE UPDATE ON sales_order_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_credit_extensions_updated_at BEFORE UPDATE ON customer_credit_extensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sales_order_payments IS 'Stores multiple payment methods for each sales order';
COMMENT ON TABLE customer_credit_extensions IS 'Stores customer credit limit extension requests';
COMMENT ON COLUMN sales_order_payments.payment_type IS 'Type of payment: credit, cash, upi, bank_transfer, credit_increase';
COMMENT ON COLUMN sales_order_payments.proof_url IS 'URL to uploaded payment proof for UPI/Bank Transfer';
COMMENT ON COLUMN customer_credit_extensions.status IS 'Status of credit extension request: pending, approved, rejected';
