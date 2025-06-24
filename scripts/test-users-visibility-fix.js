// Test script to verify that users are now visible in super admin
// This script simulates the API calls made by the UserAccess component

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsersVisibility() {
  console.log('🧪 Testing Users Visibility Fix...\n');

  try {
    // Test 1: Check if we can fetch all users (this should work for super admins)
    console.log('📋 Test 1: Fetching all users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('⚠️  Users query returned error (expected if not authenticated as super admin):');
      console.log('   Error:', usersError.message);
    } else {
      console.log(`✅ Successfully fetched ${users.length} users`);
      if (users.length > 0) {
        console.log('   Sample user:', {
          id: users[0].id.slice(0, 8) + '...',
          email: users[0].email,
          full_name: users[0].full_name,
          role: users[0].roles?.name || 'No role'
        });
      }
    }

    // Test 2: Check user organizations
    console.log('\n📋 Test 2: Fetching user organizations...');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organizations (
          id,
          name,
          slug,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (userOrgsError) {
      console.log('❌ User organizations query failed:', userOrgsError.message);
    } else {
      console.log(`✅ Successfully fetched ${userOrgs.length} user organization relationships`);
      
      // Count super admins
      const superAdmins = userOrgs.filter(uo => uo.role === 'superadmin' && uo.status === 'active');
      console.log(`   Super admins found: ${superAdmins.length}`);
      
      if (superAdmins.length > 0) {
        console.log('   Super admin users:');
        superAdmins.forEach(sa => {
          console.log(`     - User ID: ${sa.user_id.slice(0, 8)}... in org: ${sa.organizations.name}`);
        });
      }
    }

    // Test 3: Check organizations
    console.log('\n📋 Test 3: Fetching organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (orgsError) {
      console.log('❌ Organizations query failed:', orgsError.message);
    } else {
      console.log(`✅ Successfully fetched ${orgs.length} organizations`);
      orgs.forEach(org => {
        console.log(`   - ${org.name} (${org.status})`);
      });
    }

    // Test 4: Simulate the getAllUsersWithOrganizations function
    console.log('\n📋 Test 4: Simulating getAllUsersWithOrganizations API call...');
    
    // First get all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (allUsersError) {
      console.log('❌ Failed to fetch users for API simulation:', allUsersError.message);
    } else {
      console.log(`✅ API simulation: Fetched ${allUsers.length} users`);
      
      // Try to fetch user organizations for each user
      let successCount = 0;
      for (const user of allUsers.slice(0, 3)) { // Test first 3 users only
        const { data: userOrgData, error: userOrgError } = await supabase
          .from('user_organizations')
          .select(`
            id,
            role,
            status,
            created_at,
            organizations (
              id,
              name,
              slug,
              status
            )
          `)
          .eq('user_id', user.id);

        if (!userOrgError) {
          successCount++;
          console.log(`   ✅ User ${user.email}: ${userOrgData.length} organization(s)`);
        } else {
          console.log(`   ❌ User ${user.email}: Error fetching orgs - ${userOrgError.message}`);
        }
      }
      
      console.log(`   API simulation result: ${successCount}/${Math.min(3, allUsers.length)} users processed successfully`);
    }

    console.log('\n🎯 Summary:');
    console.log('The RLS policies have been updated. To fully test the fix:');
    console.log('1. Login to the application as a super admin user');
    console.log('2. Navigate to Super Admin > User Management');
    console.log('3. Verify that all users are now visible in the table');
    console.log('4. The user count should match the total number of registered users');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testUsersVisibility().then(() => {
  console.log('\n✨ Test completed!');
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
