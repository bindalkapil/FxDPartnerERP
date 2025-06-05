import React, { useState } from 'react';
import { User, Search, Filter, Plus, FileText, Trash2, Edit, CreditCard, AlertTriangle } from 'lucide-react';

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
    address: '123 Market Street, City',
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
    address: '456 Business Hub, City',
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
    status: 'active',
    lastTransaction: '2025-06-16'
  }
];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
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
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">High Credit Usage</p>
              <p className="text-2xl font-bold text-gray-800">
                {customers.filter(customer => 
                  (customer.currentBalance / customer.creditLimit) > 0.8
                ).length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <FileText className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
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
      
      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Add New Customer
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Customer Type
                          </label>
                          <select
                            id="type"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Select type</option>
                            <option value="Retailer">Retailer</option>
                            <option value="Wholesaler">Wholesaler</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                            Contact Number
                          </label>
                          <input
                            type="tel"
                            id="contact"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <textarea
                          id="address"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                            Credit Limit
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              id="creditLimit"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;