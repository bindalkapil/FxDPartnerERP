const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCleanup() {
  console.log('🔍 Verifying database cleanup...\n');

  try {
    // Check if organization tables exist
    const { data: tables, error: tablesError } = await supabase.rpc('check_tables_exist', {
      table_names: ['organizations', 'user_organizations']
    });

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
    } else {
      console.log('📋 Organization tables check:');
      if (tables.length === 0) {
        console.log('✅ Organization tables successfully removed');
      } else {
        console.log('❌ Found remaining organization tables:', tables.map(t => t.table_name));
      }
    }

    // Check main tables structure
    const tablesToCheck = ['suppliers', 'customers', 'vehicle_arrivals', 'purchase_records', 'payments', 'sales_orders', 'current_inventory'];
    
    console.log('\n📊 Checking main tables structure:');
    for (const tableName of tablesToCheck) {
      try {
        const { data: columns, error: colError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .in('column_name', ['organization_id', 'user_id']);

        if (colError) {
          console.log(`❌ Error checking ${tableName}:`, colError.message);
        } else {
          const hasOrgId = columns.some(col => col.column_name === 'organization_id');
          const hasUserId = columns.some(col => col.column_name === 'user_id');
          
          console.log(`  ${tableName}:`);
          console.log(`    organization_id: ${hasOrgId ? '❌ Still exists' : '✅ Removed'}`);
          console.log(`    user_id: ${hasUserId ? '✅ Added' : '❌ Missing'}`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}:`, err.message);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      const orgPolicies = policies.filter(p => 
        p.policyname.includes('organization') || 
        p.policyname.includes('_policy')
      );
      
      if (orgPolicies.length === 0) {
        console.log('✅ All organization-related RLS policies removed');
      } else {
        console.log('❌ Found remaining organization policies:');
        orgPolicies.forEach(p => console.log(`  - ${p.tablename}.${p.policyname}`));
      }
    }

    // Check RLS status
    console.log('\n🛡️ Checking RLS status:');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relkind', 'r')
      .in('relname', tablesToCheck);

    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError.message);
    } else {
      rlsStatus.forEach(table => {
        console.log(`  ${table.relname}: ${table.relrowsecurity ? '❌ RLS enabled' : '✅ RLS disabled'}`);
      });
    }

    console.log('\n✨ Database cleanup verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyCleanup();
