-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations junction table for access control
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Add organization_id to existing tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE purchase_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE vehicle_arrivals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE current_inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_status_idx ON organizations(status);
CREATE INDEX IF NOT EXISTS user_organizations_user_id_idx ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS user_organizations_organization_id_idx ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS user_organizations_status_idx ON user_organizations(status);

-- Add organization_id indexes to business tables
CREATE INDEX IF NOT EXISTS customers_organization_id_idx ON customers(organization_id);
CREATE INDEX IF NOT EXISTS suppliers_organization_id_idx ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS products_organization_id_idx ON products(organization_id);
CREATE INDEX IF NOT EXISTS purchase_records_organization_id_idx ON purchase_records(organization_id);
CREATE INDEX IF NOT EXISTS sales_orders_organization_id_idx ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS vehicle_arrivals_organization_id_idx ON vehicle_arrivals(organization_id);
CREATE INDEX IF NOT EXISTS payments_organization_id_idx ON payments(organization_id);
CREATE INDEX IF NOT EXISTS current_inventory_organization_id_idx ON current_inventory(organization_id);

-- Create a default organization for existing data
INSERT INTO organizations (name, slug, status) 
VALUES ('Default Organization', 'default', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Update existing data to belong to the default organization
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
    
    IF default_org_id IS NOT NULL THEN
        UPDATE customers SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE suppliers SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE products SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE purchase_records SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE sales_orders SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE vehicle_arrivals SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE payments SET organization_id = default_org_id WHERE organization_id IS NULL;
        UPDATE current_inventory SET organization_id = default_org_id WHERE organization_id IS NULL;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON user_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
