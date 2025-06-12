import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Edit, Mail, Phone, MapPin, CreditCard, Building, Calendar, FileText, Eye, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomer, getSalesOrdersByCustomerId, getPaymentsByPartyId } from '../../lib/api';

interface Customer {
  id: string;
  name: string;
  customer_type: string;
  contact: string;
  email: string;
  address: string;
  delivery_addresses: Array<{
    label: string;
    address: string;
    is_default: boolean;
  }> | null;
  gst_number: string | null;
  pan_number: string | null;
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  order_date: string;
  delivery_date: string | null;
  payment_mode: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  sales_order_items: Array<{
    product_name: string;
    sku_code: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total_price: number;
  }>;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  payment_date: string;
  reference_number: string | null;
  reference_type: string | null;
  mode: string;
  status: string;
  notes: string | null;
}

const ViewCustomer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'payments'>('overview');

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) return;
    
    try {
      const [customerData, ordersData, paymentsData] = await Promise.all([
        getCustomer(id),
        getSalesOrdersByCustomerId(id),
        getPaymentsByPartyId(id)
      ]);
      
      setCustomer(customerData);
      setSalesOrders(ordersData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load customer data');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) {
      return '0';
    }
    return amount.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const calculateOrderStats = () => {
    const totalOrders = salesOrders.length;
    const totalValue = salesOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const pendingOrders = salesOrders.filter(order => 
      order.status === 'draft' || order.status === 'processing'
    ).length;
    const completedOrders = salesOrders.filter(order => 
      order.status === 'delivered'
    ).length;

    return { totalOrders, totalValue, pendingOrders, completedOrders };
  };

  const calculatePaymentStats = () => {
    const totalPayments = payments.length;
    const totalReceived = payments
      .filter(p => p.type === 'received' && p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    return { totalPayments, totalReceived, pendingPayments };
  };

  const getAvailableCredit = () => {
    if (!customer) return 0;
    return (customer.credit_limit || 0) - (customer.current_balance || 0);
  };

  const getCreditUtilization = () => {
    if (!customer || (customer.credit_limit || 0) === 0) return 0;
    return ((customer.current_balance || 0) / (customer.credit_limit || 1)) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Customer not found</div>
      </div>
    );
  }

  const orderStats = calculateOrderStats();
  const paymentStats = calculatePaymentStats();
  const availableCredit = getAvailableCredit();
  const creditUtilization = getCreditUtilization();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <User className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Customer Details</h1>
          </div>
        </div>
        <button
          onClick={() => navigate(`/customers/edit/${id}`)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit Customer
        </button>
      </div>

      {/* Customer Overview Card */}
      <div className="bg-white shadow-sm rounded-lg border-l-4 border-green-500">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{customer.customer_type}</p>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(customer.status)}`}>
                  {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Business Value</p>
              <p className="text-2xl font-bold text-green-600">₹{formatCurrency(orderStats.totalValue)}</p>
              <p className="text-sm text-gray-500">{orderStats.totalOrders} orders</p>
            </div>
          </div>

          {/* Credit Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Credit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Credit Limit:</span>
                <p className="text-lg font-semibold text-gray-900">₹{formatCurrency(customer.credit_limit)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Outstanding Balance:</span>
                <p className="text-lg font-semibold text-red-600">₹{formatCurrency(customer.current_balance)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Available Credit:</span>
                <p className="text-lg font-semibold text-green-600">₹{formatCurrency(availableCredit)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Credit Utilization:</span>
                <p className={`text-lg font-semibold ${creditUtilization > 80 ? 'text-red-600' : creditUtilization > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {creditUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {/* Credit Utilization Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${creditUtilization > 80 ? 'bg-red-500' : creditUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Credit Warning */}
            {creditUtilization > 80 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    High credit utilization - consider reviewing credit terms
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales Orders ({orderStats.totalOrders})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Records ({paymentStats.totalPayments})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{customer.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-900">{customer.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Terms</p>
                        <p className="text-sm text-gray-900">{customer.payment_terms} days</p>
                      </div>
                    </div>
                    {customer.gst_number && (
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">GST Number</p>
                          <p className="text-sm text-gray-900">{customer.gst_number}</p>
                        </div>
                      </div>
                    )}
                    {customer.pan_number && (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">PAN Number</p>
                          <p className="text-sm text-gray-900">{customer.pan_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Addresses */}
              {customer.delivery_addresses && customer.delivery_addresses.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Addresses</h3>
                  <div className="space-y-3">
                    {customer.delivery_addresses.map((addr, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {addr.label}
                                {addr.is_default && (
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Statistics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                        <p className="text-sm text-gray-500">Total Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(orderStats.totalValue)}</p>
                        <p className="text-sm text-gray-500">Total Value</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{orderStats.pendingOrders}</p>
                        <p className="text-sm text-gray-500">Pending Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{orderStats.completedOrders}</p>
                        <p className="text-sm text-gray-500">Completed Orders</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer Since:</span>
                      <span className="ml-2 font-medium">{formatDate(customer.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 font-medium">{formatDate(customer.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Sales Orders</h3>
                <button
                  onClick={() => navigate('/sales/new')}
                  className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Create New Order
                </button>
              </div>

              {salesOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                              <div className="text-sm text-gray-500">{formatDateTime(order.order_date)}</div>
                              {order.delivery_date && (
                                <div className="text-sm text-gray-500">Delivery: {formatDateTime(order.delivery_date)}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {order.sales_order_items.slice(0, 2).map((item, index) => (
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{formatCurrency(order.total_amount)}</div>
                            <div className="text-sm text-gray-500">{getPaymentModeDisplay(order.payment_mode)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => navigate(`/sales/view/${order.id}`)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Orders</h3>
                  <p className="text-sm text-gray-500 mb-4">This customer hasn't placed any orders yet.</p>
                  <button
                    onClick={() => navigate('/sales/new')}
                    className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Create First Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Payment Records</h3>
                <div className="text-sm text-gray-500">
                  Total Received: ₹{formatCurrency(paymentStats.totalReceived)}
                </div>
              </div>

              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount & Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode & Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDateTime(payment.payment_date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payment.notes && payment.notes.length > 50 
                                  ? `${payment.notes.substring(0, 50)}...` 
                                  : payment.notes || 'No notes'
                                }
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {payment.type === 'received' ? '+' : '-'}₹{formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">{payment.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.reference_number || 'No reference'}
                            </div>
                            {payment.reference_type && (
                              <div className="text-sm text-gray-500">
                                {payment.reference_type.replace('_', ' ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getPaymentModeDisplay(payment.mode)}
                            </div>
                            <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Records</h3>
                  <p className="text-sm text-gray-500">No payments have been recorded for this customer yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCustomer;