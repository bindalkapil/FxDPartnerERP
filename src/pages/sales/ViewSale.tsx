import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, User, Calendar, MapPin, CreditCard, FileText, Edit, AlertTriangle, Truck, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSalesOrder } from '../../lib/api';

interface DeliveryAddress {
  label: string;
  address: string;
  is_default: boolean;
}

interface SalesOrderData {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    customer_type: string;
    contact: string;
    email: string;
    address: string;
    delivery_addresses: DeliveryAddress[] | null;
    credit_limit: number;
    current_balance: number;
  };
  order_date: string;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_terms: number;
  payment_mode: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_contact: string | null;
  delivery_location_confirmed: boolean | null;
  sales_order_items: Array<{
    id: string;
    product_name: string;
    sku_code: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total_price: number;
  }>;
}

const ViewSale: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<SalesOrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;
    
    try {
      const data = await getSalesOrder(id);
      setOrderData(data);
    } catch (error) {
      console.error('Error loading sales order:', error);
      toast.error('Failed to load sales order data');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canEdit = () => {
    return orderData && (orderData.status === 'draft' || orderData.status === 'processing');
  };

  const getSaleType = () => {
    return orderData?.delivery_date || orderData?.delivery_address ? 'outstation' : 'counter';
  };

  const getAvailableCredit = () => {
    if (!orderData) return 0;
    return orderData.customer.credit_limit - orderData.customer.current_balance;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Dispatch Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'draft':
        return 'Draft';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales order...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Sales order not found</div>
      </div>
    );
  }

  const saleType = getSaleType();
  const availableCredit = getAvailableCredit();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sales')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Sales Order Details</h1>
          </div>
        </div>
        <div className="flex space-x-3">
          {canEdit() && (
            <button
              onClick={() => navigate(`/sales/edit/${id}`)}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Order
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            Print
          </button>
        </div>
      </div>

      {/* Order Overview */}
      <div className="bg-white shadow-sm rounded-lg border-l-4 border-green-500">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{orderData.order_number}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created {formatDateTime(orderData.order_date)}
                </p>
              </div>
              
              {/* Sale Type Badge */}
              <div>
                <span className={`inline-flex px-4 py-2 text-sm font-medium rounded-full ${
                  saleType === 'outstation' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {saleType === 'outstation' ? 'Outstation Sale' : 'Counter Sale'}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                <span className={`inline-flex px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(orderData.status)}`}>
                  {getStatusDisplayText(orderData.status)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">₹{orderData.total_amount.toLocaleString()}</p>
              <div className="flex items-center justify-end mt-1">
                <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
                <p className="text-lg font-medium text-gray-700">{getPaymentModeDisplay(orderData.payment_mode)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information for Outstation Sales */}
          {saleType === 'outstation' && orderData.delivery_date && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Delivery Scheduled</h3>
                  <p className="text-sm text-blue-700">{formatDateTime(orderData.delivery_date)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dispatch Information */}
          {saleType === 'outstation' && orderData.status === 'dispatched' && orderData.vehicle_number && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start">
                <Truck className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Dispatch Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Vehicle:</span>
                      <span className="ml-2 text-green-800">{orderData.vehicle_number}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Driver:</span>
                      <span className="ml-2 text-green-800">{orderData.driver_name}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Contact:</span>
                      <span className="ml-2 text-green-800">{orderData.driver_contact}</span>
                    </div>
                  </div>
                  {orderData.delivery_location_confirmed && (
                    <div className="mt-2 text-sm text-green-700">
                      ✓ Delivery location confirmed
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
                Order Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Order Number</label>
                    <p className="text-sm text-gray-900">{orderData.order_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Order Date</label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{formatDateTime(orderData.order_date)}</p>
                    </div>
                  </div>
                  {orderData.delivery_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Date</label>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-900">{formatDateTime(orderData.delivery_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
                    <p className="text-sm text-gray-900">{orderData.payment_terms} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Payment Mode</label>
                    <p className="text-sm text-gray-900">{getPaymentModeDisplay(orderData.payment_mode)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Current Status</label>
                    <span className={`inline-flex px-3 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(orderData.status)}`}>
                      {getStatusDisplayText(orderData.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 text-green-600 mr-2" />
                Customer Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{orderData.customer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Customer Type</label>
                    <p className="text-sm text-gray-900 capitalize">{orderData.customer.customer_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Contact</label>
                    <p className="text-sm text-gray-900">{orderData.customer.contact}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{orderData.customer.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-sm text-gray-900">{orderData.customer.address}</p>
                  </div>
                  {orderData.delivery_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Address</label>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-sm text-gray-900">{orderData.delivery_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Credit Information */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Credit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Credit Limit:</span>
                    <span className="ml-2 font-medium">₹{orderData.customer.credit_limit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Outstanding:</span>
                    <span className="ml-2 font-medium">₹{orderData.customer.current_balance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Credit:</span>
                    <span className="ml-2 font-medium">₹{availableCredit.toLocaleString()}</span>
                  </div>
                </div>
                {orderData.payment_mode === 'credit' && orderData.total_amount > availableCredit && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">
                        Order total exceeds available credit limit
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.sales_order_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sku_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {orderData.notes && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  Additional Notes
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{orderData.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                Order Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">₹{orderData.subtotal.toFixed(2)}</span>
                </div>
                {orderData.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-red-600">-₹{orderData.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-green-600">₹{orderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Items:</span>
                <span className="text-sm font-medium text-gray-900">
                  {orderData.sales_order_items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Quantity:</span>
                <span className="text-sm font-medium text-gray-900">
                  {orderData.sales_order_items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Average Item Price:</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(orderData.subtotal / orderData.sales_order_items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              {canEdit() && (
                <button
                  onClick={() => navigate(`/sales/edit/${id}`)}
                  className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Order
              </button>
              {saleType === 'outstation' && orderData.status === 'processing' && (
                <button
                  onClick={() => navigate('/dispatch')}
                  className="w-full bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Manage Dispatch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSale;