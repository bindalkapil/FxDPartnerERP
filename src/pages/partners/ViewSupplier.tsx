import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, MapPin, Phone, Mail, CreditCard, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

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
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const ViewSupplier: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSupplierData();
    }
  }, [id]);

  const loadSupplierData = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSupplierData(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading supplier data...</div>
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
            <Users className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">View Supplier</h1>
          </div>
        </div>
        <button
          onClick={() => navigate(`/suppliers/edit/${id}`)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
        >
          Edit Supplier
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Company Name</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.contact_person || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.phone || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.email || 'Not provided'}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.address || 'Not provided'}
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
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{supplierData.credit_limit.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{supplierData.current_balance.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">{supplierData.payment_terms} days</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {(supplierData.bank_name || supplierData.account_number || supplierData.ifsc_code) && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="mt-1 text-sm text-gray-900">{supplierData.bank_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Number</label>
                  <p className="mt-1 text-sm text-gray-900">{supplierData.account_number || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                  <p className="mt-1 text-sm text-gray-900">{supplierData.ifsc_code || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tax Information */}
          {(supplierData.gst_number || supplierData.pan_number) && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">GST Number</label>
                  <p className="mt-1 text-sm text-gray-900">{supplierData.gst_number || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                  <p className="mt-1 text-sm text-gray-900">{supplierData.pan_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>
            <div className="flex flex-wrap gap-2">
              {supplierData.products && supplierData.products.length > 0 ? (
                supplierData.products.map((product, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    {product}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No products listed</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {supplierData.notes && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{supplierData.notes}</p>
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
                  supplierData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {supplierData.status.charAt(0).toUpperCase() + supplierData.status.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(supplierData.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(supplierData.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplier;