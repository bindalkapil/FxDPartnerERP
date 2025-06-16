import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, DollarSign, Smartphone, Building, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FileUploadComponent from '../ui/FileUploadComponent';

export interface PaymentMethod {
  id: string;
  type: 'credit' | 'cash' | 'upi' | 'bank_transfer' | 'credit_increase';
  amount: number;
  reference_number?: string;
  proof_file?: File;
  remarks?: string;
}

interface MultiplePaymentSectionProps {
  orderTotal: number;
  customerId: string;
  customerCreditLimit: number;
  customerCurrentBalance: number;
  paymentMethods: PaymentMethod[];
  onPaymentMethodsChange: (methods: PaymentMethod[]) => void;
  onValidationChange: (isValid: boolean, message?: string) => void;
}

const MultiplePaymentSection: React.FC<MultiplePaymentSectionProps> = ({
  orderTotal,
  customerId,
  customerCreditLimit,
  customerCurrentBalance,
  paymentMethods,
  onPaymentMethodsChange,
  onValidationChange
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);

  // No default credit payment initialization needed
  // Credit amount will be calculated automatically in the summary

  // Validate payments whenever they change
  useEffect(() => {
    validatePayments();
  }, [paymentMethods, orderTotal, customerCreditLimit, customerCurrentBalance]);

  const validatePayments = () => {
    const totalPaid = paymentMethods
      .filter(method => method.type !== 'credit_increase')
      .reduce((sum, method) => sum + method.amount, 0);

    const creditAmount = orderTotal - totalPaid; // Credit is the remaining amount
    const creditIncreaseAmount = paymentMethods
      .filter(method => method.type === 'credit_increase')
      .reduce((sum, method) => sum + method.amount, 0);
    
    const effectiveCreditLimit = customerCreditLimit + creditIncreaseAmount;
    const availableCredit = effectiveCreditLimit - customerCurrentBalance;

    // Check credit limit (including temporary increase)
    if (creditAmount > availableCredit) {
      onValidationChange(false, `Credit amount (₹${creditAmount.toFixed(2)}) exceeds available credit limit (₹${availableCredit.toFixed(2)}) including temporary increase`);
      return;
    }

    // Check required fields for each payment method
    for (const method of paymentMethods) {
      if (method.amount <= 0) {
        onValidationChange(false, 'All payment amounts must be greater than 0');
        return;
      }

      if (method.type === 'upi' || method.type === 'bank_transfer') {
        if (!method.reference_number && !method.proof_file) {
          onValidationChange(false, `${method.type.toUpperCase()} payment requires either reference number or proof upload`);
          return;
        }
      }

      if (method.type === 'credit_increase' && !method.remarks) {
        onValidationChange(false, 'Credit increase requires remarks explaining the reason for temporary limit increase');
        return;
      }
    }

    onValidationChange(true);
  };

  const addPaymentMethod = (type: PaymentMethod['type']) => {
    const remainingAmount = orderTotal - paymentMethods
      .filter(method => method.type !== 'credit_increase')
      .reduce((sum, method) => sum + method.amount, 0);

    const newPayment: PaymentMethod = {
      id: `payment_${Date.now()}`,
      type,
      amount: type === 'credit_increase' ? 0 : Math.max(0, remainingAmount)
    };

    // If adding non-credit payment, reduce credit payment amount
    if (type !== 'credit' && type !== 'credit_increase') {
      const updatedMethods = paymentMethods.map(method => {
        if (method.type === 'credit') {
          return {
            ...method,
            amount: Math.max(0, method.amount - newPayment.amount)
          };
        }
        return method;
      });
      onPaymentMethodsChange([...updatedMethods, newPayment]);
    } else {
      onPaymentMethodsChange([...paymentMethods, newPayment]);
    }

    setShowAddPayment(false);
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    const updatedMethods = paymentMethods.map(method =>
      method.id === id ? { ...method, ...updates } : method
    );
    onPaymentMethodsChange(updatedMethods);
  };

  const removePaymentMethod = (id: string) => {
    const methodToRemove = paymentMethods.find(m => m.id === id);
    if (!methodToRemove) return;

    const updatedMethods = paymentMethods.filter(method => method.id !== id);

    // If removing a non-credit payment, add its amount back to credit
    if (methodToRemove.type !== 'credit' && methodToRemove.type !== 'credit_increase') {
      const creditMethod = updatedMethods.find(m => m.type === 'credit');
      if (creditMethod) {
        creditMethod.amount += methodToRemove.amount;
      }
    }

    onPaymentMethodsChange(updatedMethods);
  };

  const getPaymentIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'credit_increase': return <TrendingUp className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit': return 'Credit';
      case 'cash': return 'Cash';
      case 'upi': return 'UPI';
      case 'bank_transfer': return 'Bank Transfer';
      case 'credit_increase': return 'Credit Increase';
      default: return type;
    }
  };

  const totalPaid = paymentMethods
    .filter(method => method.type !== 'credit_increase')
    .reduce((sum, method) => sum + method.amount, 0);

  const creditAmount = orderTotal - totalPaid; // Credit is the remaining amount
  const creditIncreaseAmount = paymentMethods
    .filter(method => method.type === 'credit_increase')
    .reduce((sum, method) => sum + method.amount, 0);
  
  const effectiveCreditLimit = customerCreditLimit + creditIncreaseAmount;
  const availableCredit = effectiveCreditLimit - customerCurrentBalance;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Payment Methods</h2>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getPaymentIcon(method.type)}
                <span className="font-medium text-gray-900">
                  {getPaymentLabel(method.type)}
                  {method.type === 'credit' && ' (Default)'}
                </span>
              </div>
              {method.type !== 'credit' && (
                <button
                  type="button"
                  onClick={() => removePaymentMethod(method.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                  {method.type === 'credit' && <span className="text-xs text-gray-500 ml-1">(Auto-calculated)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={method.amount}
                    onChange={(e) => updatePaymentMethod(method.id, { amount: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className={`block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      method.type === 'credit' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="0.00"
                    readOnly={method.type === 'credit'}
                    disabled={method.type === 'credit'}
                  />
                </div>
              </div>

              {/* Reference Number for UPI/Bank Transfer */}
              {(method.type === 'upi' || method.type === 'bank_transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={method.reference_number || ''}
                    onChange={(e) => updatePaymentMethod(method.id, { reference_number: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter reference number"
                  />
                </div>
              )}

              {/* Remarks for Credit Increase */}
              {method.type === 'credit_increase' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={method.remarks || ''}
                    onChange={(e) => updatePaymentMethod(method.id, { remarks: e.target.value })}
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Reason for credit limit increase"
                  />
                </div>
              )}
            </div>

            {/* File Upload for UPI/Bank Transfer */}
            {(method.type === 'upi' || method.type === 'bank_transfer') && (
              <div className="mt-4">
                <FileUploadComponent
                  label="Payment Proof"
                  onFileSelect={(file) => updatePaymentMethod(method.id, { proof_file: file })}
                  onFileRemove={() => updatePaymentMethod(method.id, { proof_file: undefined })}
                  selectedFile={method.proof_file}
                  accept="image/*"
                  maxSize={5}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Payment Method */}
      {!showAddPayment ? (
        <button
          type="button"
          onClick={() => setShowAddPayment(true)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => addPaymentMethod('cash')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Cash
            </button>
            <button
              type="button"
              onClick={() => addPaymentMethod('upi')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Smartphone className="h-4 w-4 mr-1" />
              UPI
            </button>
            <button
              type="button"
              onClick={() => addPaymentMethod('bank_transfer')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Building className="h-4 w-4 mr-1" />
              Bank Transfer
            </button>
            <button
              type="button"
              onClick={() => addPaymentMethod('credit_increase')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Credit Increase
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPayment(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Total:</span>
            <span className="font-medium">₹{orderTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Payments:</span>
            <span className="font-medium">₹{totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Credit Amount:</span>
            <span className={`font-medium ${creditAmount > 0 ? 'text-blue-600' : 'text-green-600'}`}>
              ₹{creditAmount.toFixed(2)}
            </span>
          </div>
          
          {/* Credit Limit Information */}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Credit Limit:</span>
              <span className="font-medium">₹{customerCreditLimit.toFixed(2)}</span>
            </div>
            {creditIncreaseAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Increase:</span>
                  <span className="font-medium text-orange-600">+₹{creditIncreaseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effective Credit Limit:</span>
                  <span className="font-medium text-green-600">₹{effectiveCreditLimit.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Current Outstanding:</span>
              <span className="font-medium">₹{customerCurrentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Credit:</span>
              <span className="font-medium">₹{availableCredit.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Credit Increase Warning */}
          {creditIncreaseAmount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-xs text-orange-800">
                  <p className="font-medium">Temporary Credit Increase</p>
                  <p>This credit increase of ₹{creditIncreaseAmount.toFixed(2)} is temporary and applies only to this order. The customer's permanent credit limit remains ₹{customerCreditLimit.toFixed(2)}.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplePaymentSection;
