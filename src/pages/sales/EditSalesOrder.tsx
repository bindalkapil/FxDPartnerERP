import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSalesOrder, updateSalesOrder, getCustomers, getAvailableInventory } from '../../lib/api';

interface SalesOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku_id: string;
  sku_code: string;
  quantity: number;
  unit_type: string;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: string;
  name: string;
  customer_type: string;
  contact: string;
  email: string;
  address: string;
  payment_terms: number;
}

interface InventoryItem {
  product_id: string;
  product_name: string;
  product_category: string;
  sku_id: string;
  sku_code: string;
  unit_type: string;
  available_quantity: number;
  total_weight: number;
}

const EditSalesOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [formData, setFormData] = useState({
    order_number: '',
    customer_id: '',
    order_date: '',
    delivery_date: '',
    delivery_address: '',
    payment_terms: 30,
    payment_mode: 'cash',
    payment_status: 'unpaid',
    status: 'draft',
    notes: ''
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [taxRate, setTaxRate] = useState(0); // GST rate
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [salesOrderData, customersData, inventoryData] = await Promise.all([
        getSalesOrder(id!),
        getCustomers(),
        getAvailableInventory()
      ]);

      // Set form data
      setFormData({
        order_number: salesOrderData.order_number,
        customer_id: salesOrderData.customer_id,
        order_date: formatDateTimeForInput(salesOrderData.order_date),
        delivery_date: salesOrderData.delivery_date ? formatDateTimeForInput(salesOrderData.delivery_date) : '',
        delivery_address: salesOrderData.delivery_address || '',
        payment_terms: salesOrderData.payment_terms || 30,
        payment_mode: salesOrderData.payment_mode,
        payment_status: salesOrderData.payment_status,
        status: salesOrderData.status,
        notes: salesOrderData.notes || ''
      });

      // Set items
      setItems(salesOrderData.sales_order_items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku_id: item.sku_id,
        sku_code: item.sku_code,
        quantity: item.quantity,
        unit_type: item.unit_type,
        unit_price: item.unit_price,
        total_price: item.total_price
      })));

      setTaxRate((salesOrderData.tax_amount / salesOrderData.subtotal) * 100 || 0);
      setDiscountAmount(salesOrderData.discount_amount || 0);
      setCustomers(customersData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load sales order data');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleAddItem = () => {
    const newItem: SalesOrderItem = {
      id: `temp_${Date.now()}`,
      product_id: '',
      product_name: '',
      sku_id: '',
      sku_code: '',
      quantity: 1,
      unit_type: 'box',
      unit_price: 0,
      total_price: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // If inventory item is selected, update related fields
        if (field === 'sku_id') {
          const inventoryItem = inventory.find(inv => inv.sku_id === value);
          if (inventoryItem) {
            updatedItem.product_id = inventoryItem.product_id;
            updatedItem.product_name = inventoryItem.product_name;
            updatedItem.sku_code = inventoryItem.sku_code;
            updatedItem.unit_type = inventoryItem.unit_type;
          }
        }
        
        // Recalculate total price
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        delivery_address: customer.address,
        payment_terms: customer.payment_terms
      }));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount() - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.sku_id || item.quantity <= 0 || item.unit_price < 0) {
        toast.error('Please complete all item details with valid values');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTaxAmount();
      const totalAmount = calculateTotal();

      // Prepare order data
      const orderData = {
        order_number: formData.order_number,
        customer_id: formData.customer_id,
        order_date: formData.order_date,
        delivery_date: formData.delivery_date || null,
        delivery_address: formData.delivery_address || null,
        payment_terms: formData.payment_terms,
        payment_mode: formData.payment_mode,
        payment_status: formData.payment_status,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: formData.status,
        notes: formData.notes || null
      };

      // Prepare items data
      const itemsData = items.map(item => ({
        product_id: item.product_id,
        sku_id: item.sku_id,
        product_name: item.product_name,
        sku_code: item.sku_code,
        quantity: item.quantity,
        unit_type: item.unit_type,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      await updateSalesOrder(id!, orderData, itemsData);
      toast.success('Sales order updated successfully!');
      navigate('/sales');
    } catch (error) {
      console.error('Error updating sales order:', error);
      toast.error('Failed to update sales order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableQuantity = (skuId: string) => {
    const inventoryItem = inventory.find(item => item.sku_id === skuId);
    return inventoryItem ? inventoryItem.available_quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales order...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sales')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Edit Sales Order</h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Address
                </label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: Number(e.target.value) }))}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Mode
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Status
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.sku_id}
                          onChange={(e) => handleItemChange(index, 'sku_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Product & SKU</option>
                          {inventory.map(invItem => (
                            <option key={invItem.sku_id} value={invItem.sku_id}>
                              {invItem.product_name} - {invItem.sku_code} ({invItem.unit_type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sku_id ? getAvailableQuantity(item.sku_id) : '-'} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                          max={getAvailableQuantity(item.sku_id)}
                          className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="text-gray-900">₹{calculateTaxAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-gray-900">-₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Any additional notes for this order..."
            />
          </div>

          {/* Form Actions */}
          <div className="border-t pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSalesOrder;