import React, { useState } from 'react';
import { X, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updatePurchaseRecordClosureStatus } from '../../lib/api';

interface PurchaseRecordClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  currentStatus: string;
  recordNumber: string;
  onStatusUpdated: () => void;
}

const PurchaseRecordClosureModal: React.FC<PurchaseRecordClosureModalProps> = ({
  isOpen,
  onClose,
  recordId,
  currentStatus,
  recordNumber,
  onStatusUpdated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');

  if (!isOpen) return null;

  const handleFullClosure = async () => {
    if (window.confirm('Are you sure you want to fully close this purchase record? This action cannot be undone.')) {
      setIsSubmitting(true);
      try {
        await updatePurchaseRecordClosureStatus(recordId, 'full_closure', closureNotes);
        toast.success('Purchase record has been fully closed');
        onStatusUpdated();
        onClose();
      } catch (error) {
        console.error('Error updating closure status:', error);
        toast.error('Failed to update closure status');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePartialClosure = async () => {
    setIsSubmitting(true);
    try {
      await updatePurchaseRecordClosureStatus(recordId, 'partial_closure');
      toast.success('Purchase record status updated to partial closure');
      onStatusUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating closure status:', error);
      toast.error('Failed to update closure status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Update Closure Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Record: <span className="font-medium">{recordNumber}</span>
            </p>
            <p className="text-sm text-gray-600">
              Current Status: <span className="font-medium capitalize">
                {currentStatus === 'partial_closure' ? 'Partial Closure' : currentStatus}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Partial Closure</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Record can still be edited but is treated as completed for ledger and finance management.
                  </p>
                  {currentStatus !== 'partial_closure' && (
                    <button
                      onClick={handlePartialClosure}
                      disabled={isSubmitting}
                      className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:bg-gray-400"
                    >
                      Set to Partial Closure
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">Full Closure</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Record cannot be edited anymore. This action is permanent.
                  </p>
                  
                  {currentStatus === 'partial_closure' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Closure Notes (Optional)
                      </label>
                      <textarea
                        value={closureNotes}
                        onChange={(e) => setClosureNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Add any notes about the closure..."
                      />
                      <button
                        onClick={handleFullClosure}
                        disabled={isSubmitting}
                        className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {isSubmitting ? 'Processing...' : 'Fully Close Record'}
                      </button>
                    </div>
                  )}
                  
                  {currentStatus === 'full_closure' && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      ✓ This record is already fully closed
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRecordClosureModal;
