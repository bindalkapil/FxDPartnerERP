-- Disable RLS on all tables to ensure no authentication issues
-- This migration ensures all tables are accessible without complex RLS policies

-- Disable RLS on all main tables
ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_arrivals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_arrival_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_arrival_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_record_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_record_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_order_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS current_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skus DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_credit_extensions DISABLE ROW LEVEL SECURITY;

-- Drop any remaining RLS policies that might exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables in public schema
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Ensure all tables have user_id columns for basic ownership
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE vehicle_arrivals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE purchase_records ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE current_inventory ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Create indexes for user_id columns for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_arrivals_user_id ON vehicle_arrivals(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_user_id ON purchase_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_user_id ON sales_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_current_inventory_user_id ON current_inventory(user_id);
