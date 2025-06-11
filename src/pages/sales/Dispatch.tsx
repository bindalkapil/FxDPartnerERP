import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Calendar, MapPin, User, Phone, Package, Eye, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOutstationSalesOrders, updateSalesOrderDispatchDetails } from '../../lib/api';
import DispatchOrderModal from '../../components/modals/DispatchOrderModal';

const Dispatch = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOutstationSalesOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load dispatch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchOrder = async (dispatchData: any) => {
    if (!selectedOrder) return;

    try {
      await updateSalesOrderDispatchDetails(selectedOrder.id, dispatchData);
      await loadOrders(); // Reload orders to reflect changes
      setIsDispatchModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error dispatching order:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      dispatch_pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Dispatch Pending' },
      dispatched: { color: 'bg-green-100 text-green-800', label: 'Dispatched' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
      unpaid: { color: 'bg-red-100 text-red-800', label: 'Unpaid' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (order: any) => {
    return order.sales_order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/sales"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Sales
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
            <p className="text-gray-600">Manage outstation order dispatches</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Dispatch</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'dispatch_pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dispatched</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'dispatched').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Outstation Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No outstation orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              No outstation orders found for dispatch management.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items & Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.order_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer?.customer_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}
                        </div>
                        {order.delivery_address && (
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600 max-w-xs truncate">
                              {order.delivery_address}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {getTotalItems(order)} items
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{(order.total_amount ?? 0).toLocaleString()}
                        </div>
                        <div className="mt-1">
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      {order.vehicle_number || order.driver_name ? (
                        <div className="text-sm text-gray-900">
                          {order.vehicle_number && (
                            <div className="flex items-center mb-1">
                              <Truck className="h-4 w-4 mr-1 text-gray-400" />
                              {order.vehicle_number}
                            </div>
                          )}
                          {order.driver_name && (
                            <div className="flex items-center mb-1">
                              <User className="h-4 w-4 mr-1 text-gray-400" />
                              {order.driver_name}
                            </div>
                          )}
                          {order.driver_contact && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              {order.driver_contact}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/sales/view/${order.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        
                        {order.status === 'dispatch_pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDispatchModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <DispatchOrderModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onDispatch={handleDispatchOrder}
      />
    </div>
  );
};

export default Dispatch;