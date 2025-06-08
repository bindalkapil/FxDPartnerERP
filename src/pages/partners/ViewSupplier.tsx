import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, User, Phone, Mail, MapPin, CreditCard, FileText, Edit, AlertTriangle, Package, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSupplier, getPurchaseRecordsBySupplierId, getPaymentsByPartyId } from '../../lib/api';

interface SupplierData {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string | null;
  pan_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
  products: string[] | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PurchaseRecord {
  id: string;
  record_number: string;
  record_date: string;
  total_amount: number;
  status: string;
  purchase_record_items: Array<{
    product_name: string;
    quantity: number;
    unit_type: string;
  }>;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  payment_date: string;
  reference_number: string | null;
  mode: string;
  status: string;
  notes: string | null;
}

const ViewSupplier: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'payments'>('overview');

  useEffect(() => {
    if (id) {
      loadSupplierData();
    }
  }, [id]);

  const loadSupplierData = async () => {
    if (!id) return;
    
    try {
      const [supplierInfo, purchaseData, paymentData] = await Promise.all([
        getSupplier(id),
        getPurchaseRecordsBySupplierId(id),
        getPaymentsByPartyId(id)
      ]);
      
      setSupplierData(supplierInfo);
      setPurchaseRecords(purchaseData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error('Error loading supplier data:', error);
      toast.error('Failed to load supplier data');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
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

  const getModeDisplay = (mode: string) => {
    switch (mode) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'cash':
        return 'Cash';
      case 'cheque':
        return 'Cheque';
      case 'credit':
        return 'Credit';
      default:
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  };

  const getAvailableCredit = () => {
    if (!supplierData) return 0;
    return supplierData.credit_limit - supplierData.current_balance;
  };

  const getTotalPurchases = () => {
    return purchaseRecords.reduce((sum, record) => sum + record.total_amount, 0);
  };

  const getTotalPaymentsMade = () => {
    return payments
      .filter(p => p.type === 'made' && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getPendingPayments = () => {
    return payments.filter(p => p.status === 'pending').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading supplier details...</div>
      </div>
    );
  }

  if (!supplierData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Supplier not found</div>
      </div>
    );
  }

  const availableCredit = getAvailableCredit();
  const totalPurchases = getTotalPurchases();
  const totalPaymentsMade = getTotalPaymentsMade();
  const pendingPayments = getPendingPayments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Building className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Supplier Details</h1>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/suppliers/edit/${id}`)}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Supplier
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Building className="h-5 w-5 text-green-600 mr-2" />
                Supplier Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
                    <p className="text-sm text-gray-900">{supplierData.company_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{supplierData.contact_person}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{supplierData.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{supplierData.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <p className="text-sm text-gray-900">{supplierData.address}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">GST Number</label>
                    <p className="text-sm text-gray-900">{supplierData.gst_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">PAN Number</label>
                    <p className="text-sm text-gray-900">{supplierData.pan_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`inline-flex px-3 py-1 text-xs leading-5 font-semibold rounded-full ${
                      supplierData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplierData.status.charAt(0).toUpperCase() + supplierData.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {(supplierData.bank_name || supplierData.account_number || supplierData.ifsc_code) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Bank Name:</span>
                      <span className="ml-2 font-medium">{supplierData.bank_name || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Account Number:</span>
                      <span className="ml-2 font-medium">{supplierData.account_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">IFSC Code:</span>
                      <span className="ml-2 font-medium">{supplierData.ifsc_code || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Products */}
              {supplierData.products && supplierData.products.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Products Supplied</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplierData.products.map((product, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {supplierData.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{supplierData.notes}</p>
                </div>
              )}
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
                  Financial Overview
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'purchases'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Purchase History ({purchaseRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payments'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payment History ({payments.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Financial Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Purchases:</span>
                          <span className="text-sm font-medium text-gray-900">₹{totalPurchases.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Payments Made:</span>
                          <span className="text-sm font-medium text-gray-900">₹{totalPaymentsMade.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Outstanding Balance:</span>
                          <span className="text-sm font-medium text-red-600">₹{supplierData.current_balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Pending Payments:</span>
                          <span className="text-sm font-medium text-yellow-600">{pendingPayments}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Credit Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Credit Limit:</span>
                          <span className="text-sm font-medium text-gray-900">₹{supplierData.credit_limit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Available Credit:</span>
                          <span className="text-sm font-medium text-green-600">₹{availableCredit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Payment Terms:</span>
                          <span className="text-sm font-medium text-gray-900">{supplierData.payment_terms} days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {supplierData.current_balance > supplierData.credit_limit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Outstanding balance exceeds credit limit by ₹{(supplierData.current_balance - supplierData.credit_limit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'purchases' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Purchase Records</h3>
                    <span className="text-sm text-gray-500">
                      Total: ₹{totalPurchases.toLocaleString()}
                    </span>
                  </div>
                  
                  {purchaseRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Record Details
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
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {purchaseRecords.slice(0, 10).map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{record.record_number}</div>
                                    <div className="text-sm text-gray-500">{formatDateTime(record.record_date)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {record.purchase_record_items.slice(0, 2).map((item, index) => (
                                    <div key={index}>
                                      {item.product_name} - {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                                    </div>
                                  ))}
                                  {record.purchase_record_items.length > 2 && (
                                    <div className="text-sm text-gray-500">
                                      +{record.purchase_record_items.length - 2} more items
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{record.total_amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No purchase records found for this supplier.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                    <span className="text-sm text-gray-500">
                      Total Paid: ₹{totalPaymentsMade.toLocaleString()}
                    </span>
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
                              Mode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.slice(0, 10).map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDateTime(payment.payment_date)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {payment.reference_number || 'No reference'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {payment.type === 'received' ? '+' : '-'}₹{payment.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">{payment.type}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getModeDisplay(payment.mode)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No payment records found for this supplier.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                Financial Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Credit Limit:</span>
                  <span className="text-sm font-medium text-gray-900">₹{supplierData.credit_limit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Outstanding:</span>
                  <span className="text-sm font-medium text-red-600">₹{supplierData.current_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Available Credit:</span>
                  <span className="text-sm font-medium text-green-600">₹{availableCredit.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-sm text-gray-500">Payment Terms:</span>
                  <span className="text-sm font-medium text-gray-900">{supplierData.payment_terms} days</span>
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
                <span className="text-sm text-gray-500">Total Purchases:</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{totalPurchases.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Purchase Records:</span>
                <span className="text-sm font-medium text-gray-900">
                  {purchaseRecords.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Payments:</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{totalPaymentsMade.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Payment Records:</span>
                <span className="text-sm font-medium text-gray-900">
                  {payments.length}
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
              <button
                onClick={() => navigate(`/suppliers/edit/${id}`)}
                className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Supplier
              </button>
              <button
                onClick={() => navigate('/record-purchase/new')}
                className="w-full bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
              >
                <Package className="h-4 w-4 mr-2" />
                New Purchase Record
              </button>
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplier;