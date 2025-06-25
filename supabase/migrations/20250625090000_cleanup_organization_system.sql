-- Cleanup migration to remove organization system and simplify database
-- This removes all organization-related tables and RLS policies

-- Drop all RLS policies first
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_arrivals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;

-- Drop organization-related tables
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop organization-related functions
DROP FUNCTION IF EXISTS get_session_organization_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_organization_id(uuid) CASCADE;

-- Drop any remaining organization-related policies on other tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_organization_policy" ON %I.%I', 
                      r.tablename, r.schemaname, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON %I.%I', 
                      r.tablename, r.schemaname, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON %I.%I', 
                      r.tablename, r.schemaname, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON %I.%I', 
                      r.tablename, r.schemaname, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON %I.%I', 
                      r.tablename, r.schemaname, r.tablename);
    END LOOP;
END$$;

-- Remove organization_id columns from tables if they exist
ALTER TABLE IF EXISTS suppliers DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS customers DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS vehicle_arrivals DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS purchase_records DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS payments DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS sales_orders DROP COLUMN IF EXISTS organization_id;
ALTER TABLE IF EXISTS current_inventory DROP COLUMN IF EXISTS organization_id;

-- Add simple user_id columns for basic ownership (if not exists)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE vehicle_arrivals ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE purchase_records ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE current_inventory ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- Create simple indexes for performance
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS vehicle_arrivals_user_id_idx ON vehicle_arrivals(user_id);
CREATE INDEX IF NOT EXISTS purchase_records_user_id_idx ON purchase_records(user_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS sales_orders_user_id_idx ON sales_orders(user_id);
CREATE INDEX IF NOT EXISTS current_inventory_user_id_idx ON current_inventory(user_id);

-- Migration completed successfully
-- Cleanup organization system - removed multi-tenant complexity, simplified to basic user ownership
