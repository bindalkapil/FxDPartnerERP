import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package2, ArrowLeft, FileText, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPurchaseRecord } from '../../lib/api';

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
      case 'completed':
        return 'Completed';
      case 'draft':
        return 'Draft';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        {orderData.status === 'draft' && (
          <button
            onClick={() => navigate(`/record-purchase/edit/${id}`)}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Record
          </button>
        )}
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
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    {orderData.pricing_model === 'commission' ? (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                      </>
                    ) : null}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.purchase_record_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_weight} kg
                      </td>
                      {orderData.pricing_model === 'commission' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.market_price || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.commission || 0}%
                          </td>
                        </>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.unit_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={orderData.pricing_model === 'commission' ? 8 : 6} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
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
              <div className="space-y-2">
                {orderData.purchase_record_costs.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700 font-medium">{cost.name}</span>
                      <span className="text-gray-500">
                        {cost.amount} {getCostTypeDisplay(cost.type)}
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      ₹{cost.calculated_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Additional Costs Total:</span>
                  <span className="text-gray-900">₹{orderData.additional_costs_total.toFixed(2)}</span>
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

          {/* Total Amount */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span className="text-gray-900">₹{orderData.items_subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Additional Costs:</span>
                  <span className="text-gray-900">-₹{orderData.additional_costs_total.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">₹{orderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRecordPurchase;