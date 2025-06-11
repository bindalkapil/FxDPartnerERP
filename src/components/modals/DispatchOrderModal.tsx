import React, { useState } from 'react';
import { X, Truck, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface DispatchOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onDispatch: (dispatchData: any) => Promise<void>;
}

interface LoadedItem {
  id: string;
  productName: string;
  skuCode: string;
  originalQuantity: number;
  loadedQuantity: number;
  unitType: string;
}

const DispatchOrderModal: React.FC<DispatchOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onDispatch
}) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [loadedItems, setLoadedItems] = useState<LoadedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (order && order.sales_order_items) {
      setLoadedItems(
        order.sales_order_items.map((item: any) => ({
          id: item.id,
          productName: item.product_name,
          skuCode: item.sku_code,
          originalQuantity: item.quantity,
          loadedQuantity: item.quantity, // Default to original quantity
          unitType: item.unit_type
        }))
      );
    }
  }, [order]);

  const handleLoadedQuantityChange = (itemId: string, quantity: number) => {
    setLoadedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, loadedQuantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate loaded quantities
    const hasInvalidQuantity = loadedItems.some(item => 
      item.loadedQuantity < 0 || item.loadedQuantity > item.originalQuantity
    );
    
    if (hasInvalidQuantity) {
      toast.error('Loaded quantity cannot be negative or exceed original quantity');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const dispatchData = {
        vehicle_number: vehicleNumber.trim() || null,
        driver_name: driverName.trim() || null,
        driver_contact: driverContact.trim() || null,
        delivery_location_confirmed: true,
        items: loadedItems.map(item => ({
          id: item.id,
          final_loaded_quantity: item.loadedQuantity
        }))
      };

      await onDispatch(dispatchData);
      toast.success('Order dispatched successfully!');
      onClose();
    } catch (error) {
      console.error('Error dispatching order:', error);
      toast.error('Failed to dispatch order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalLoadedQuantity = () => {
    return loadedItems.reduce((sum, item) => sum + item.loadedQuantity, 0);
  };

  const getTotalOriginalQuantity = () => {
    return loadedItems.reduce((sum, item) => sum + item.originalQuantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dispatch Order</h2>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order?.order_number} - {order?.customer?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Vehicle and Driver Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle & Driver Details
                <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., KA01AB1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver's name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Driver Contact
                  </label>
                  <input
                    type="tel"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    placeholder="Driver's phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Loaded Quantities */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Loaded Quantities</h3>
                <div className="text-sm text-gray-600">
                  Total: {getTotalLoadedQuantity()} / {getTotalOriginalQuantity()} units
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loaded Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.skuCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.unitType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.originalQuantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max={item.originalQuantity}
                              step="0.01"
                              value={item.loadedQuantity}
                              onChange={(e) => handleLoadedQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Dispatching...' : 'Mark as Dispatched'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchOrderModal;