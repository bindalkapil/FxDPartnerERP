-- Fix Circular Dependency in RLS Policies
-- This migration resolves the infinite recursion by creating non-recursive helper functions

-- First, drop all policies that depend on the problematic functions
-- Organizations policies
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;

-- Products policies
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;

-- SKUs policies
DROP POLICY IF EXISTS "skus_select_policy" ON skus;
DROP POLICY IF EXISTS "skus_insert_policy" ON skus;
DROP POLICY IF EXISTS "skus_update_policy" ON skus;

-- Customers policies
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Suppliers policies
DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

-- Sales orders policies
DROP POLICY IF EXISTS "sales_orders_select_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_insert_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_update_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_delete_policy" ON sales_orders;

-- Sales order items policies
DROP POLICY IF EXISTS "sales_order_items_select_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_insert_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_update_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_delete_policy" ON sales_order_items;

-- Purchase records policies
DROP POLICY IF EXISTS "purchase_records_select_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_insert_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_update_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_delete_policy" ON purchase_records;

-- Purchase record items policies
DROP POLICY IF EXISTS "purchase_record_items_select_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_insert_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_update_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_delete_policy" ON purchase_record_items;

-- Purchase record costs policies
DROP POLICY IF EXISTS "purchase_record_costs_select_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_insert_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_update_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_delete_policy" ON purchase_record_costs;

-- Vehicle arrivals policies
DROP POLICY IF EXISTS "vehicle_arrivals_select_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_insert_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_update_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_delete_policy" ON vehicle_arrivals;

-- Vehicle arrival items policies
DROP POLICY IF EXISTS "vehicle_arrival_items_select_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_insert_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_update_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_delete_policy" ON vehicle_arrival_items;

-- Vehicle arrival attachments policies
DROP POLICY IF EXISTS "vehicle_arrival_attachments_select_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_insert_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_update_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_delete_policy" ON vehicle_arrival_attachments;

-- Current inventory policies
DROP POLICY IF EXISTS "current_inventory_select_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_insert_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_update_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_delete_policy" ON current_inventory;

-- Payments policies
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

-- Sales order payments policies
DROP POLICY IF EXISTS "sales_order_payments_select_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_insert_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_update_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_delete_policy" ON sales_order_payments;

-- Customer credit extensions policies
DROP POLICY IF EXISTS "customer_credit_extensions_select_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_insert_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_update_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_delete_policy" ON customer_credit_extensions;

-- Users table policies (these also depend on is_super_admin function)
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;
DROP POLICY IF EXISTS "Super admins can delete users" ON users;
DROP POLICY IF EXISTS "Organization admins can view org users" ON users;

-- User organizations policies (these also depend on is_super_admin function)
DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update_policy" ON user_organizations;

-- Now drop the problematic functions that cause circular dependencies
DROP FUNCTION IF EXISTS user_has_organization_access(UUID);
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_org_admin_for(UUID);

-- Create a security definer function that bypasses RLS to check superadmin status
CREATE OR REPLACE FUNCTION is_super_admin_direct()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- This function bypasses RLS by using a direct query
  SELECT EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = auth.uid()::text 
    AND role = 'superadmin' 
    AND status = 'active'
  );
$$;

-- Create a function to check organization access without recursion
CREATE OR REPLACE FUNCTION user_has_organization_access_direct(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Check if user is superadmin (has access to all orgs)
  SELECT EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid()::text 
    AND role = 'superadmin' 
    AND status = 'active'
  )
  OR
  -- Check if user has access to specific organization
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid()::text 
    AND organization_id = org_id 
    AND status = 'active'
  );
$$;

-- Drop and recreate the user_organizations policies with non-recursive logic
DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update_policy" ON user_organizations;

-- Simple policies for user_organizations that don't cause recursion
CREATE POLICY "user_organizations_select_policy" ON user_organizations
    FOR SELECT USING (
        -- Users can see their own relationships
        user_id = auth.uid()::text
        OR
        -- Allow if current user is superadmin (direct check without RLS)
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
        OR
        -- Allow if current user is admin of the same organization
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = user_organizations.organization_id
            AND uo.role = 'admin'
            AND uo.status = 'active'
        )
    );

CREATE POLICY "user_organizations_insert_policy" ON user_organizations
    FOR INSERT WITH CHECK (
        -- Only superadmins can create user-organization relationships
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
        OR
        -- Organization admins can add users to their organization
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = organization_id
            AND uo.role = 'admin'
            AND uo.status = 'active'
        )
    );

CREATE POLICY "user_organizations_update_policy" ON user_organizations
    FOR UPDATE USING (
        -- Only superadmins can update user-organization relationships
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
        OR
        -- Organization admins can update relationships in their organization
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = user_organizations.organization_id
            AND uo.role = 'admin'
            AND uo.status = 'active'
        )
    );

-- Update organizations policies to use the new non-recursive function
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;

CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (
        is_super_admin_direct()
        OR
        user_has_organization_access_direct(id)
    );

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (is_super_admin_direct());

CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (is_super_admin_direct());

-- Update all other table policies to use the new non-recursive function
-- Products table
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;

CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (
        organization_id IS NULL -- Allow access to global products
        OR user_has_organization_access_direct(organization_id)
    );

CREATE POLICY "products_insert_policy" ON products
    FOR INSERT WITH CHECK (
        organization_id IS NULL -- Global products can be created by authenticated users
        OR user_has_organization_access_direct(organization_id)
    );

CREATE POLICY "products_update_policy" ON products
    FOR UPDATE USING (
        organization_id IS NULL
        OR user_has_organization_access_direct(organization_id)
    );

-- Update customers policies
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update suppliers policies
DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

CREATE POLICY "suppliers_select_policy" ON suppliers
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "suppliers_insert_policy" ON suppliers
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "suppliers_update_policy" ON suppliers
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "suppliers_delete_policy" ON suppliers
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update sales orders policies
DROP POLICY IF EXISTS "sales_orders_select_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_insert_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_update_policy" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_delete_policy" ON sales_orders;

CREATE POLICY "sales_orders_select_policy" ON sales_orders
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "sales_orders_insert_policy" ON sales_orders
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "sales_orders_update_policy" ON sales_orders
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "sales_orders_delete_policy" ON sales_orders
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update purchase records policies
DROP POLICY IF EXISTS "purchase_records_select_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_insert_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_update_policy" ON purchase_records;
DROP POLICY IF EXISTS "purchase_records_delete_policy" ON purchase_records;

CREATE POLICY "purchase_records_select_policy" ON purchase_records
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "purchase_records_insert_policy" ON purchase_records
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "purchase_records_update_policy" ON purchase_records
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "purchase_records_delete_policy" ON purchase_records
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update vehicle arrivals policies
DROP POLICY IF EXISTS "vehicle_arrivals_select_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_insert_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_update_policy" ON vehicle_arrivals;
DROP POLICY IF EXISTS "vehicle_arrivals_delete_policy" ON vehicle_arrivals;

CREATE POLICY "vehicle_arrivals_select_policy" ON vehicle_arrivals
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "vehicle_arrivals_insert_policy" ON vehicle_arrivals
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "vehicle_arrivals_update_policy" ON vehicle_arrivals
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "vehicle_arrivals_delete_policy" ON vehicle_arrivals
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update current inventory policies
DROP POLICY IF EXISTS "current_inventory_select_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_insert_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_update_policy" ON current_inventory;
DROP POLICY IF EXISTS "current_inventory_delete_policy" ON current_inventory;

CREATE POLICY "current_inventory_select_policy" ON current_inventory
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "current_inventory_insert_policy" ON current_inventory
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "current_inventory_update_policy" ON current_inventory
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "current_inventory_delete_policy" ON current_inventory
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update payments policies
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT WITH CHECK (user_has_organization_access_direct(organization_id));

CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE USING (user_has_organization_access_direct(organization_id));

CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE USING (user_has_organization_access_direct(organization_id));

-- Update sales order items policies (inherit from sales orders)
DROP POLICY IF EXISTS "sales_order_items_select_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_insert_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_update_policy" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_delete_policy" ON sales_order_items;

CREATE POLICY "sales_order_items_select_policy" ON sales_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_insert_policy" ON sales_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_update_policy" ON sales_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_items_delete_policy" ON sales_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_items.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

-- Update purchase record items policies
DROP POLICY IF EXISTS "purchase_record_items_select_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_insert_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_update_policy" ON purchase_record_items;
DROP POLICY IF EXISTS "purchase_record_items_delete_policy" ON purchase_record_items;

CREATE POLICY "purchase_record_items_select_policy" ON purchase_record_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_insert_policy" ON purchase_record_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_update_policy" ON purchase_record_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_items_delete_policy" ON purchase_record_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_items.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

-- Update purchase record costs policies
DROP POLICY IF EXISTS "purchase_record_costs_select_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_insert_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_update_policy" ON purchase_record_costs;
DROP POLICY IF EXISTS "purchase_record_costs_delete_policy" ON purchase_record_costs;

CREATE POLICY "purchase_record_costs_select_policy" ON purchase_record_costs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_insert_policy" ON purchase_record_costs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_update_policy" ON purchase_record_costs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

CREATE POLICY "purchase_record_costs_delete_policy" ON purchase_record_costs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchase_records pr
            WHERE pr.id = purchase_record_costs.purchase_record_id
            AND user_has_organization_access_direct(pr.organization_id)
        )
    );

-- Update vehicle arrival items policies
DROP POLICY IF EXISTS "vehicle_arrival_items_select_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_insert_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_update_policy" ON vehicle_arrival_items;
DROP POLICY IF EXISTS "vehicle_arrival_items_delete_policy" ON vehicle_arrival_items;

CREATE POLICY "vehicle_arrival_items_select_policy" ON vehicle_arrival_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_insert_policy" ON vehicle_arrival_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_update_policy" ON vehicle_arrival_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_items_delete_policy" ON vehicle_arrival_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_items.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

-- Update vehicle arrival attachments policies
DROP POLICY IF EXISTS "vehicle_arrival_attachments_select_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_insert_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_update_policy" ON vehicle_arrival_attachments;
DROP POLICY IF EXISTS "vehicle_arrival_attachments_delete_policy" ON vehicle_arrival_attachments;

CREATE POLICY "vehicle_arrival_attachments_select_policy" ON vehicle_arrival_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_insert_policy" ON vehicle_arrival_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_update_policy" ON vehicle_arrival_attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

CREATE POLICY "vehicle_arrival_attachments_delete_policy" ON vehicle_arrival_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vehicle_arrivals va
            WHERE va.id = vehicle_arrival_attachments.vehicle_arrival_id
            AND user_has_organization_access_direct(va.organization_id)
        )
    );

-- Update sales order payments policies
DROP POLICY IF EXISTS "sales_order_payments_select_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_insert_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_update_policy" ON sales_order_payments;
DROP POLICY IF EXISTS "sales_order_payments_delete_policy" ON sales_order_payments;

CREATE POLICY "sales_order_payments_select_policy" ON sales_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_insert_policy" ON sales_order_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_update_policy" ON sales_order_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

CREATE POLICY "sales_order_payments_delete_policy" ON sales_order_payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sales_orders so
            WHERE so.id = sales_order_payments.sales_order_id
            AND user_has_organization_access_direct(so.organization_id)
        )
    );

-- Update customer credit extensions policies
DROP POLICY IF EXISTS "customer_credit_extensions_select_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_insert_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_update_policy" ON customer_credit_extensions;
DROP POLICY IF EXISTS "customer_credit_extensions_delete_policy" ON customer_credit_extensions;

CREATE POLICY "customer_credit_extensions_select_policy" ON customer_credit_extensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access_direct(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_insert_policy" ON customer_credit_extensions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id
            AND user_has_organization_access_direct(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_update_policy" ON customer_credit_extensions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access_direct(c.organization_id)
        )
    );

CREATE POLICY "customer_credit_extensions_delete_policy" ON customer_credit_extensions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_credit_extensions.customer_id
            AND user_has_organization_access_direct(c.organization_id)
        )
    );

-- Update SKUs policies (inherit from products)
DROP POLICY IF EXISTS "skus_select_policy" ON skus;
DROP POLICY IF EXISTS "skus_insert_policy" ON skus;
DROP POLICY IF EXISTS "skus_update_policy" ON skus;

CREATE POLICY "skus_select_policy" ON skus
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = skus.product_id
            AND (p.organization_id IS NULL OR user_has_organization_access_direct(p.organization_id))
        )
    );

CREATE POLICY "skus_insert_policy" ON skus
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
            AND (p.organization_id IS NULL OR user_has_organization_access_direct(p.organization_id))
        )
    );

CREATE POLICY "skus_update_policy" ON skus
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = skus.product_id
            AND (p.organization_id IS NULL OR user_has_organization_access_direct(p.organization_id))
        )
    );

-- Recreate users table policies using the new non-recursive functions
CREATE POLICY "Super admins can view all users" ON users
    FOR SELECT USING (is_super_admin_direct());

CREATE POLICY "Super admins can insert users" ON users
    FOR INSERT WITH CHECK (is_super_admin_direct());

CREATE POLICY "Super admins can update users" ON users
    FOR UPDATE USING (is_super_admin_direct());

CREATE POLICY "Super admins can delete users" ON users
    FOR DELETE USING (is_super_admin_direct());

-- Organization admins can view users who belong to their organizations
CREATE POLICY "Organization admins can view org users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo1
            WHERE uo1.user_id = auth.uid()::text
            AND uo1.role = 'admin'
            AND uo1.status = 'active'
            AND EXISTS (
                SELECT 1 FROM user_organizations uo2
                WHERE uo2.user_id = users.id::text
                AND uo2.organization_id = uo1.organization_id
                AND uo2.status = 'active'
            )
        )
    );

-- Grant execute permissions on the new helper functions
GRANT EXECUTE ON FUNCTION is_super_admin_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_organization_access_direct(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION is_super_admin_direct() IS 'Returns true if the current user has superadmin role - bypasses RLS to prevent recursion';
COMMENT ON FUNCTION user_has_organization_access_direct(UUID) IS 'Checks if the current user has access to the specified organization - bypasses RLS to prevent recursion';

-- Create optimized indexes for the direct access functions
CREATE INDEX IF NOT EXISTS idx_user_organizations_superadmin_check 
ON user_organizations(user_id, role, status) 
WHERE role = 'superadmin' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_organizations_org_access_check 
ON user_organizations(user_id, organization_id, status) 
WHERE status = 'active';
