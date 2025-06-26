import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Plus, FileText, Trash2, Eye, TrendingUp, TrendingDown, DollarSign, Receipt, ChevronDown, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPayments, deletePayment } from '../../lib/api';
import PaymentFormModal from '../../components/modals/PaymentFormModal';

interface Payment {
  id: string;
  type: string;
  amount: number;
  payment_date: string;
  party_id: string | null;
  party_type: string | null;
  party_name: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reference_number: string | null;
  mode: string;
  status: string;
  notes: string | null;
  proof_attachment_url?: string | null;
  proof_attachment_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [modalPaymentType, setModalPaymentType] = useState<'received' | 'made' | 'expense'>('received');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await getPayments();
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await deletePayment(id);
        setPayments(prev => prev.filter(payment => payment.id !== id));
        toast.success('Payment record deleted successfully');
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment record');
      }
    }
  };

  const handleNewPayment = (type: 'received' | 'made' | 'expense') => {
    setModalPaymentType(type);
    setShowModal(true);
    setShowDropdown(false);
  };

  const handleModalSave = () => {
    loadPayments(); // Reload payments after saving
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.party_name && payment.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.reference_number && payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = selectedType === 'all' || payment.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      const paymentDate = new Date(payment.payment_date).toISOString().split('T')[0];
      matchesDate = 
        paymentDate >= dateRange.from &&
        paymentDate <= dateRange.to;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalReceived = payments
    .filter(p => p.type === 'received' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.type === 'made' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpenses = payments
    .filter(p => p.type === 'expense' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'made':
        return 'bg-blue-100 text-blue-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
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
      default:
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        </div>
        
        {/* New Payment Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Payment
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleNewPayment('received')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DollarSign className="h-4 w-4 mr-3 text-green-600" />
                  Payment Received
                </button>
                <button
                  onClick={() => handleNewPayment('made')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CreditCard className="h-4 w-4 mr-3 text-blue-600" />
                  Payment Made
                </button>
                <button
                  onClick={() => handleNewPayment('expense')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Receipt className="h-4 w-4 mr-3 text-red-600" />
                  Record Expense
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Received</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalReceived.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-800">{pendingPayments}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="h-5 w-5" />
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
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="received">Received</option>
              <option value="made">Made</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            placeholder="From date"
          />
          <span className="text-gray-500 self-center">to</span>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            placeholder="To date"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount & Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode & Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        {payment.type === 'received' ? (
                          <DollarSign className="h-5 w-5" />
                        ) : payment.type === 'made' ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <Receipt className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-4">
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {payment.type === 'received' ? '+' : '-'}₹{payment.amount.toLocaleString()}
                    </div>
                    <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getTypeColor(payment.type)}`}>
                      {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.party_name || 'N/A'}
                    </div>
                    {payment.party_type && (
                      <div className="text-sm text-gray-500 capitalize">
                        {payment.party_type}
                      </div>
                    )}
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
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-900">
                        {getModeDisplay(payment.mode)}
                      </div>
                      {payment.proof_attachment_url && (
                        <div title={`Proof attached: ${payment.proof_attachment_name || 'File'}`}>
                          <Paperclip className="h-3 w-3 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
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
                      <button 
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Records Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {payments.length === 0 
                ? "Get started by recording your first payment transaction."
                : "No payments match your current search and filter criteria."
              }
            </p>
            {payments.length === 0 && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => handleNewPayment('received')}
                  className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Record Payment Received
                </button>
                <button
                  onClick={() => handleNewPayment('made')}
                  className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Record Payment Made
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentType={modalPaymentType}
        onSave={handleModalSave}
      />

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Payment Management Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Payment Received:</strong> Record money received from customers for sales orders</li>
                <li><strong>Payment Made:</strong> Record money paid to suppliers for purchase orders</li>
                <li><strong>Expenses:</strong> Record business expenses like transportation, commission, utilities, etc.</li>
                <li>All payment records are automatically included in the general ledger</li>
                <li>Use date range filters to analyze payments for specific periods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
