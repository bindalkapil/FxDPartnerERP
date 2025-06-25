import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, Building2, Shield, UserCheck, UserX, Database, Settings, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  getAllOrganizations, 
  createOrganization, 
  updateOrganization,
  getAllUserOrganizations,
  createUserOrganization,
  updateUserOrganization,
  deleteUserOrganization
} from '../../lib/superadmin-api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  organization: Organization;
}

interface SystemStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
}

const SuperAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'organizations' | 'users' | 'system'>('dashboard');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingUserOrg, setEditingUserOrg] = useState<UserOrganization | null>(null);

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    status: 'active' as 'active' | 'inactive'
  });

  // User organization form state
  const [userOrgForm, setUserOrgForm] = useState({
    user_id: '',
    organization_id: '',
    role: 'user' as 'superadmin' | 'admin' | 'user',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgsData, userOrgsData] = await Promise.all([
        getAllOrganizations(),
        getAllUserOrganizations()
      ]);
      setOrganizations(orgsData);
      setUserOrganizations(userOrgsData);
      
      // Calculate system stats - get unique users count
      const uniqueUserIds = new Set(userOrgsData.map(userOrg => userOrg.user_id));
      const activeUserOrgs = userOrgsData.filter(user => user.status === 'active');
      const activeUniqueUserIds = new Set(activeUserOrgs.map(userOrg => userOrg.user_id));
      
      const stats: SystemStats = {
        totalOrganizations: orgsData.length,
        activeOrganizations: orgsData.filter(org => org.status === 'active').length,
        totalUsers: uniqueUserIds.size,
        activeUsers: activeUniqueUserIds.size
      };
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, orgForm);
        toast.success('Organization updated successfully');
      } else {
        await createOrganization(orgForm);
        toast.success('Organization created successfully');
      }
      setShowOrgModal(false);
      setEditingOrg(null);
      setOrgForm({ name: '', slug: '', status: 'active' });
      loadData();
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization');
    }
  };

  const handleCreateUserOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserOrg) {
        await updateUserOrganization(editingUserOrg.id, userOrgForm);
        toast.success('User access updated successfully');
      } else {
        await createUserOrganization(userOrgForm);
        toast.success('User access granted successfully');
      }
      setShowUserModal(false);
      setEditingUserOrg(null);
      setUserOrgForm({ user_id: '', organization_id: '', role: 'user', status: 'active' });
      loadData();
    } catch (error) {
      console.error('Error saving user organization:', error);
      toast.error('Failed to save user access');
    }
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      slug: org.slug,
      status: org.status as 'active' | 'inactive'
    });
    setShowOrgModal(true);
  };

  const handleEditUserOrganization = (userOrg: UserOrganization) => {
    setEditingUserOrg(userOrg);
    setUserOrgForm({
      user_id: userOrg.user_id,
      organization_id: userOrg.organization_id,
      role: userOrg.role as 'superadmin' | 'admin' | 'user',
      status: userOrg.status as 'active' | 'inactive'
    });
    setShowUserModal(true);
  };

  const handleDeleteUserOrganization = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this user access?')) {
      try {
        await deleteUserOrganization(id);
        toast.success('User access revoked successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting user organization:', error);
        toast.error('Failed to revoke user access');
      }
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Panel</h1>
                <p className="text-sm text-gray-600">System-wide administration and management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Super Administrator
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/superadmin/login');
                  toast.success('Logged out successfully');
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organizations'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="inline-block w-4 h-4 mr-2" />
              Organizations
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="inline-block w-4 h-4 mr-2" />
              System
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Organizations</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.totalOrganizations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Organizations</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.activeOrganizations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.activeUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Organizations</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {organizations.slice(0, 5).map((org) => (
                    <div key={org.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.slug}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.status)}`}>
                        {org.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Organizations Management</h3>
                    <p className="text-sm text-gray-600">Create and manage organizations in the system</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/superadmin/organizations')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Manage Organizations</span>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemStats.totalOrganizations}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active Organizations</p>
                  <p className="text-2xl font-semibold text-green-600">{systemStats.activeOrganizations}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Recent Organizations</p>
                  <p className="text-2xl font-semibold text-blue-600">{organizations.slice(0, 5).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">User Access Management</h3>
                    <p className="text-sm text-gray-600">Grant and manage user access to organizations</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/superadmin/user-access')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage User Access</span>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemStats.totalUsers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-green-600">{systemStats.activeUsers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Recent Access Grants</p>
                  <p className="text-2xl font-semibold text-blue-600">{userOrganizations.slice(0, 5).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">System Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Database className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Connection Status:</span>
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Backup:</span>
                    <span className="text-sm font-medium text-gray-900">2 hours ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Settings className="h-6 w-6 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="text-sm font-medium text-gray-900">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Environment:</span>
                    <span className="text-sm font-medium text-blue-600">Production</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Actions</h3>
              <div className="space-y-4">
                <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Clear System Cache</p>
                      <p className="text-sm text-gray-500">Clear all cached data to improve performance</p>
                    </div>
                    <Settings className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export System Data</p>
                      <p className="text-sm text-gray-500">Export all system data for backup</p>
                    </div>
                    <Database className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Organization Modal */}
        {showOrgModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingOrg ? 'Edit Organization' : 'Add Organization'}
                </h3>
                <form onSubmit={handleCreateOrganization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={orgForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setOrgForm({
                          ...orgForm,
                          name,
                          slug: generateSlug(name)
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <input
                      type="text"
                      value={orgForm.slug}
                      onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={orgForm.status}
                      onChange={(e) => setOrgForm({ ...orgForm, status: e.target.value as 'active' | 'inactive' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrgModal(false);
                        setEditingOrg(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      {editingOrg ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User Organization Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingUserOrg ? 'Edit User Access' : 'Grant User Access'}
                </h3>
                <form onSubmit={handleCreateUserOrganization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <input
                      type="text"
                      value={userOrgForm.user_id}
                      onChange={(e) => setUserOrgForm({ ...userOrgForm, user_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter user ID or email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <select
                      value={userOrgForm.organization_id}
                      onChange={(e) => setUserOrgForm({ ...userOrgForm, organization_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="">Select Organization</option>
                      {organizations.filter(org => org.status === 'active').map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={userOrgForm.role}
                      onChange={(e) => setUserOrgForm({ ...userOrgForm, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={userOrgForm.status}
                      onChange={(e) => setUserOrgForm({ ...userOrgForm, status: e.target.value as 'active' | 'inactive' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserModal(false);
                        setEditingUserOrg(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      {editingUserOrg ? 'Update' : 'Grant Access'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
