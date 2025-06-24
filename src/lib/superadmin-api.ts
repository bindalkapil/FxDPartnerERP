// SuperAdmin API functions - independent of organization context
import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

// SuperAdmin API functions that bypass organization filtering

// Organizations
export async function getAllOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createOrganization(organization: Tables['organizations']['Insert']) {
  const { data, error } = await supabase
    .from('organizations')
    .insert(organization)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateOrganization(id: string, organization: Tables['organizations']['Update']) {
  const { data, error } = await supabase
    .from('organizations')
    .update(organization)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteOrganization(id: string) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// User Organizations
export async function getAllUserOrganizations() {
  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      *,
      organization:organizations(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createUserOrganization(userOrg: Tables['user_organizations']['Insert']) {
  const { data, error } = await supabase
    .from('user_organizations')
    .insert(userOrg)
    .select(`
      *,
      organization:organizations(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserOrganization(id: string, userOrg: Tables['user_organizations']['Update']) {
  const { data, error } = await supabase
    .from('user_organizations')
    .update(userOrg)
    .eq('id', id)
    .select(`
      *,
      organization:organizations(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteUserOrganization(id: string) {
  const { error } = await supabase
    .from('user_organizations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// System Statistics
export async function getSystemStatistics() {
  try {
    const [orgsData, userOrgsData] = await Promise.all([
      getAllOrganizations(),
      getAllUserOrganizations()
    ]);

    return {
      totalOrganizations: orgsData.length,
      activeOrganizations: orgsData.filter(org => org.status === 'active').length,
      totalUsers: userOrgsData.length,
      activeUsers: userOrgsData.filter(user => user.status === 'active').length,
      organizations: orgsData,
      userOrganizations: userOrgsData
    };
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    throw error;
  }
}

// Get all data across organizations (for system overview)
export async function getAllSystemData() {
  try {
    // Get data from all organizations without filtering
    const [
      customers,
      suppliers,
      products,
      salesOrders,
      purchaseRecords,
      inventory
    ] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('suppliers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('sales_orders').select('*'),
      supabase.from('purchase_records').select('*'),
      supabase.from('current_inventory').select('*')
    ]);

    return {
      customers: customers.data || [],
      suppliers: suppliers.data || [],
      products: products.data || [],
      salesOrders: salesOrders.data || [],
      purchaseRecords: purchaseRecords.data || [],
      inventory: inventory.data || []
    };
  } catch (error) {
    console.error('Error fetching system data:', error);
    throw error;
  }
}

// Organization-specific data access
export async function getOrganizationData(organizationId: string) {
  try {
    const [
      customers,
      suppliers,
      products,
      salesOrders,
      purchaseRecords,
      inventory
    ] = await Promise.all([
      supabase.from('customers').select('*').eq('organization_id', organizationId),
      supabase.from('suppliers').select('*').eq('organization_id', organizationId),
      supabase.from('products').select('*').eq('organization_id', organizationId),
      supabase.from('sales_orders').select('*').eq('organization_id', organizationId),
      supabase.from('purchase_records').select('*').eq('organization_id', organizationId),
      supabase.from('current_inventory').select('*').eq('organization_id', organizationId)
    ]);

    return {
      customers: customers.data || [],
      suppliers: suppliers.data || [],
      products: products.data || [],
      salesOrders: salesOrders.data || [],
      purchaseRecords: purchaseRecords.data || [],
      inventory: inventory.data || []
    };
  } catch (error) {
    console.error('Error fetching organization data:', error);
    throw error;
  }
}

// System maintenance functions
export async function clearSystemCache() {
  // In a real implementation, this would clear Redis cache or similar
  console.log('System cache cleared');
  return { success: true, message: 'System cache cleared successfully' };
}

export async function exportSystemData() {
  try {
    const systemData = await getAllSystemData();
    const statistics = await getSystemStatistics();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      statistics,
      data: systemData
    };

    // In a real implementation, this would generate a downloadable file
    console.log('System data exported:', exportData);
    return { success: true, message: 'System data exported successfully', data: exportData };
  } catch (error) {
    console.error('Error exporting system data:', error);
    throw error;
  }
}

// User management functions
export async function getAllUsers() {
  const { data, error } = await supabase
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
  
  if (error) throw error;
  return data;
}

export async function getUserWithOrganizations(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      roles (
        id,
        name,
        description
      ),
      user_organizations (
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
      )
    `)
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllUsersWithOrganizations() {
  const { data, error } = await supabase
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
  
  if (error) throw error;
  
  // Fetch user organizations separately to avoid complex join issues
  const usersWithOrgs = await Promise.all(
    data.map(async (user) => {
      const { data: userOrgs, error: orgError } = await supabase
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
      
      if (orgError) {
        console.error('Error fetching user organizations:', orgError);
        return { ...user, user_organizations: [] };
      }
      
      return { ...user, user_organizations: userOrgs || [] };
    })
  );
  
  return usersWithOrgs;
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive') {
  const { data, error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, roleId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ role_id: roleId })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Audit log functions (placeholder for future implementation)
export async function getAuditLogs(limit: number = 100) {
  // In a real implementation, this would fetch from an audit_logs table
  return [];
}

export async function createAuditLog(action: string, details: any) {
  // In a real implementation, this would insert into an audit_logs table
  console.log('Audit log created:', { action, details, timestamp: new Date().toISOString() });
}
