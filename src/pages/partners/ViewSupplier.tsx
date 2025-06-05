import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, MapPin, Phone, Mail, CreditCard, Package } from 'lucide-react';

const ViewSupplier: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, this would be fetched from an API
  const supplierData = {
    id: 'SUP001',
    name: 'Green Farms',
    contactPerson: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@greenfarms.com',
    address: '123, Farm Road, Bangalore',
    gstNumber: 'GST123456789',
    panNumber: 'ABCDE1234F',
    bankName: 'State Bank of India',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0012345',
    paymentTerms: 30,
    creditLimit: 100000,
    outstandingBalance: 25000,
    products: ['Apples', 'Oranges', 'Bananas'],
    status: 'active',
    transactions: [
      {
        date: '2025-06-18',
        type: 'Purchase',
        amount: 50000,
        reference: 'PO001'
      },
      {
        date: '2025-06-17',
        type: 'Payment',
        amount: 25000,
        reference: 'PAY001'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="text-gray-600 hover:text-gray-900"
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
                <p className="mt-1 text-sm text-gray-900">{supplierData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.contactPerson}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.phone}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.email}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  {supplierData.address}
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
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{supplierData.creditLimit}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Outstanding Balance</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{supplierData.outstandingBalance}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">{supplierData.paymentTerms} days</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.bankName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Account Number</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.accountNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.ifscCode}</p>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">GST Number</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.gstNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                <p className="mt-1 text-sm text-gray-900">{supplierData.panNumber}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>
            <div className="flex flex-wrap gap-2">
              {supplierData.products.map((product, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  <Package className="h-4 w-4 mr-1" />
                  {product}
                </span>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierData.transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{transaction.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplier;