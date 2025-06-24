#!/usr/bin/env node

// Test script to verify organization context fix resolves 406/409 errors
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user credentials (should exist from previous migrations)
const TEST_USER_EMAIL = 'admin@fxdfruits.com';
const TEST_USER_PASSWORD = 'admin123';

async function testOrganizationContextFix() {
  console.log('🧪 Testing Organization Context Fix for 406/409 Errors');
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate user
    console.log('1️⃣ Authenticating test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ User authenticated successfully');
    console.log(`   User ID: ${authData.user.id}`);

    // Step 2: Get user's organizations
    console.log('\n2️⃣ Fetching user organizations...');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', authData.user.id)
      .eq('status', 'active');

    if (userOrgsError) {
      console.error('❌ Failed to fetch user organizations:', userOrgsError.message);
      return;
    }

    if (!userOrgs || userOrgs.length === 0) {
      console.error('❌ No organizations found for user');
      return;
    }

    console.log('✅ User organizations found:');
    userOrgs.forEach((userOrg, index) => {
      console.log(`   ${index + 1}. ${userOrg.organization.name} (${userOrg.organization.id})`);
    });

    // Step 3: Test setting organization context
    const testOrg = userOrgs[0];
    console.log(`\n3️⃣ Testing organization context setting for: ${testOrg.organization.name}`);
    
    try {
      const { error: contextError } = await supabase.rpc('set_session_organization', {
        org_id: testOrg.organization_id
      });

      if (contextError) {
        console.error('❌ Failed to set organization context:', contextError.message);
        return;
      }

      console.log('✅ Organization context set successfully');
    } catch (rpcError) {
      console.error('❌ RPC call failed:', rpcError.message);
      return;
    }

    // Step 4: Test products API (previously causing 406 errors)
    console.log('\n4️⃣ Testing products API (previously causing 406 errors)...');
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          skus(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (productsError) {
        console.error('❌ Products API failed:', productsError.message);
        console.error('   Code:', productsError.code);
        console.error('   Details:', productsError.details);
      } else {
        console.log('✅ Products API successful');
        console.log(`   Retrieved ${products.length} products`);
      }
    } catch (error) {
      console.error('❌ Products API exception:', error.message);
    }

    // Step 5: Test creating a product (previously causing 409 errors)
    console.log('\n5️⃣ Testing product creation (previously causing 409 errors)...');
    const testProductName = `Test Product ${Date.now()}`;
    
    try {
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          name: testProductName,
          category: 'test',
          organization_id: testOrg.organization_id
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Product creation failed:', createError.message);
        console.error('   Code:', createError.code);
        console.error('   Details:', createError.details);
      } else {
        console.log('✅ Product creation successful');
        console.log(`   Created product: ${newProduct.name} (${newProduct.id})`);
        
        // Clean up: delete the test product
        await supabase.from('products').delete().eq('id', newProduct.id);
        console.log('   Test product cleaned up');
      }
    } catch (error) {
      console.error('❌ Product creation exception:', error.message);
    }

    // Step 6: Test customers API
    console.log('\n6️⃣ Testing customers API...');
    try {
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (customersError) {
        console.error('❌ Customers API failed:', customersError.message);
        console.error('   Code:', customersError.code);
      } else {
        console.log('✅ Customers API successful');
        console.log(`   Retrieved ${customers.length} customers`);
      }
    } catch (error) {
      console.error('❌ Customers API exception:', error.message);
    }

    // Step 7: Test suppliers API
    console.log('\n7️⃣ Testing suppliers API...');
    try {
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (suppliersError) {
        console.error('❌ Suppliers API failed:', suppliersError.message);
        console.error('   Code:', suppliersError.code);
      } else {
        console.log('✅ Suppliers API successful');
        console.log(`   Retrieved ${suppliers.length} suppliers`);
      }
    } catch (error) {
      console.error('❌ Suppliers API exception:', error.message);
    }

    // Step 8: Test current inventory API
    console.log('\n8️⃣ Testing current inventory API...');
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('current_inventory')
        .select('*')
        .order('product_name')
        .limit(5);

      if (inventoryError) {
        console.error('❌ Inventory API failed:', inventoryError.message);
        console.error('   Code:', inventoryError.code);
      } else {
        console.log('✅ Inventory API successful');
        console.log(`   Retrieved ${inventory.length} inventory items`);
      }
    } catch (error) {
      console.error('❌ Inventory API exception:', error.message);
    }

    // Step 9: Test organization context validation
    console.log('\n9️⃣ Testing organization context validation...');
    try {
      const { data: contextCheck, error: contextCheckError } = await supabase.rpc('get_current_user_organization_id');
      
      if (contextCheckError) {
        console.error('❌ Context validation failed:', contextCheckError.message);
      } else {
        console.log('✅ Organization context validation successful');
        console.log(`   Current organization ID: ${contextCheck}`);
        
        if (contextCheck === testOrg.organization_id) {
          console.log('✅ Context matches expected organization');
        } else {
          console.warn('⚠️ Context does not match expected organization');
        }
      }
    } catch (error) {
      console.error('❌ Context validation exception:', error.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Organization Context Fix Test Completed!');
    console.log('');
    console.log('Summary:');
    console.log('- If all tests show ✅, the 406/409 errors should be resolved');
    console.log('- If any tests show ❌, there may still be issues to address');
    console.log('- The organization context is now properly set in the database session');
    console.log('- RLS policies should now work correctly with the session context');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n🔐 User signed out');
  }
}

// Run the test
testOrganizationContextFix().catch(console.error);
