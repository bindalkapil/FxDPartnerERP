-- Organization-based Row Level Security Implementation
-- This migration implements proper data isolation between organizations

-- First, let's create a helper function to get the current user's organization context
CREATE OR REPLACE FUNCTION get_current_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get organization_id from the current user's session or context
    -- This will be set by the application when a user switches organizations
    SELECT current_setting('app.current_organization_id', true)::UUID INTO org_id;
    
    -- If no organization is set in session, get the user's default organization
    IF org_id IS NULL THEN
        SELECT uo.organization_id INTO org_id
        FROM user_organizations uo
        WHERE uo.user_id = auth.uid()::text
        AND uo.status = 'active'
        ORDER BY uo.created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN org_id;
END;
$$;

-- Function to check if user has access to a specific organization
CREATE OR REPLACE FUNCTION user_has_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Superadmins have access to all organizations
    IF EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.user_id = auth.uid()::text
        AND uo.role = 'superadmin'
        AND uo.status = 'active'
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has access to the specific organization
    RETURN EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.user_id = auth.uid()::text
        AND uo.organization_id = org_id
        AND uo.status = 'active'
    );
END;
$$;

-- Drop all existing overly permissive policies
-- Products table
DROP POLICY IF EXISTS "products_allow_public_select" ON products;
DROP POLICY IF EXISTS "products_allow_public_insert" ON products;
DROP POLICY IF EXISTS "products_allow_public_update" ON products;
DROP POLICY IF EXISTS "products_allow_public_delete" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON products;
DROP POLICY IF EXISTS "Allow read access to all authenticated users for products" ON products;
DROP POLICY IF EXISTS "Allow insert access to all authenticated users for products" ON products;
DROP POLICY IF EXISTS "Allow insert access to anonymous users for products" ON products;

-- SKUs table
DROP POLICY IF EXISTS "skus_allow_public_select" ON skus;
DROP POLICY IF EXISTS "skus_allow_public_insert" ON skus;
DROP POLICY IF EXISTS "skus_allow_public_update" ON skus;
DROP POLICY IF EXISTS "skus_allow_public_delete" ON skus;
DROP POLICY IF EXISTS "Enable read access for all users" ON skus;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON skus;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON skus;
DROP POLICY IF EXISTS "Allow read access to all authenticated users for skus" ON skus;
DROP POLICY IF EXISTS "Allow insert access to all authenticated users for skus" ON skus;
DROP POLICY IF EXISTS "Allow insert access to anonymous users for skus" ON skus;

-- Customers table
DROP POLICY IF EXISTS "customers_allow_public_select" ON customers;
DROP POLICY IF EXISTS "customers_allow_public_insert" ON customers;
DROP POLICY IF EXISTS "customers_allow_public_update" ON customers;
DROP POLICY IF EXISTS "customers_allow_public_delete" ON customers;

-- Suppliers table
DROP POLICY IF EXISTS "suppliers_allow_public_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_allow_public_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_allow_public_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_allow_public_delete" ON suppliers;

-- Sales orders table
DROP POLICY IF EXISTS "sales_orders_allow_public_select" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_allow_public_insert" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_allow_public_update" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_allow_public_delete" ON sales_orders;

-- Sales order items table
DROP POLICY IF EXISTS "sales_order_items_allow_public_select" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_allow_public_insert" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_allow_public_update" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_allow_public_delete" ON sales_order_items;

-- Purchase records table
DROP POLICY IF EXISTS "purchase_records_allow_public_select" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_allow_public_insert" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_allow_public_update" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_allow_public_delete" ON purchase_records;

-- Purchase record items table
DROP POLICY IF EXISTS "purchase_record_items_allow_public_select" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_allow_public_insert" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_allow_public_update" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_allow_public_delete" ON purchase_record_items;

-- Purchase record costs table
DROP POLICY IF EXISTS "purchase_record_costs_allow_public_select" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_allow_public_insert" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_allow_public_update" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_allow_public_delete" ON purchase_record_costs;

-- Vehicle arrivals table
DROP POLICY IF EXISTS "vehicle_arrivals_allow_public_select" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_allow_public_insert" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_allow_public_update" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_allow_public_delete" ON vehicle_arrivals;

-- Vehicle arrival items table
DROP POLICY IF EXISTS "vehicle_arrival_items_allow_public_select" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_allow_public_insert" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_allow_public_update" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_allow_public_delete" ON vehicle_arrival_items;

-- Vehicle arrival attachments table
DROP POLICY IF EXISTS "vehicle_arrival_attachments_allow_public_select" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_allow_public_insert" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_allow_public_update" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_allow_public_delete" ON vehicle_arrival_attachments;

-- Current inventory table
DROP POLICY IF EXISTS "current_inventory_allow_public_select" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_allow_public_insert" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_allow_public_update" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_allow_public_delete" ON current_inventory;

-- Payments table
DROP POLICY IF EXISTS "payments_allow_public_select" ON payments;
DROP POLICY IF EXISTS "payments_allow_public_insert" ON payments;
DROP POLICY IF EXISTS "payments_allow_public_update" ON payments;
DROP POLICY IF EXISTS "payments_allow_public_delete" ON payments;

-- Sales order payments table
DROP POLICY IF EXISTS "Allow all operations on sales_order_payments for authenticated users" ON sales_order_payments;

-- Customer credit extensions table
DROP POLICY IF EXISTS "Allow all operations on customer_credit_extensions for authenticated users" ON customer_credit_extensions;

-- Now create organization-aware policies

-- Organizations table policies (only superadmins can manage organizations)
CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
        OR
        user_has_organization_access(id)
    );

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- User organizations table policies
CREATE POLICY "user_organizations_select_policy" ON user_organizations
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role IN ('superadmin', 'admin')
            AND uo.status = 'active'
            AND (uo.role = 'superadmin' OR uo.organization_id = user_organizations.organization_id)
        )
    );

CREATE POLICY "user_organizations_insert_policy" ON user_organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role IN ('superadmin', 'admin')
            AND uo.status = 'active'
            AND (uo.role = 'superadmin' OR uo.organization_id = organization_id)
        )
    );

CREATE POLICY "user_organizations_update_policy" ON user_organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role IN ('superadmin', 'admin')
            AND uo.status = 'active'
            AND (uo.role = 'superadmin' OR uo.organization_id = user_organizations.organization_id)
        )
    );

-- Products table policies (organization-scoped)
CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (
        organization_id IS NULL -- Allow access to global products
        OR user_has_organization_access(organization_id)
    );

CREATE POLICY "products_insert_policy" ON products
    FOR INSERT WITH CHECK (
        organization_id IS NULL -- Global products can be created by authenticated users
        OR user_has_organization_access(organization_id)
    );

CREATE POLICY "products_update_policy" ON products
    FOR UPDATE USING (
        organization_id IS NULL
        OR user_has_organization_access(organization_id)
    );

-- SKUs table policies (inherit from products)
CREATE POLICY "skus_select_policy" ON skus
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = skus.product_id
            AND (p.organization_id IS NULL OR user_has_organization_access(p.organization_id))
        )
    );

CREATE POLICY "skus_insert_policy" ON skus
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND (p.organization_id IS NULL OR user_has_organization_access(p.organization_id))
        )
    );

CREATE POLICY "skus_update_policy" ON skus
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = skus.product_id
            AND (p.organization_id IS NULL OR user_has_organization_access(p.organization_id))
        )
    );

-- Customers table policies
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Suppliers table policies
CREATE POLICY "suppliers_select_policy" ON suppliers
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "suppliers_insert_policy" ON suppliers
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "suppliers_update_policy" ON suppliers
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "suppliers_delete_policy" ON suppliers
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Sales orders table policies
CREATE POLICY "sales_orders_select_policy" ON sales_orders
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "sales_orders_insert_policy" ON sales_orders
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "sales_orders_update_policy" ON sales_orders
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "sales_orders_delete_policy" ON sales_orders
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Sales order items table policies (inherit from sales orders)
CREATE POLICY "sales_order_items_select_policy" ON sales_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_insert_policy" ON sales_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_update_policy" ON sales_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_delete_policy" ON sales_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

-- Purchase records table policies
CREATE POLICY "purchase_records_select_policy" ON purchase_records
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "purchase_records_insert_policy" ON purchase_records
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "purchase_records_update_policy" ON purchase_records
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "purchase_records_delete_policy" ON purchase_records
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Purchase record items table policies
CREATE POLICY "purchase_record_items_select_policy" ON purchase_record_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_insert_policy" ON purchase_record_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_update_policy" ON purchase_record_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_delete_policy" ON purchase_record_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

-- Purchase record costs table policies
CREATE POLICY "purchase_record_costs_select_policy" ON purchase_record_costs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_insert_policy" ON purchase_record_costs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_update_policy" ON purchase_record_costs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_delete_policy" ON purchase_record_costs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access(pr.organization_id)
        )
    );

-- Vehicle arrivals table policies
CREATE POLICY "vehicle_arrivals_select_policy" ON vehicle_arrivals
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "vehicle_arrivals_insert_policy" ON vehicle_arrivals
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "vehicle_arrivals_update_policy" ON vehicle_arrivals
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "vehicle_arrivals_delete_policy" ON vehicle_arrivals
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Vehicle arrival items table policies
CREATE POLICY "vehicle_arrival_items_select_policy" ON vehicle_arrival_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_insert_policy" ON vehicle_arrival_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_update_policy" ON vehicle_arrival_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_delete_policy" ON vehicle_arrival_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

-- Vehicle arrival attachments table policies
CREATE POLICY "vehicle_arrival_attachments_select_policy" ON vehicle_arrival_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_insert_policy" ON vehicle_arrival_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_update_policy" ON vehicle_arrival_attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_delete_policy" ON vehicle_arrival_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access(va.organization_id)
        )
    );

-- Current inventory table policies
CREATE POLICY "current_inventory_select_policy" ON current_inventory
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "current_inventory_insert_policy" ON current_inventory
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "current_inventory_update_policy" ON current_inventory
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "current_inventory_delete_policy" ON current_inventory
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Payments table policies
CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT USING (user_has_organization_access(organization_id));

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE USING (user_has_organization_access(organization_id));

CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE USING (user_has_organization_access(organization_id));

-- Sales order payments table policies
CREATE POLICY "sales_order_payments_select_policy" ON sales_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_insert_policy" ON sales_order_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_update_policy" ON sales_order_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_delete_policy" ON sales_order_payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access(so.organization_id)
        )
    );

-- Customer credit extensions table policies
CREATE POLICY "customer_credit_extensions_select_policy" ON customer_credit_extensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_insert_policy" ON customer_credit_extensions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id
            AND user_has_organization_access(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_update_policy" ON customer_credit_extensions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_delete_policy" ON customer_credit_extensions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access(c.organization_id)
        )
    );

-- Enable RLS on organizations and user_organizations tables if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id_status ON user_organizations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id_status ON user_organizations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role_status ON user_organizations(role, status);

-- Add comments for documentation
COMMENT ON FUNCTION get_current_user_organization_id() IS 'Returns the current user''s active organization ID from session or default organization';
COMMENT ON FUNCTION user_has_organization_access(UUID) IS 'Checks if the current user has access to the specified organization';
