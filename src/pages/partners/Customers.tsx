import React, { useState } from 'react';
import { User, Search, Filter, Eye, Pencil, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  type: string;
  contact: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive';
  lastTransaction: string;
}

const mockCustomers: Customer[] = [
  {
    id: 'CUST001',
    name: 'ABC Retail Store',
    type: 'Retailer',
    contact: '9876543210',
    email: 'abc@retail.com',
    address: '123 Market Street, City Center',
    creditLimit: 50000,
    currentBalance: 15000,
    status: 'active',
    lastTransaction: '2025-06-18'
  },
  {
    id: 'CUST002',
    name: 'XYZ Wholesalers',
    type: 'Wholesaler',
    contact: '8765432109',
    email: 'xyz@wholesale.com',
    address: '456 Business Hub, West End',
    creditLimit: 100000,
    currentBalance: 75000,
    status: 'active',
    lastTransaction: '2025-06-17'
  },
  {
    id: 'CUST003',
    name: 'Fresh Foods Restaurant',
    type: 'Restaurant',
    contact: '7654321098',
    email: 'fresh@foods.com',
    address: '789 Food Street, City',
    creditLimit: 25000,
    currentBalance: 5000,
    status: 'inactive',
    lastTransaction: '2025-06-16'
  }
];

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.includes(searchTerm);
      
    const matchesType = selectedType === 'all' || customer.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const customerTypes = Array.from(new Set(customers.map(customer => customer.type)));

  const handleStatusChange = (id: string, newStatus: 'active' | 'inactive') => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, status: newStatus } : customer
    ));
    toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
        </div>
        <button 
          onClick={() => navigate('/customers/new')}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
        >
          Add Customer
        </button>
      </div>
      
      {/* Customer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credit Extended</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{customers.reduce((sum, customer) => sum + customer.currentBalance, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold text-gray-800">
                {customers.filter(customer => customer.status === 'active').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              {customerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      {/* Customers Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Transaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.contact}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Balance: ₹{customer.currentBalance}</div>
                    <div className="text-sm text-gray-500">Limit: ₹{customer.creditLimit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastTransaction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={customer.status}
                      onChange={(e) => handleStatusChange(customer.id, e.target.value as 'active' | 'inactive')}
                      className={`text-sm rounded-full px-3 py-1 ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/customers/view/${customer.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;