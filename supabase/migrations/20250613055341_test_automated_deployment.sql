-- Test migration for automated deployment
-- This migration tests the GitHub Actions workflow for Supabase deployments

CREATE TABLE IF NOT EXISTS test_deployment (
    id SERIAL PRIMARY KEY,
    message TEXT DEFAULT 'Automated deployment working!',
    test_type VARCHAR(50) DEFAULT 'github_actions',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert a test record to verify the migration worked
INSERT INTO test_deployment (message, test_type) 
VALUES ('GitHub Actions deployment test successful', 'automation_test');

-- Add a comment for verification
COMMENT ON TABLE test_deployment IS 'Test table created by automated GitHub Actions deployment';
