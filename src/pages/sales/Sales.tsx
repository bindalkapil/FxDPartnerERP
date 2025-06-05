import React, { useState } from 'react';
import { ShoppingCart, Search, Filter, Plus, FileText, Trash2, Eye } from 'lucide-react';

interface SaleOrder {
  id: string;
  customerName: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMode: 'cash' | 'credit';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

const mockSales: SaleOrder[] = [
  {
    id: 'SO001',
    customerName: 'Fresh Mart',
    orderDate: '2025-06-18 09:30 AM',
    items: [
      { name: 'Apples', quantity: 100, unit: 'kg', price: 120 },
      { name: 'Oranges', quantity: 50, unit: 'kg', price: 80 }
    ],
    total: 16000,
    status: 'completed',
    paymentMode: 'cash',
    paymentStatus: 'paid'
  },
  {
    id: 'SO002',
    customerName: 'Green Grocers',
    orderDate: '2025-06-18 10:45 AM',
    items: [
      { name: 'Bananas', quantity: 80, unit: 'kg', price: 60 },
      { name: 'Grapes', quantity: 30, unit: 'kg', price: 150 }
    ],
    total: 9300,
    status: 'processing',
    paymentMode: 'credit',
    paymentStatus: 'unpaid'
  },
  {
    id: 'SO003',
    customerName: 'City Supermarket',
    orderDate: '2025-06-18 11:15 AM',
    items: [
      { name: 'Mangoes', quantity: 60, unit: 'kg', price: 200 },
      { name: 'Pineapples', quantity: 40, unit: 'kg', price: 100 }
    ],
    total: 16000,
    status: 'pending',
    paymentMode: 'credit',
    paymentStatus: 'unpaid'
  }
];

const Sales: React.FC = () => {
  const [sales, setSales] = useState<SaleOrder[]>(mockSales);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || sale.paymentStatus === selectedPaymentStatus;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Sale
        </button>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">₹41,300</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {sales.filter(sale => sale.status === 'pending').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-gray-800">
                {sales.filter(sale => sale.status === 'processing').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {sales.filter(sale => sale.status === 'completed').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
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
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                        <div className="text-sm text-gray-500">Order ID: {sale.id}</div>
                        <div className="text-sm text-gray-500">{sale.orderDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {sale.items.map((item, index) => (
                        <div key={index}>
                          {item.name} - {item.quantity}{item.unit} @ ₹{item.price}/{item.unit}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{sale.total}</div>
                    <div className="text-sm text-gray-500">{sale.paymentMode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : sale.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : sale.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : sale.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-4 w-4" />
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
        
        {filteredSales.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No sales orders found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;