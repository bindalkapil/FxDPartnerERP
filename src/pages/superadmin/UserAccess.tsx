import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, ArrowLeft, UserCheck, Building2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllOrganizations,
  getAllUsersWithOrganizations,
  createUserOrganization,
  updateUserOrganization,
  deleteUserOrganization,
  updateUserStatus,
  updateUserRole
} from '../../lib/superadmin-api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface UserOrganization {
  id: string;
  role: string;
  status: string;
  created_at: string | null;
  organizations: Organization;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  status: string;
  created_at: string | null;
  last_login: string | null;
  roles: Role;
  user_organizations: UserOrganization[];
}

const UserAccess: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserOrg, setEditingUserOrg] = useState<UserOrganization | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      const [orgsData, usersData] = await Promise.all([
        getAllOrganizations(),
        getAllUsersWithOrganizations()
      ]);
      setOrganizations(orgsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserOrg) {
        await updateUserOrganization(editingUserOrg.id, userOrgForm);
        toast.success('User access updated successfully');
      } else {
        await createUserOrganization(userOrgForm);
        toast.success('User access granted successfully');
      }
      setShowModal(false);
      setEditingUserOrg(null);
      setUserOrgForm({ user_id: '', organization_id: '', role: 'user', status: 'active' });
      loadData();
    } catch (error) {
      console.error('Error saving user organization:', error);
      toast.error('Failed to save user access');
    }
  };

  const handleEditUserOrg = (userOrg: UserOrganization, userId: string) => {
    setEditingUserOrg(userOrg);
    setUserOrgForm({
      user_id: userId,
      organization_id: userOrg.organizations.id,
      role: userOrg.role as 'superadmin' | 'admin' | 'user',
      status: userOrg.status as 'active' | 'inactive'
    });
    setShowModal(true);
  };

  const handleDeleteUserOrg = async (id: string) => {
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

  const handleGrantAccess = (userId: string) => {
    setEditingUserOrg(null);
    setUserOrgForm({ user_id: userId, organization_id: '', role: 'user', status: 'active' });
    setShowModal(true);
  };

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      await updateUserStatus(userId, status);
      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              <button
                onClick={() => navigate('/superadmin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Users className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-600">Manage users and their organization access</p>
              </div>
            </div>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              Super Administrator
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
              <p className="text-sm text-gray-600">All users registered in the system with their organization access</p>
            </div>
            <div className="text-sm text-gray-500">
              Total Users: {users.length}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.roles.name)}`}>
                        {user.roles.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.user_organizations.length > 0 ? (
                          user.user_organizations.map((userOrg) => (
                            <div key={userOrg.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-700">{userOrg.organizations.name}</span>
                                <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded ${getRoleColor(userOrg.role)}`}>
                                  {userOrg.role}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditUserOrg(userOrg, user.id)}
                                  className="text-indigo-600 hover:text-indigo-900 p-0.5"
                                  title="Edit Access"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUserOrg(userOrg.id)}
                                  className="text-red-600 hover:text-red-900 p-0.5"
                                  title="Revoke Access"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic">No organization access</div>
                        )}
                        <button
                          onClick={() => handleGrantAccess(user.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Grant Access</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUpdateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        className={`text-xs px-2 py-1 rounded ${
                          user.status === 'active' 
                            ? 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100' 
                            : 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <UserCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Users will appear here when they register</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grant/Edit Access Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUserOrg ? 'Edit Organization Access' : 'Grant Organization Access'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <input
                    type="text"
                    value={users.find(u => u.id === userOrgForm.user_id)?.email || userOrgForm.user_id}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    disabled
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
                  <label className="block text-sm font-medium text-gray-700">Organization Role</label>
                  <select
                    value={userOrgForm.role}
                    onChange={(e) => setUserOrgForm({ ...userOrgForm, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    User's role within this specific organization
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Status</label>
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
                      setShowModal(false);
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
                    {editingUserOrg ? 'Update Access' : 'Grant Access'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccess;
