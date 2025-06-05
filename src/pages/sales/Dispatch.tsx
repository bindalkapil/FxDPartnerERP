import React, { useState } from 'react';
import { Truck, Search, Filter, Plus, FileText, Trash2, Eye, TrendingUp, TrendingDown, Package } from 'lucide-react';

interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  dispatchTime: string;
  status: 'pending' | 'in-transit' | 'delivered';
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
}

const mockDispatchOrders: DispatchOrder[] = [
  {
    id: 'DO001',
    orderNumber: 'SO-2025-001',
    customerName: 'Fresh Mart',
    deliveryAddress: '123 Market Street, City Center',
    dispatchTime: '2025-06-18 09:00 AM',
    status: 'delivered',
    items: [
      { name: 'Apples', quantity: 100, unit: 'kg' },
      { name: 'Oranges', quantity: 50, unit: 'kg' }
    ],
    vehicleNumber: 'KA-01-XY-1234',
    driverName: 'John Doe',
    driverContact: '9876543210'
  },
  {
    id: 'DO002',
    orderNumber: 'SO-2025-002',
    customerName: 'Super Foods',
    deliveryAddress: '456 Shopping Mall, West End',
    dispatchTime: '2025-06-18 10:30 AM',
    status: 'in-transit',
    items: [
      { name: 'Bananas', quantity: 75, unit: 'kg' },
      { name: 'Grapes', quantity: 25, unit: 'kg' }
    ],
    vehicleNumber: 'KA-01-XY-5678',
    driverName: 'Mike Smith',
    driverContact: '9876543211'
  },
  {
    id: 'DO003',
    orderNumber: 'SO-2025-003',
    customerName: 'Green Grocers',
    deliveryAddress: '789 Main Road, East Side',
    dispatchTime: '2025-06-18 11:45 AM',
    status: 'pending',
    items: [
      { name: 'Mangoes', quantity: 60, unit: 'kg' },
      { name: 'Pineapples', quantity: 30, unit: 'kg' }
    ],
    vehicleNumber: 'KA-01-XY-9012',
    driverName: 'David Wilson',
    driverContact: '9876543212'
  }
];

const Dispatch: React.FC = () => {
  const [orders, setOrders] = useState<DispatchOrder[]>(mockDispatchOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.driverName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleStatusChange = (id: string, newStatus: 'pending' | 'in-transit' | 'delivered') => {
    setOrders(prev => 
      prev.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Dispatch Management</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Dispatch
        </button>
      </div>
      
      {/* Dispatch Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Dispatches</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'in-transit').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Delivered Today</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'delivered').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <TrendingDown className="h-5 w-5" />
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
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Status:</span>
          </div>
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>
      
      {/* Dispatch Orders Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispatch Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle & Driver
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
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {order.items.map(item => `${item.quantity}${item.unit} ${item.name}`).join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.deliveryAddress}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.dispatchTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.vehicleNumber}</div>
                    <div className="text-sm text-gray-500">
                      {order.driverName} ({order.driverContact})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                      className={`text-sm rounded-full px-3 py-1 ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'in-transit' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
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
        
        {filteredOrders.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No dispatch orders found.
          </div>
        )}
      </div>
      
      {/* New Dispatch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Create New Dispatch
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">
                          Sales Order Number
                        </label>
                        <select
                          id="orderNumber"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select a sales order</option>
                          <option value="SO-2025-001">SO-2025-001 (Fresh Mart)</option>
                          <option value="SO-2025-002">SO-2025-002 (Super Foods)</option>
                          <option value="SO-2025-003">SO-2025-003 (Green Grocers)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                            Vehicle Number
                          </label>
                          <input
                            type="text"
                            id="vehicleNumber"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="dispatchTime" className="block text-sm font-medium text-gray-700">
                            Dispatch Time
                          </label>
                          <input
                            type="datetime-local"
                            id="dispatchTime"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">
                            Driver Name
                          </label>
                          <input
                            type="text"
                            id="driverName"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="driverContact" className="block text-sm font-medium text-gray-700">
                            Driver Contact
                          </label>
                          <input
                            type="text"
                            id="driverContact"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Additional Notes
                        </label>
                        <textarea
                          id="notes"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Any special instructions or notes..."
                        />
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
                  Create Dispatch
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

export default Dispatch;