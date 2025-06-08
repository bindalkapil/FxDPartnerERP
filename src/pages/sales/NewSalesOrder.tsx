import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, User, Calendar, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomers, getAvailableInventory, createSalesOrder } from '../../lib/api';

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

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku_id: string;
  sku_code: string;
  unit_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  available_quantity: number;
}

const NewSalesOrder: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date().toISOString().slice(0, 16),
    deliveryDate: '',
    deliveryAddress: '',
    paymentMode: 'cash',
    paymentTerms: 30,
    notes: ''
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    loadCustomers();
    loadInventory();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data.filter(customer => customer.status === 'active'));
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadInventory = async () => {
    try {
      const data = await getAvailableInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory');
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setFormData(prev => ({
      ...prev,
      customerId,
      paymentTerms: customer?.payment_terms || 30,
      deliveryAddress: customer?.address || ''
    }));
  };

  const handleAddItem = () => {
    const newItem: OrderItem = {
      id: `item_${Date.now()}`,
      product_id: '',
      product_name: '',
      sku_id: '',
      sku_code: '',
      unit_type: 'box',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      available_quantity: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If inventory item is selected, update related fields
        if (field === 'sku_id') {
          const inventoryItem = inventory.find(inv => inv.sku_id === value);
          if (inventoryItem) {
            updatedItem.product_id = inventoryItem.product_id;
            updatedItem.product_name = inventoryItem.product_name;
            updatedItem.sku_code = inventoryItem.sku_code;
            updatedItem.unit_type = inventoryItem.unit_type;
            updatedItem.available_quantity = inventoryItem.available_quantity;
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotalAmount = () => {
    return calculateSubtotal() + calculateTaxAmount() - discountAmount;
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    return `SO-${timestamp.toString().slice(-8)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.sku_id || item.quantity <= 0 || item.unit_price <= 0) {
        toast.error('Please complete all item details');
        return;
      }

      if (item.quantity > item.available_quantity) {
        toast.error(`Insufficient inventory for ${item.product_name}. Available: ${item.available_quantity}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTaxAmount();
      const totalAmount = calculateTotalAmount();

      // Create sales order
      const orderData = {
        order_number: generateOrderNumber(),
        customer_id: formData.customerId,
        order_date: formData.orderDate,
        delivery_date: formData.deliveryDate || null,
        delivery_address: formData.deliveryAddress || null,
        payment_terms: formData.paymentTerms,
        payment_mode: formData.paymentMode,
        payment_status: 'unpaid',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'draft',
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

      await createSalesOrder(orderData, itemsData);
      
      toast.success('Sales order created successfully!');
      navigate('/sales');
    } catch (error) {
      console.error('Error creating sales order:', error);
      toast.error('Failed to create sales order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'paymentTerms' ? Number(value) : value
    }));
  };

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
            <h1 className="text-2xl font-bold text-gray-800">New Sales Order</h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
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

              {selectedCustomer && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {selectedCustomer.contact}
                    </div>
                    <div>{selectedCustomer.email}</div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-1 mt-0.5" />
                      {selectedCustomer.address}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Date
                </label>
                <input
                  type="datetime-local"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Mode
                </label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
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
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Address
                </label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter delivery address..."
                />
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price (₹)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (₹)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.sku_id}
                          onChange={(e) => handleItemChange(item.id, 'sku_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Product/SKU</option>
                          {inventory.map((inv) => (
                            <option key={inv.sku_id} value={inv.sku_id}>
                              {inv.product_name} - {inv.sku_code} ({inv.unit_type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.available_quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          min="0"
                          max={item.available_quantity}
                          step="1"
                          className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(item.id, 'unit_price', Number(e.target.value))}
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
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                      Subtotal:
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      ₹{calculateSubtotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div className="bg-gray-50 p-4 rounded-lg">
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
                    <span className="text-green-600">₹{calculateTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Any special instructions or notes..."
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSalesOrder;