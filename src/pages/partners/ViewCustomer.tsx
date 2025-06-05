import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

const ViewCustomer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, this would be fetched from an API
  const customerData = {
    id: 'CUST001',
    name: 'ABC Retail Store',
    type: 'Retailer',
    contact: '9876543210',
    email: 'abc@retail.com',
    address: '123 Market Street, City Center',
    creditLimit: 50000,
    currentBalance: 15000,
    status: 'active',
    lastTransaction: '2025-06-18',
    paymentHistory: [
      {
        date: '2025-06-18',
        amount: 25000,
        type: 'payment',
        reference: 'PAY001'
      },
      {
        date: '2025-06-17',
        amount: 40000,
        type: 'invoice',
        reference: 'INV001'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="text-gray-600 hover:text-gray-900"
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
                <p className="mt-1 text-sm text-gray-900">{customerData.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.contact}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.email}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  {customerData.address}
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
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{customerData.creditLimit}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{customerData.currentBalance}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                  customerData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {customerData.status.charAt(0).toUpperCase() + customerData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment History</h2>
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
                  {customerData.paymentHistory.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.type === 'payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.amount}
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

export default ViewCustomer;