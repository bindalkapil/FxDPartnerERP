-- Fix user_organizations table to accept text-based user identifiers instead of UUID
-- This allows super admins to grant access using email addresses or other identifiers

-- Drop the existing user_id column and recreate it as TEXT
ALTER TABLE user_organizations DROP COLUMN user_id;
ALTER TABLE user_organizations ADD COLUMN user_id TEXT NOT NULL;

-- Recreate the unique constraint
ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_user_id_organization_id_key;
ALTER TABLE user_organizations ADD CONSTRAINT user_organizations_user_id_organization_id_key UNIQUE(user_id, organization_id);

-- Recreate the index
DROP INDEX IF EXISTS user_organizations_user_id_idx;
CREATE INDEX user_organizations_user_id_idx ON user_organizations(user_id);

-- Add some sample user organization data for testing
DO $$
DECLARE
    default_org_id UUID;
    fxd_org_id UUID;
BEGIN
    -- Get organization IDs
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
    SELECT id INTO fxd_org_id FROM organizations WHERE slug = 'fxd-fruits';
    
    -- Add sample user access for default organization
    IF default_org_id IS NOT NULL THEN
        INSERT INTO user_organizations (user_id, organization_id, role, status) VALUES
        ('admin@default.com', default_org_id, 'admin', 'active'),
        ('manager@default.com', default_org_id, 'admin', 'active'),
        ('user@default.com', default_org_id, 'user', 'active')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
    
    -- Add sample user access for FxD organization
    IF fxd_org_id IS NOT NULL THEN
        INSERT INTO user_organizations (user_id, organization_id, role, status) VALUES
        ('admin@fxd.com', fxd_org_id, 'admin', 'active'),
        ('manager@fxd.com', fxd_org_id, 'admin', 'active'),
        ('user@fxd.com', fxd_org_id, 'user', 'active'),
        ('123@test.com', fxd_org_id, 'user', 'active')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
END $$;
