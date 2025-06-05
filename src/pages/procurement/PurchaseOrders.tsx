import React, { useState } from 'react';
import { Package2, Search, Filter, Eye, Pencil, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    totalWeight: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'completed';
  pricingModel: 'commission' | 'fixed';
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    orderNumber: 'PO-2025-001',
    supplier: 'Green Farms',
    orderDate: '2025-06-18 08:30 AM',
    items: [
      {
        name: 'POMO MH',
        quantity: 100,
        totalWeight: 1000
      }
    ],
    totalAmount: 125000,
    status: 'completed',
    pricingModel: 'commission'
  },
  {
    id: 'PO002',
    orderNumber: 'PO-2025-002',
    supplier: 'Fresh Harvests',
    orderDate: '2025-06-18 10:15 AM',
    items: [
      {
        name: 'Washington Apple',
        quantity: 50,
        totalWeight: 1000
      }
    ],
    totalAmount: 75000,
    status: 'draft',
    pricingModel: 'fixed'
  },
  {
    id: 'PO003',
    orderNumber: 'PO-2025-003',
    supplier: 'Organic Fruits Co.',
    orderDate: '2025-06-18 11:45 AM',
    items: [
      {
        name: 'Banganpally',
        quantity: 750,
        totalWeight: 750
      }
    ],
    totalAmount: 150000,
    status: 'draft',
    pricingModel: 'commission'
  }
];

const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPricingModel, setSelectedPricingModel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPricingModel = selectedPricingModel === 'all' || order.pricingModel === selectedPricingModel;
    
    return matchesSearch && matchesStatus && matchesPricingModel;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package2 className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Package2 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Draft Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'draft').length}
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
              <p className="text-sm font-medium text-gray-500">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'completed').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package2 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
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
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedPricingModel}
            onChange={(e) => setSelectedPricingModel(e.target.value)}
          >
            <option value="all">All Pricing Models</option>
            <option value="commission">Commission Sale</option>
            <option value="fixed">Fixed Price</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Package2 className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.orderDate}</div>
                        <div className="text-sm text-gray-500">
                          {order.pricingModel === 'commission' ? 'Commission Sale' : 'Fixed Price'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.supplier}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-500">
                          {item.name} ({item.quantity} boxes - {item.totalWeight}kg)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{order.totalAmount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/purchase-orders/view/${order.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.status === 'draft' && (
                        <button 
                          onClick={() => navigate(`/purchase-orders/edit/${order.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No purchase orders found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrders;