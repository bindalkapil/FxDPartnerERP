import React, { useState } from 'react';
import { CreditCard, Search, Filter, Plus, FileText, Trash2, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  type: 'received' | 'made';
  amount: number;
  party: string;
  reference: string;
  mode: 'cash' | 'bank' | 'upi';
  status: 'completed' | 'pending' | 'failed';
  notes: string;
}

const mockPayments: Payment[] = [
  {
    id: 'PAY001',
    date: '2025-06-18 10:30 AM',
    type: 'received',
    amount: 25000,
    party: 'Fresh Mart',
    reference: 'SO-2025-001',
    mode: 'bank',
    status: 'completed',
    notes: 'Payment for order SO-2025-001'
  },
  {
    id: 'PAY002',
    date: '2025-06-18 11:45 AM',
    type: 'made',
    amount: 35000,
    party: 'Green Farms',
    reference: 'PO-2025-001',
    mode: 'bank',
    status: 'pending',
    notes: 'Payment for apple delivery'
  },
  {
    id: 'PAY003',
    date: '2025-06-18 02:15 PM',
    type: 'received',
    amount: 15000,
    party: 'City Supermarket',
    reference: 'SO-2025-002',
    mode: 'upi',
    status: 'completed',
    notes: 'Partial payment for order SO-2025-002'
  }
];

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = selectedType === 'all' || payment.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalReceived = payments
    .filter(p => p.type === 'received' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.type === 'made' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Payment
        </button>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Received</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalReceived}</p>
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
              <p className="text-2xl font-bold text-gray-800">₹{totalPaid}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-800">
                {payments.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Failed Transactions</p>
              <p className="text-2xl font-bold text-gray-800">
                {payments.filter(p => p.status === 'failed').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <CreditCard className="h-5 w-5" />
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
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{payment.id}</div>
                        <div className="text-sm text-gray-500">{payment.date}</div>
                        <div className="text-sm text-gray-500">Ref: {payment.reference}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {payment.type === 'received' ? '+' : '-'}₹{payment.amount}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{payment.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.party}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                      {payment.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
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
                      <button className="text-red-600 hover:text-red-900">
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
          <div className="py-6 text-center text-gray-500">
            No payments found.
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Record New Payment
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Payment Type
                          </label>
                          <select
                            id="type"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="received">Payment Received</option>
                            <option value="made">Payment Made</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Amount
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              id="amount"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="party" className="block text-sm font-medium text-gray-700">
                          Party Name
                        </label>
                        <input
                          type="text"
                          id="party"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                            Reference Number
                          </label>
                          <input
                            type="text"
                            id="reference"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                            Payment Mode
                          </label>
                          <select
                            id="mode"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="upi">UPI</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Add any additional notes..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;