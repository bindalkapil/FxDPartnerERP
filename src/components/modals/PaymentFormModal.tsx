import React, { useState, useEffect } from 'react';
import { X, CreditCard, User, Calendar, FileText, DollarSign, Building, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPayment, getCustomers, getSuppliers, getSalesOrders, getPurchaseRecords } from '../../lib/api';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'received' | 'made' | 'expense';
  onSave: () => void;
}

interface Customer {
  id: string;
  name: string;
  customer_type: string;
}

interface Supplier {
  id: string;
  company_name: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer: {
    name: string;
  };
  total_amount: number;
}

interface PurchaseRecord {
  id: string;
  record_number: string;
  supplier: string;
  total_amount: number;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);

  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 16),
    partyId: '',
    referenceId: '',
    mode: 'cash',
    status: 'completed',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      resetForm();
    }
  }, [isOpen, paymentType]);

  const loadInitialData = async () => {
    try {
      if (paymentType === 'received') {
        const [customersData, salesOrdersData] = await Promise.all([
          getCustomers(),
          getSalesOrders()
        ]);
        setCustomers(customersData || []);
        setSalesOrders(salesOrdersData || []);
      } else if (paymentType === 'made') {
        const [suppliersData, purchaseRecordsData] = await Promise.all([
          getSuppliers(),
          getPurchaseRecords()
        ]);
        setSuppliers(suppliersData || []);
        setPurchaseRecords(purchaseRecordsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load required data');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      paymentDate: new Date().toISOString().slice(0, 16),
      partyId: '',
      referenceId: '',
      mode: 'cash',
      status: 'completed',
      notes: ''
    });
  };

  const getModalTitle = () => {
    switch (paymentType) {
      case 'received':
        return 'Record Payment Received';
      case 'made':
        return 'Record Payment Made';
      case 'expense':
        return 'Record Expense';
      default:
        return 'Record Payment';
    }
  };

  const getModalIcon = () => {
    switch (paymentType) {
      case 'received':
        return <DollarSign className="h-6 w-6 text-green-600" />;
      case 'made':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'expense':
        return <Receipt className="h-6 w-6 text-red-600" />;
      default:
        return <CreditCard className="h-6 w-6 text-green-600" />;
    }
  };

  const getPartyLabel = () => {
    switch (paymentType) {
      case 'received':
        return 'Customer';
      case 'made':
        return 'Supplier';
      case 'expense':
        return 'Expense Category';
      default:
        return 'Party';
    }
  };

  const getReferenceLabel = () => {
    switch (paymentType) {
      case 'received':
        return 'Sales Order (Optional)';
      case 'made':
        return 'Purchase Record (Optional)';
      case 'expense':
        return 'Reference (Optional)';
      default:
        return 'Reference';
    }
  };

  const getPartyOptions = () => {
    switch (paymentType) {
      case 'received':
        return customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          type: customer.customer_type
        }));
      case 'made':
        return suppliers.map(supplier => ({
          id: supplier.id,
          name: supplier.company_name,
          type: 'supplier'
        }));
      case 'expense':
        return [
          { id: 'transport', name: 'Transportation', type: 'expense' },
          { id: 'commission', name: 'Commission', type: 'expense' },
          { id: 'utilities', name: 'Utilities', type: 'expense' },
          { id: 'rent', name: 'Rent', type: 'expense' },
          { id: 'maintenance', name: 'Maintenance', type: 'expense' },
          { id: 'office_supplies', name: 'Office Supplies', type: 'expense' },
          { id: 'other', name: 'Other', type: 'expense' }
        ];
      default:
        return [];
    }
  };

  const getReferenceOptions = () => {
    switch (paymentType) {
      case 'received':
        return salesOrders.map(order => ({
          id: order.id,
          label: `${order.order_number} - ${order.customer.name} (₹${order.total_amount.toLocaleString()})`,
          amount: order.total_amount
        }));
      case 'made':
        return purchaseRecords.map(record => ({
          id: record.id,
          label: `${record.record_number} - ${record.supplier} (₹${record.total_amount.toLocaleString()})`,
          amount: record.total_amount
        }));
      default:
        return [];
    }
  };

  const handleReferenceChange = (referenceId: string) => {
    setFormData(prev => ({ ...prev, referenceId }));
    
    // Auto-fill amount if reference is selected
    if (referenceId && paymentType !== 'expense') {
      const referenceOptions = getReferenceOptions();
      const selectedReference = referenceOptions.find(ref => ref.id === referenceId);
      if (selectedReference && !formData.amount) {
        setFormData(prev => ({ ...prev, amount: selectedReference.amount.toString() }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentType !== 'expense' && !formData.partyId) {
      toast.error(`Please select a ${getPartyLabel().toLowerCase()}`);
      return;
    }

    setLoading(true);

    try {
      // Get party name
      let partyName = '';
      let partyType = '';
      
      if (paymentType === 'received') {
        const customer = customers.find(c => c.id === formData.partyId);
        partyName = customer?.name || '';
        partyType = 'customer';
      } else if (paymentType === 'made') {
        const supplier = suppliers.find(s => s.id === formData.partyId);
        partyName = supplier?.company_name || '';
        partyType = 'supplier';
      } else {
        const expenseCategory = getPartyOptions().find(p => p.id === formData.partyId);
        partyName = expenseCategory?.name || '';
        partyType = '';
      }

      // Get reference details
      let referenceNumber = '';
      let referenceType = '';
      
      if (formData.referenceId) {
        if (paymentType === 'received') {
          const salesOrder = salesOrders.find(so => so.id === formData.referenceId);
          referenceNumber = salesOrder?.order_number || '';
          referenceType = 'sales_order';
        } else if (paymentType === 'made') {
          const purchaseRecord = purchaseRecords.find(pr => pr.id === formData.referenceId);
          referenceNumber = purchaseRecord?.record_number || '';
          referenceType = 'purchase_record';
        }
      }

      const paymentData = {
        type: paymentType,
        amount: parseFloat(formData.amount),
        payment_date: formData.paymentDate,
        party_id: paymentType === 'expense' ? null : formData.partyId,
        party_type: partyType || null,
        party_name: partyName,
        reference_id: formData.referenceId || null,
        reference_type: referenceType || null,
        reference_number: referenceNumber,
        mode: formData.mode,
        status: formData.status,
        notes: formData.notes || null
      };

      await createPayment(paymentData);
      
      toast.success(`${getModalTitle()} recorded successfully!`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                  {getModalIcon()}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between" id="modal-title">
                    {getModalTitle()}
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="datetime-local"
                          value={formData.paymentDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Party Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getPartyLabel()} {paymentType !== 'expense' && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {paymentType === 'expense' ? (
                            <Receipt className="h-4 w-4 text-gray-400" />
                          ) : paymentType === 'received' ? (
                            <User className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Building className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <select
                          value={formData.partyId}
                          onChange={(e) => setFormData(prev => ({ ...prev, partyId: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required={paymentType !== 'expense'}
                        >
                          <option value="">Select {getPartyLabel().toLowerCase()}</option>
                          {getPartyOptions().map(party => (
                            <option key={party.id} value={party.id}>
                              {party.name} {party.type !== 'expense' && `(${party.type})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Reference Selection */}
                    {paymentType !== 'expense' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {getReferenceLabel()}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FileText className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            value={formData.referenceId}
                            onChange={(e) => handleReferenceChange(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Select reference (optional)</option>
                            {getReferenceOptions().map(ref => (
                              <option key={ref.id} value={ref.id}>
                                {ref.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Payment Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={formData.mode}
                        onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentFormModal;