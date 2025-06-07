import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomer } from '../../lib/api';

interface CustomerData {
  id: string;
  name: string;
  customer_type: string;
  contact: string;
  email: string;
  address: string;
  gst_number: string | null;
  pan_number: string | null;
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const ViewCustomer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) return;
    
    try {
      const data = await getCustomer(id);
      setCustomerData(data);
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

  const getCustomerTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading customer data...</div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Customer not found</div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-800">View Customer</h1>
          </div>
        </div>
        <button
          onClick={() => navigate(`/customers/edit/${id}`)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
        >
          Edit Customer
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Customer Name</label>
                <p className="mt-1 text-sm text-gray-900">{customerData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Customer Type</label>
                <p className="mt-1 text-sm text-gray-900">{getCustomerTypeDisplay(customerData.customer_type)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.contact || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.email || 'Not provided'}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.address || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Credit Limit</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{customerData.credit_limit.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{customerData.current_balance.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">{customerData.payment_terms} days</p>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          {(customerData.gst_number || customerData.pan_number) && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">GST Number</label>
                  <p className="mt-1 text-sm text-gray-900">{customerData.gst_number || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                  <p className="mt-1 text-sm text-gray-900">{customerData.pan_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {customerData.notes && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{customerData.notes}</p>
              </div>
            </div>
          )}

          {/* Status and Timestamps */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                  customerData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {customerData.status.charAt(0).toUpperCase() + customerData.status.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(customerData.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(customerData.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Payment History Placeholder */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
            <div className="bg-gray-50 rounded-md p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-sm text-gray-500">
                Transaction history will appear here once sales orders and payments are recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomer;