import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsers() {
  try {
    console.log('Creating test users...')

    // Create admin user
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@fxdfruits.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    })

    if (adminError) {
      console.error('Error creating admin user:', adminError)
    } else {
      console.log('Admin user created:', adminUser.user.id)
      
      // Add admin user to public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: adminUser.user.id,
          email: 'admin@fxdfruits.com',
          full_name: 'Admin User',
          role_id: 'admin',
          status: 'active'
        })

      if (profileError) {
        console.error('Error creating admin profile:', profileError)
      } else {
        console.log('Admin profile created')
      }

      // Get default organization
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'default')
        .single()

      if (defaultOrg) {
        // Add admin to default organization
        const { error: orgError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: adminUser.user.id,
            organization_id: defaultOrg.id,
            role: 'admin',
            status: 'active'
          })

        if (orgError) {
          console.error('Error adding admin to organization:', orgError)
        } else {
          console.log('Admin added to default organization')
        }
      }
    }

    // Create staff user
    const { data: staffUser, error: staffError } = await supabase.auth.admin.createUser({
      email: 'staff@fxdfruits.com',
      password: 'staff123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Staff User'
      }
    })

    if (staffError) {
      console.error('Error creating staff user:', staffError)
    } else {
      console.log('Staff user created:', staffUser.user.id)
      
      // Add staff user to public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: staffUser.user.id,
          email: 'staff@fxdfruits.com',
          full_name: 'Staff User',
          role_id: 'staff',
          status: 'active'
        })

      if (profileError) {
        console.error('Error creating staff profile:', profileError)
      } else {
        console.log('Staff profile created')
      }

      // Get default organization
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'default')
        .single()

      if (defaultOrg) {
        // Add staff to default organization
        const { error: orgError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: staffUser.user.id,
            organization_id: defaultOrg.id,
            role: 'user',
            status: 'active'
          })

        if (orgError) {
          console.error('Error adding staff to organization:', orgError)
        } else {
          console.log('Staff added to default organization')
        }
      }
    }

    console.log('Test users creation completed!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUsers()
