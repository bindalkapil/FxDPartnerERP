import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSalesOrders, approvePendingSalesOrder, updateSalesOrder, rejectPendingSalesOrder } from '../../lib/api';
import MobileTable from '../../components/ui/MobileTable';

interface PendingOrder {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    customer_type: string;
    credit_limit: number;
    current_balance: number;
  };
  order_date: string;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_mode: string;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  status: string;
  notes: string | null;
  sales_order_items: Array<{
    product_name: string;
    sku_code: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total_price: number;
  }>;
}

const PendingApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    try {
      const data = await getSalesOrders();
      
      // Filter only pending approval orders
      const pendingApprovalOrders = (data || []).filter(order => order.status === 'pending_approval');
      
      setPendingOrders(pendingApprovalOrders);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      toast.error('Failed to load pending orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (order: PendingOrder) => {
    setSelectedOrder(order);
    setShowApprovalModal(true);
  };

  const handleRejectOrder = async (order: PendingOrder) => {
    setSelectedOrder(order);
    setShowRejectionModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      // Use the new approval function that handles inventory and customer balance updates
      const newStatus = selectedOrder.delivery_date ? 'processing' : 'completed';
      
      await approvePendingSalesOrder(selectedOrder.id, newStatus);

      // Update the notes to record the approval
      await updateSalesOrder(selectedOrder.id, {
        notes: selectedOrder.notes ? `${selectedOrder.notes}\n\nApproved on ${new Date().toLocaleString()}` : `Approved on ${new Date().toLocaleString()}`
      });

      toast.success('Order approved successfully!');
      
      // Remove from pending list
      setPendingOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      
      setShowApprovalModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      // For pending approval orders, we need to restore inventory since it wasn't deducted yet
      // But we still update the order status to cancelled and add rejection notes
      await updateSalesOrder(selectedOrder.id, {
        status: 'cancelled',
        notes: selectedOrder.notes ? `${selectedOrder.notes}\n\nRejected on ${new Date().toLocaleString()}: ${rejectionReason}` : `Rejected on ${new Date().toLocaleString()}: ${rejectionReason}`
      });

      toast.success('Order rejected successfully!');
      
      // Remove from pending list
      setPendingOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      
      setShowRejectionModal(false);
      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = pendingOrders.filter(order => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesSearch;
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCreditInfo = (order: PendingOrder) => {
    const availableCredit = order.customer.credit_limit - order.customer.current_balance;
    const shortage = (order.total_amount || 0) - availableCredit;
    return { availableCredit, shortage };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pending orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mr-2" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Pending Approvals</h1>
        </div>
        <div className="text-sm text-gray-600">
          {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} awaiting approval
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{pendingOrders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Credit Shortage</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{pendingOrders.reduce((sum, order) => {
                  const { shortage } = getCreditInfo(order);
                  return sum + Math.max(0, shortage);
                }, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <MobileTable
        columns={[
          {
            key: 'orderDetails',
            label: 'Order Details',
            mobileLabel: 'Order',
            render: (_, order) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                  <div className="text-sm text-gray-500">{formatDateTime(order.order_date)}</div>
                  {order.delivery_date && (
                    <div className="text-sm text-gray-500">Delivery: {formatDateTime(order.delivery_date)}</div>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'customer',
            label: 'Customer',
            mobileLabel: 'Customer',
            render: (_, order) => (
              <div>
                <div className="text-sm text-gray-900">{order.customer.name}</div>
                <div className="text-sm text-gray-500 capitalize">{order.customer.customer_type}</div>
              </div>
            )
          },
          {
            key: 'creditInfo',
            label: 'Credit Information',
            mobileLabel: 'Credit',
            render: (_, order) => {
              const { availableCredit, shortage } = getCreditInfo(order);
              return (
                <div className="text-sm">
                  <div className="text-gray-900">Available: ₹{availableCredit.toLocaleString()}</div>
                  <div className="text-gray-900">Order: ₹{(order.total_amount ?? 0).toLocaleString()}</div>
                  <div className="text-red-600 font-medium">Shortage: ₹{shortage.toLocaleString()}</div>
                </div>
              );
            }
          },
          {
            key: 'items',
            label: 'Items',
            mobileLabel: 'Items',
            render: (_, order) => (
              <div className="text-sm text-gray-900">
                {order.sales_order_items.slice(0, 2).map((item: any, index: number) => (
                  <div key={index}>
                    {item.product_name} - {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                  </div>
                ))}
                {order.sales_order_items.length > 2 && (
                  <div className="text-sm text-gray-500">
                    +{order.sales_order_items.length - 2} more items
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'total',
            label: 'Total Amount',
            mobileLabel: 'Total',
            render: (_, order) => (
              <div className="text-sm font-medium text-gray-900">
                ₹{(order.total_amount ?? 0).toLocaleString()}
              </div>
            )
          },
          {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Actions',
            render: (_, order) => (
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate(`/sales/view/${order.id}`)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm flex items-center"
                  title="View Details"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button 
                  onClick={() => handleApproveOrder(order)}
                  className="text-green-600 hover:text-green-900 text-sm flex items-center"
                  title="Approve Order"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button 
                  onClick={() => handleRejectOrder(order)}
                  className="text-red-600 hover:text-red-900 text-sm flex items-center"
                  title="Reject Order"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </button>
              </div>
            )
          }
        ]}
        data={filteredOrders}
        loading={loading}
        emptyState={
          <div className="py-12 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-sm text-gray-500 mb-4">
              {pendingOrders.length === 0 
                ? "All orders are within customer credit limits."
                : "No orders match your current search criteria."
              }
            </p>
          </div>
        }
      />

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Approve Order
                  </h3>
                  <p className="text-sm text-gray-500">
                    Confirm approval of order {selectedOrder.order_number}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Customer:</span>
                      <span className="text-gray-700">{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Order Value:</span>
                      <span className="text-gray-700 font-medium">₹{(selectedOrder.total_amount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Available Credit:</span>
                      <span className="text-gray-700">₹{getCreditInfo(selectedOrder).availableCredit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Credit Shortage:</span>
                      <span className="text-red-600 font-medium">₹{getCreditInfo(selectedOrder).shortage.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      What happens when you approve?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>The order will be moved to processing/completed status</li>
                        <li>Inventory will be updated to reflect the sale</li>
                        <li>Customer's outstanding balance will be increased</li>
                        <li>The order will proceed through normal fulfillment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmApproval}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Approving...' : 'Approve Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reject Order
                  </h3>
                  <p className="text-sm text-gray-500">
                    Provide a reason for rejecting order {selectedOrder.order_number}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Please provide a detailed reason for rejecting this order..."
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      What happens when you reject?
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>The order will be cancelled and cannot be processed</li>
                        <li>No inventory changes will be made</li>
                        <li>Customer will be notified of the rejection</li>
                        <li>The rejection reason will be recorded for reference</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedOrder(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
