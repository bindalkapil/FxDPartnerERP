import React, { useState } from 'react';
import { Users, Search, Filter, Eye, Pencil, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  products: string[];
  status: 'active' | 'inactive';
  creditLimit: number;
  outstandingBalance: number;
  lastTransaction: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Green Farms',
    contactPerson: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@greenfarms.com',
    address: '123, Farm Road, Bangalore',
    products: ['Apples', 'Oranges', 'Bananas'],
    status: 'active',
    creditLimit: 100000,
    outstandingBalance: 25000,
    lastTransaction: '2025-06-18'
  },
  {
    id: 'SUP002',
    name: 'Fresh Harvests',
    contactPerson: 'Priya Singh',
    phone: '8765432109',
    email: 'priya@freshharvests.com',
    address: '456, Market Lane, Mumbai',
    products: ['Mangoes', 'Grapes'],
    status: 'active',
    creditLimit: 150000,
    outstandingBalance: 45000,
    lastTransaction: '2025-06-17'
  },
  {
    id: 'SUP003',
    name: 'Organic Fruits Co.',
    contactPerson: 'Ahmed Khan',
    phone: '7654321098',
    email: 'ahmed@organicfruits.com',
    address: '789, Garden Street, Delhi',
    products: ['Pineapples', 'Papayas'],
    status: 'inactive',
    creditLimit: 80000,
    outstandingBalance: 0,
    lastTransaction: '2025-06-15'
  }
];

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: 'active' | 'inactive') => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === id ? { ...supplier, status: newStatus } : supplier
    ));
    toast.success(`Supplier ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
        </div>
        <button 
          onClick={() => navigate('/suppliers/new')}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
        >
          Add Supplier
        </button>
      </div>
      
      {/* Supplier Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-800">{suppliers.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-800">
                {suppliers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <FileText className="h-5 w-5" />
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
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
      
      {/* Suppliers Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Info
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
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">ID: {supplier.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{supplier.contactPerson}</div>
                      <div className="text-gray-500">{supplier.phone}</div>
                      <div className="text-gray-500">{supplier.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {supplier.products.map((product, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">Credit Limit: ₹{supplier.creditLimit.toLocaleString()}</div>
                      <div className="text-gray-500">Outstanding: ₹{supplier.outstandingBalance.toLocaleString()}</div>
                      <div className="text-gray-500">Last Transaction: {supplier.lastTransaction}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={supplier.status}
                      onChange={(e) => handleStatusChange(supplier.id, e.target.value as 'active' | 'inactive')}
                      className={`text-sm rounded-full px-3 py-1 ${
                        supplier.status === 'active' 
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
                        onClick={() => navigate(`/suppliers/view/${supplier.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
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
        
        {filteredSuppliers.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No suppliers found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;