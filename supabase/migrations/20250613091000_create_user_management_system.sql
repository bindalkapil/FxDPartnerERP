-- Create User Management System
-- This migration creates the necessary tables and policies for role-based access control

-- Create roles table first
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'viewer',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Insert default roles with their permissions
INSERT INTO public.roles (id, name, description, permissions) VALUES
('viewer', 'Viewer', 'Read-only access to dashboard and inventory', 
 '["dashboard:read", "inventory:read"]'::jsonb),
('staff', 'Staff', 'Basic operations including vehicle arrival, purchases, and sales', 
 '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write"]'::jsonb),
('manager', 'Manager', 'Department management including partners, dispatch, and payments', 
 '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write"]'::jsonb),
('admin', 'Admin', 'Full system access including user management and settings', 
 '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write", "settings:read", "settings:write", "users:read", "users:write"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Create function to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.id = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.id = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.id = 'admin'
        )
    );

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id); -- Users can update their own profile but role changes are handled separately

-- Create RLS policies for roles table
CREATE POLICY "All authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify roles" ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.id = 'admin'
        )
    );

-- Create view for user details with role information
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role_id,
    r.name as role_name,
    r.description as role_description,
    r.permissions,
    u.status,
    u.created_at,
    u.updated_at,
    u.last_login
FROM public.users u
JOIN public.roles r ON u.role_id = r.id;

-- Grant permissions
GRANT SELECT ON public.user_details TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT r.permissions INTO user_permissions
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN user_permissions ? permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;

-- Insert demo admin user if it doesn't exist
-- This will be handled by the application, but we can prepare the structure
