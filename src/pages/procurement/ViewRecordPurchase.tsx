import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package2, ArrowLeft, FileText, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrival } from '../../lib/api';

interface VehicleArrivalData {
  id: string;
  vehicle_number: string | null;
  supplier: string;
  arrival_time: string;
  status: string;
  notes: string | null;
  vehicle_arrival_items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      category: string;
    };
    sku: {
      id: string;
      code: string;
      unit_type: string;
    };
    quantity: number;
    total_weight: number;
    unit_type: string;
  }>;
}

const ViewRecordPurchase: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<VehicleArrivalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;
    
    try {
      const data = await getVehicleArrival(id);
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
      case 'po-created':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'po-created':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const orderNumber = `PO-${orderData.id.substring(0, 8).toUpperCase()}`;
  const totalAmount = 0; // Placeholder since pricing data isn't stored
  const pricingModel = 'commission'; // Default placeholder

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
        {orderData.status === 'po-created' && (
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
                <p className="mt-1 text-sm text-gray-900">{orderNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Record Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(orderData.arrival_time)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Arrival Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(orderData.arrival_time)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Vehicle Number</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.vehicle_number || 'Not Available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Pricing Model</label>
                <p className="mt-1 text-sm text-gray-900">
                  {pricingModel === 'commission' ? 'Commission Sale' : 'Fixed Price'}
                </p>
              </div>
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
                      Packaging Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.vehicle_arrival_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_type === 'box' ? 'Box/Crate' : 'Loose'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_weight} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {orderData.vehicle_arrival_items.reduce((sum, item) => sum + item.quantity, 0)} units
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {orderData.vehicle_arrival_items.reduce((sum, item) => sum + item.total_weight, 0)} kg
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Notes */}
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
              <div className="flex justify-between text-lg font-medium">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-gray-900">₹{totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Pricing information not available in current record
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRecordPurchase;