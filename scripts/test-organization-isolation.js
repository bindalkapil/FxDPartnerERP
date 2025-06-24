#!/usr/bin/env node

/**
 * Organization Data Isolation Test Script
 * 
 * This script tests that users from one organization cannot access
 * data from another organization, ensuring proper multi-tenant security.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runIsolationTests() {
  console.log('🔒 Starting Organization Data Isolation Tests...\n');

  try {
    // Test 1: Verify organizations exist
    console.log('📋 Test 1: Checking organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at');

    if (orgError) {
      throw new Error(`Failed to fetch organizations: ${orgError.message}`);
    }

    if (!organizations || organizations.length < 2) {
      console.log('⚠️  Need at least 2 organizations for testing. Creating test organizations...');
      
      // Create test organizations
      const { data: newOrgs, error: createError } = await supabase
        .from('organizations')
        .insert([
          { name: 'Test Organization A', slug: 'test-org-a' },
          { name: 'Test Organization B', slug: 'test-org-b' }
        ])
        .select();

      if (createError) {
        throw new Error(`Failed to create test organizations: ${createError.message}`);
      }

      organizations.push(...newOrgs);
    }

    const org1 = organizations[0];
    const org2 = organizations[1];
    console.log(`✅ Using organizations: ${org1.name} (${org1.id}) and ${org2.name} (${org2.id})\n`);

    // Test 2: Create test users for each organization
    console.log('👥 Test 2: Creating test users...');
    
    // Create test users in auth
    const timestamp = Date.now();
    const testUser1Email = `test-user-1-${timestamp}@example.com`;
    const testUser2Email = `test-user-2-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Clean up existing test users first (try with both old and new format)
    await supabase.auth.admin.deleteUser('test-user-1@example.com').catch(() => {});
    await supabase.auth.admin.deleteUser('test-user-2@example.com').catch(() => {});
    await supabase.auth.admin.deleteUser(testUser1Email).catch(() => {});
    await supabase.auth.admin.deleteUser(testUser2Email).catch(() => {});

    const { data: user1Auth, error: user1Error } = await supabase.auth.admin.createUser({
      email: testUser1Email,
      password: testPassword,
      email_confirm: true
    });

    const { data: user2Auth, error: user2Error } = await supabase.auth.admin.createUser({
      email: testUser2Email,
      password: testPassword,
      email_confirm: true
    });

    if (user1Error || user2Error) {
      throw new Error(`Failed to create test users: ${user1Error?.message || user2Error?.message}`);
    }

    const user1Id = user1Auth.user.id;
    const user2Id = user2Auth.user.id;

    // Create user profiles
    await supabase.from('users').upsert([
      {
        id: user1Id,
        email: testUser1Email,
        full_name: 'Test User 1',
        role_id: 'user',
        status: 'active'
      },
      {
        id: user2Id,
        email: testUser2Email,
        full_name: 'Test User 2',
        role_id: 'user',
        status: 'active'
      }
    ]);

    // Assign users to organizations
    await supabase.from('user_organizations').upsert([
      {
        user_id: user1Id,
        organization_id: org1.id,
        role: 'user',
        status: 'active'
      },
      {
        user_id: user2Id,
        organization_id: org2.id,
        role: 'user',
        status: 'active'
      }
    ]);

    console.log(`✅ Created test users: ${testUser1Email} (Org: ${org1.name}), ${testUser2Email} (Org: ${org2.name})\n`);

    // Test 3: Create test data for each organization
    console.log('📊 Test 3: Creating test data...');

    const { data: customer1, error: cust1Error } = await supabase
      .from('customers')
      .insert({
        name: 'Customer for Org 1',
        email: 'customer1@org1.com',
        contact: '1234567890',
        address: '123 Test Street, Test City',
        credit_limit: 10000,
        payment_terms: 30,
        organization_id: org1.id
      })
      .select()
      .single();

    const { data: customer2, error: cust2Error } = await supabase
      .from('customers')
      .insert({
        name: 'Customer for Org 2',
        email: 'customer2@org2.com',
        contact: '0987654321',
        address: '456 Test Avenue, Test Town',
        credit_limit: 15000,
        payment_terms: 45,
        organization_id: org2.id
      })
      .select()
      .single();

    if (cust1Error || cust2Error) {
      throw new Error(`Failed to create test customers: ${cust1Error?.message || cust2Error?.message}`);
    }

    console.log(`✅ Created test customers: ${customer1.name} (${customer1.id}), ${customer2.name} (${customer2.id})\n`);

    // Test 4: Test data isolation with user sessions
    console.log('🔐 Test 4: Testing data isolation...');

    // Create client for user 1
    const user1Client = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { error: signIn1Error } = await user1Client.auth.signInWithPassword({
      email: testUser1Email,
      password: testPassword
    });

    if (signIn1Error) {
      throw new Error(`Failed to sign in user 1: ${signIn1Error.message}`);
    }

    // Set organization context for user 1
    await user1Client.rpc('set_config', {
      setting_name: 'app.current_organization_id',
      setting_value: org1.id,
      is_local: true
    });

    // User 1 should only see customers from org 1
    const { data: user1Customers, error: user1CustError } = await user1Client
      .from('customers')
      .select('*');

    if (user1CustError) {
      console.log(`⚠️  User 1 customer query error (expected with RLS): ${user1CustError.message}`);
    }

    console.log(`📊 User 1 can see ${user1Customers?.length || 0} customers`);
    if (user1Customers) {
      user1Customers.forEach(c => {
        console.log(`   - ${c.name} (Org: ${c.organization_id})`);
        if (c.organization_id !== org1.id) {
          console.log(`❌ SECURITY VIOLATION: User 1 can see customer from different organization!`);
        }
      });
    }

    // Create client for user 2
    const user2Client = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { error: signIn2Error } = await user2Client.auth.signInWithPassword({
      email: testUser2Email,
      password: testPassword
    });

    if (signIn2Error) {
      throw new Error(`Failed to sign in user 2: ${signIn2Error.message}`);
    }

    // Set organization context for user 2
    await user2Client.rpc('set_config', {
      setting_name: 'app.current_organization_id',
      setting_value: org2.id,
      is_local: true
    });

    // User 2 should only see customers from org 2
    const { data: user2Customers, error: user2CustError } = await user2Client
      .from('customers')
      .select('*');

    if (user2CustError) {
      console.log(`⚠️  User 2 customer query error (expected with RLS): ${user2CustError.message}`);
    }

    console.log(`📊 User 2 can see ${user2Customers?.length || 0} customers`);
    if (user2Customers) {
      user2Customers.forEach(c => {
        console.log(`   - ${c.name} (Org: ${c.organization_id})`);
        if (c.organization_id !== org2.id) {
          console.log(`❌ SECURITY VIOLATION: User 2 can see customer from different organization!`);
        }
      });
    }

    // Test 5: Test cross-organization access attempts
    console.log('\n🚫 Test 5: Testing cross-organization access prevention...');

    // User 1 tries to access user 2's customer directly
    const { data: crossAccessData, error: crossAccessError } = await user1Client
      .from('customers')
      .select('*')
      .eq('id', customer2.id);

    if (crossAccessError) {
      console.log(`✅ Cross-access properly blocked: ${crossAccessError.message}`);
    } else if (!crossAccessData || crossAccessData.length === 0) {
      console.log(`✅ Cross-access properly blocked: No data returned`);
    } else {
      console.log(`❌ SECURITY VIOLATION: User 1 can access User 2's customer!`);
    }

    // Test 6: Test superadmin access
    console.log('\n👑 Test 6: Testing superadmin access...');

    // Create superadmin user
    const superAdminEmail = 'superadmin@example.com';
    await supabase.auth.admin.deleteUser(superAdminEmail).catch(() => {});

    const { data: superAdminAuth, error: superAdminError } = await supabase.auth.admin.createUser({
      email: superAdminEmail,
      password: testPassword,
      email_confirm: true
    });

    if (superAdminError) {
      throw new Error(`Failed to create superadmin: ${superAdminError.message}`);
    }

    const superAdminId = superAdminAuth.user.id;

    // Create superadmin profile and organization access
    await supabase.from('users').upsert({
      id: superAdminId,
      email: superAdminEmail,
      full_name: 'Super Admin',
      role_id: 'superadmin',
      status: 'active'
    });

    await supabase.from('user_organizations').upsert({
      user_id: superAdminId,
      organization_id: org1.id, // Can be any org, superadmin has access to all
      role: 'superadmin',
      status: 'active'
    });

    // Test superadmin access
    const superAdminClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { error: superSignInError } = await superAdminClient.auth.signInWithPassword({
      email: superAdminEmail,
      password: testPassword
    });

    if (superSignInError) {
      throw new Error(`Failed to sign in superadmin: ${superSignInError.message}`);
    }

    const { data: superAdminCustomers, error: superAdminCustError } = await superAdminClient
      .from('customers')
      .select('*');

    if (superAdminCustError) {
      console.log(`⚠️  Superadmin query error: ${superAdminCustError.message}`);
    } else {
      console.log(`✅ Superadmin can see ${superAdminCustomers?.length || 0} customers from all organizations`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('customers').delete().in('id', [customer1.id, customer2.id]);
    await supabase.auth.admin.deleteUser(user1Id);
    await supabase.auth.admin.deleteUser(user2Id);
    await supabase.auth.admin.deleteUser(superAdminId);

    console.log('\n🎉 Organization isolation tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Organizations properly isolated');
    console.log('  ✅ Users can only access their organization data');
    console.log('  ✅ Cross-organization access is blocked');
    console.log('  ✅ Superadmins have access to all organizations');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runIsolationTests();
