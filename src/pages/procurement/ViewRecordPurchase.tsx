import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package2, ArrowLeft, FileText, Pencil, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPurchaseRecord } from '../../lib/api';
import PurchaseRecordClosureModal from '../../components/modals/PurchaseRecordClosureModal';

interface PurchaseRecordData {
  id: string;
  record_number: string;
  supplier: string;
  record_date: string;
  arrival_timestamp: string;
  pricing_model: string;
  default_commission: number | null;
  payment_terms: number | null;
  items_subtotal: number;
  additional_costs_total: number;
  total_amount: number;
  status: string;
  notes: string | null;
  purchase_record_items: Array<{
    id: string;
    product_name: string;
    sku_code: string;
    category: string;
    quantity: number;
    unit_type: string;
    total_weight: number;
    market_price: number | null;
    commission: number | null;
    unit_price: number;
    total: number;
  }>;
  purchase_record_costs: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    calculated_amount: number;
  }>;
}

const ViewRecordPurchase: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<PurchaseRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closureModal, setClosureModal] = useState<{
    isOpen: boolean;
    recordId: string;
    currentStatus: string;
    recordNumber: string;
  }>({
    isOpen: false,
    recordId: '',
    currentStatus: '',
    recordNumber: ''
  });

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;
    
    try {
      const data = await getPurchaseRecord(id);
      setOrderData(data);
    } catch (error) {
      console.error('Error loading purchase record:', error);
      toast.error('Failed to load purchase record data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'partial_closure':
        return 'Partial Closure';
      case 'full_closure':
        return 'Full Closure';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'partial_closure':
        return 'bg-yellow-100 text-yellow-800';
      case 'full_closure':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenClosureModal = () => {
    if (orderData) {
      setClosureModal({
        isOpen: true,
        recordId: orderData.id,
        currentStatus: orderData.status,
        recordNumber: orderData.record_number
      });
    }
  };

  const handleCloseClosureModal = () => {
    setClosureModal({
      isOpen: false,
      recordId: '',
      currentStatus: '',
      recordNumber: ''
    });
  };

  const handleStatusUpdated = () => {
    loadOrderData();
  };

  const getCostTypeDisplay = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Fixed (₹)';
      case 'percentage':
        return 'Percentage (%)';
      case 'per_box':
        return 'Per Box (₹/box)';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading purchase record...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Purchase record not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/record-purchase')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Package2 className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">View Purchase Record</h1>
          </div>
        </div>
        <div className="flex space-x-3">
          {orderData.status === 'partial_closure' && (
            <button
              onClick={() => navigate(`/record-purchase/edit/${id}`)}
              className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit Record
            </button>
          )}
          {orderData.status !== 'cancelled' && (
            <button
              onClick={handleOpenClosureModal}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage Closure
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Record Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Record Number</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.record_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Record Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(orderData.record_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Arrival Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(orderData.arrival_timestamp)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.payment_terms} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Pricing Model</label>
                <p className="mt-1 text-sm text-gray-900">
                  {orderData.pricing_model === 'commission' ? 'Commission Sale' : 'Fixed Price'}
                </p>
              </div>
              {orderData.pricing_model === 'commission' && orderData.default_commission && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Default Commission</label>
                  <p className="mt-1 text-sm text-gray-900">{orderData.default_commission}%</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(orderData.status)}`}>
                  {getStatusDisplay(orderData.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity & Weight
                    </th>
                    {orderData.pricing_model === 'commission' ? (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Price (₹)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission (%)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price (₹)
                        </th>
                      </>
                    ) : (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price (₹)
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.purchase_record_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">SKU: {item.sku_code}</div>
                          <div className="text-sm text-gray-500">Category: {item.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}</div>
                          <div className="text-sm text-gray-500">Total Weight: {item.total_weight} kg</div>
                        </div>
                      </td>
                      {orderData.pricing_model === 'commission' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{(item.market_price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(item.commission || 0).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.unit_price.toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.unit_price.toFixed(2)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={orderData.pricing_model === 'commission' ? 5 : 3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                      Items Subtotal:
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      ₹{orderData.items_subtotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Costs */}
          {orderData.purchase_record_costs.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Costs</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {orderData.purchase_record_costs.map((cost, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700 min-w-[120px]">{cost.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {cost.amount} {getCostTypeDisplay(cost.type).split(' ')[1]}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({getCostTypeDisplay(cost.type)})
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{cost.calculated_amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Total Additional Costs:</span>
                      <span className="text-gray-900">₹{orderData.additional_costs_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {orderData.notes && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{orderData.notes}</p>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span className="text-gray-900 font-medium">₹{orderData.items_subtotal.toFixed(2)}</span>
                </div>
                
                {orderData.purchase_record_costs.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Less: Additional Costs:</span>
                    <span className="text-red-600 font-medium">-₹{orderData.additional_costs_total.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Final Total Amount:</span>
                  <span className="text-green-600">₹{orderData.total_amount.toFixed(2)}</span>
                </div>
                
                {orderData.pricing_model === 'commission' && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      * Commission-based pricing: Market price minus commission percentage
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closure Modal */}
      <PurchaseRecordClosureModal
        isOpen={closureModal.isOpen}
        onClose={handleCloseClosureModal}
        recordId={closureModal.recordId}
        currentStatus={closureModal.currentStatus}
        recordNumber={closureModal.recordNumber}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default ViewRecordPurchase;
