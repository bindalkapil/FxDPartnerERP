import React, { useState, useEffect } from 'react';
import { Truck, Search, Filter, Eye, Edit, Package, Calendar, User, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOutstationSalesOrders } from '../../lib/api';
import MarkAsShippedModal from '../../components/modals/MarkAsShippedModal';

interface DispatchOrder {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    customer_type: string;
  };
  order_date: string;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_mode: string;
  total_amount: number;
  status: string;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_contact: string | null;
  delivery_location_confirmed: boolean | null;
  sales_order_items: Array<{
    product_name: string;
    sku_code: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total_price: number;
  }>;
}

const Dispatch: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showMarkAsShippedModal, setShowMarkAsShippedModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  useEffect(() => {
    loadDispatchOrders();
  }, []);

  const loadDispatchOrders = async () => {
    try {
      const data = await getOutstationSalesOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading dispatch orders:', error);
      toast.error('Failed to load dispatch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsShipped = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowMarkAsShippedModal(true);
  };

  const handleModalClose = () => {
    setShowMarkAsShippedModal(false);
    setSelectedOrderId('');
  };

  const handleModalConfirm = () => {
    // Reload the orders to reflect the updated status
    loadDispatchOrders();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.driver_name && order.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPaymentModeDisplay = (mode: string) => {
    switch (mode) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'cash':
        return 'Cash';
      case 'credit':
        return 'Credit';
      default:
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dispatch orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Dispatch Management</h1>
        </div>
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
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'processing').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dispatched</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'dispatched').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Truck className="h-5 w-5" />
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
            <option value="processing">Processing</option>
            <option value="dispatched">Dispatched</option>
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
                  Customer & Delivery
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle & Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500">
                          Order: {formatDateTime(order.order_date)}
                        </div>
                        {order.delivery_date && (
                          <div className="text-sm text-gray-500">
                            Delivery: {formatDateTime(order.delivery_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.customer.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{order.customer.customer_type}</div>
                    {order.delivery_address && (
                      <div className="text-sm text-gray-500 mt-1 flex items-start">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{order.delivery_address}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {order.vehicle_number ? (
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Truck className="h-4 w-4 text-gray-400 mr-1" />
                          {order.vehicle_number}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <User className="h-3 w-3 text-gray-400 mr-1" />
                          {order.driver_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 text-gray-400 mr-1" />
                          {order.driver_contact}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Not assigned</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{order.total_amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{getPaymentModeDisplay(order.payment_mode)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/sales/view/${order.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/sales/edit/${order.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {order.status === 'processing' && (
                        <button 
                          onClick={() => handleMarkAsShipped(order.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Shipped"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && !loading && (
          <div className="py-12 text-center text-gray-500">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dispatch Orders Found</h3>
            <p className="text-sm text-gray-500">
              {orders.length === 0 
                ? "No outstation sales orders found. Dispatch orders are automatically created for outstation sales."
                : "No orders match your current search and filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Mark as Shipped Modal */}
      <MarkAsShippedModal
        isOpen={showMarkAsShippedModal}
        onClose={handleModalClose}
        salesOrderId={selectedOrderId}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default Dispatch;