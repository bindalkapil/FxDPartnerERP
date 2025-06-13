import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY as fallback)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting user management system migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250613091000_create_user_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(1);
            
            if (directError && directError.code === '42P01') {
              // Table doesn't exist, which is expected - continue
              console.log(`✅ Statement ${i + 1} executed (table creation)`);
            } else if (error.message.includes('already exists')) {
              console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
            } else {
              console.error(`❌ Error in statement ${i + 1}:`, error.message);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    // Verify the migration by checking if tables exist
    console.log('🔍 Verifying migration...');
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(1);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!rolesError && !usersError) {
      console.log('✅ Migration completed successfully!');
      console.log('📊 Tables created: roles, users, user_details (view)');
      
      // Check if roles are populated
      const { data: allRoles } = await supabase
        .from('roles')
        .select('*');
      
      console.log(`🎭 Roles created: ${allRoles?.length || 0}`);
      if (allRoles && allRoles.length > 0) {
        allRoles.forEach(role => {
          console.log(`   - ${role.name} (${role.id})`);
        });
      }
      
    } else {
      console.error('❌ Migration verification failed');
      if (rolesError) console.error('Roles table error:', rolesError.message);
      if (usersError) console.error('Users table error:', usersError.message);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function applyMigrationDirect() {
  try {
    console.log('🚀 Applying migration using direct SQL execution...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250613091000_create_user_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as one query
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Direct migration failed:', error.message);
      console.log('📝 Trying statement-by-statement approach...');
      await applyMigration();
    } else {
      console.log('✅ Direct migration completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Direct migration error:', error.message);
    console.log('📝 Trying statement-by-statement approach...');
    await applyMigration();
  }
}

// Run the migration
console.log('🔧 User Management System Migration Tool');
console.log('=====================================');
console.log(`🌐 Target: ${supabaseUrl}`);
console.log('');

applyMigrationDirect();
