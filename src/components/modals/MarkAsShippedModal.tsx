import React, { useState, useEffect } from 'react';
import { X, Truck, User, Phone, MapPin, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSalesOrder, updateSalesOrderDispatchDetails } from '../../lib/api';

interface SalesOrderItem {
  id: string;
  product_name: string;
  sku_code: string;
  quantity: number;
  unit_type: string;
  unit_price: number;
  total_price: number;
}

interface SalesOrderData {
  id: string;
  order_number: string;
  customer: {
    name: string;
  };
  delivery_address: string | null;
  sales_order_items: SalesOrderItem[];
}

interface MarkAsShippedModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrderId: string;
  onConfirm: () => void;
}

interface ItemQuantity {
  id: string;
  original_quantity: number;
  final_loaded_quantity: number;
  difference: number;
}

const MarkAsShippedModal: React.FC<MarkAsShippedModalProps> = ({
  isOpen,
  onClose,
  salesOrderId,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<SalesOrderData | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [deliveryLocationConfirmed, setDeliveryLocationConfirmed] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<ItemQuantity[]>([]);

  useEffect(() => {
    if (isOpen && salesOrderId) {
      loadOrderData();
    }
  }, [isOpen, salesOrderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const data = await getSalesOrder(salesOrderId);
      setOrderData(data);
      
      // Initialize item quantities
      const quantities = data.sales_order_items.map((item: SalesOrderItem) => ({
        id: item.id,
        original_quantity: item.quantity,
        final_loaded_quantity: item.quantity,
        difference: 0
      }));
      setItemQuantities(quantities);
    } catch (error) {
      console.error('Error loading order data:', error);
      toast.error('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setItemQuantities(prev => prev.map(item => {
      if (item.id === itemId) {
        const difference = newQuantity - item.original_quantity;
        return {
          ...item,
          final_loaded_quantity: newQuantity,
          difference
        };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return;
    }
    
    if (!driverName.trim()) {
      toast.error('Driver name is required');
      return;
    }
    
    if (!driverContact.trim()) {
      toast.error('Driver contact is required');
      return;
    }

    // Validate quantities
    for (const item of itemQuantities) {
      if (item.final_loaded_quantity < 0) {
        toast.error('Final loaded quantity cannot be negative');
        return;
      }
    }

    try {
      setLoading(true);
      
      await updateSalesOrderDispatchDetails(salesOrderId, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_contact: driverContact,
        delivery_location_confirmed: deliveryLocationConfirmed,
        items: itemQuantities.map(item => ({
          id: item.id,
          final_loaded_quantity: item.final_loaded_quantity
        }))
      });

      toast.success('Order marked as shipped successfully!');
      onConfirm();
      onClose();
    } catch (error) {
      console.error('Error updating dispatch details:', error);
      toast.error('Failed to mark order as shipped');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setVehicleNumber('');
      setDriverName('');
      setDriverContact('');
      setDeliveryLocationConfirmed(false);
      setItemQuantities([]);
      setOrderData(null);
      onClose();
    }
  };

  const getTotalDifference = () => {
    return itemQuantities.reduce((sum, item) => sum + item.difference, 0);
  };

  const hasQuantityChanges = () => {
    return itemQuantities.some(item => item.difference !== 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between" id="modal-title">
                    Mark as Shipped
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </h3>
                  
                  {loading && !orderData ? (
                    <div className="mt-4 text-center">
                      <div className="text-gray-500">Loading order details...</div>
                    </div>
                  ) : orderData ? (
                    <div className="mt-4 space-y-6">
                      {/* Order Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Order Number:</span>
                            <span className="ml-2 font-medium">{orderData.order_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Customer:</span>
                            <span className="ml-2 font-medium">{orderData.customer.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle and Driver Details */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Vehicle & Driver Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Vehicle Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Truck className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="KA-01-AB-1234"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Driver Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="Driver name"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Driver Contact <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                value={driverContact}
                                onChange={(e) => setDriverContact(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="9876543210"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Location Confirmation */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Delivery Location</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{orderData.delivery_address}</p>
                              <label className="flex items-center mt-3">
                                <input
                                  type="checkbox"
                                  checked={deliveryLocationConfirmed}
                                  onChange={(e) => setDeliveryLocationConfirmed(e.target.checked)}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Confirm delivery location is correct
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Quantities */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Final Loaded Quantities</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Order Qty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Final Loaded Qty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Difference
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {orderData.sales_order_items.map((item, index) => {
                                const itemQty = itemQuantities.find(q => q.id === item.id);
                                return (
                                  <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                          <div className="text-sm text-gray-500">{item.sku_code}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="number"
                                        value={itemQty?.final_loaded_quantity || 0}
                                        onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                                        min="0"
                                        className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`text-sm font-medium ${
                                        (itemQty?.difference || 0) > 0 
                                          ? 'text-green-600' 
                                          : (itemQty?.difference || 0) < 0 
                                            ? 'text-red-600' 
                                            : 'text-gray-900'
                                      }`}>
                                        {(itemQty?.difference || 0) > 0 ? '+' : ''}{itemQty?.difference || 0}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary */}
                        {hasQuantityChanges() && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                              <div>
                                <h5 className="text-sm font-medium text-yellow-800">Quantity Changes Detected</h5>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Total difference: {getTotalDifference() > 0 ? '+' : ''}{getTotalDifference()} units
                                  <br />
                                  The sales order will be updated with the final loaded quantities and amounts will be recalculated.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !orderData}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Mark as Shipped'}
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

export default MarkAsShippedModal;