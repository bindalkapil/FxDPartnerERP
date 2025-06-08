import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, User, Calendar, MapPin, AlertTriangle, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSalesOrder, updateSalesOrder, getCustomers, getAvailableInventory } from '../../lib/api';
import ProductSearchInput from '../../components/forms/ProductSearchInput';

interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  skuId: string;
  skuCode: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
}

interface DeliveryAddress {
  label: string;
  address: string;
  is_default: boolean;
}

interface Customer {
  id: string;
  name: string;
  customer_type: string;
  contact: string;
  email: string;
  address: string;
  delivery_addresses: DeliveryAddress[] | null;
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
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

const EditSale: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [saleType, setSaleType] = useState<'counter' | 'outstation'>('counter');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: '',
    deliveryDate: '',
    deliveryAddress: '',
    paymentTerms: 30,
    paymentMode: 'cash',
    notes: ''
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;

    try {
      const [orderData, customersData, inventoryData] = await Promise.all([
        getSalesOrder(id),
        getCustomers(),
        getAvailableInventory()
      ]);

      // Determine sale type
      const orderSaleType = orderData.delivery_date || orderData.delivery_address ? 'outstation' : 'counter';
      setSaleType(orderSaleType);

      // Set form data
      setFormData({
        customerId: orderData.customer.id,
        orderDate: new Date(orderData.order_date).toISOString().slice(0, 16),
        deliveryDate: orderData.delivery_date ? new Date(orderData.delivery_date).toISOString().slice(0, 16) : '',
        deliveryAddress: orderData.delivery_address || '',
        paymentTerms: orderData.payment_terms,
        paymentMode: orderData.payment_mode,
        notes: orderData.notes || ''
      });

      // Set address selection state
      if (orderSaleType === 'outstation' && orderData.delivery_address) {
        const customer = orderData.customer;
        if (customer.delivery_addresses) {
          const addressIndex = customer.delivery_addresses.findIndex(
            addr => addr.address === orderData.delivery_address
          );
          if (addressIndex >= 0) {
            setSelectedAddressIndex(addressIndex);
            setIsCustomAddress(false);
          } else {
            setIsCustomAddress(true);
          }
        } else {
          setIsCustomAddress(true);
        }
      }

      // Set items
      const orderItems = orderData.sales_order_items.map((item: any) => ({
        id: item.id,
        productId: item.product?.id || '',
        productName: item.product_name,
        skuId: item.sku?.id || '',
        skuCode: item.sku_code,
        quantity: item.quantity,
        unitType: item.unit_type,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      }));
      setItems(orderItems);

      // Set discount
      setDiscountAmount(orderData.discount_amount || 0);

      setCustomers(customersData || []);
      setInventory(inventoryData || []);
    } catch (error) {
      console.error('Error loading order data:', error);
      toast.error('Failed to load order data');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleTypeChange = (type: 'counter' | 'outstation') => {
    setSaleType(type);
    const customer = getSelectedCustomer();
    
    // Reset address selection
    setSelectedAddressIndex(-1);
    setIsCustomAddress(false);
    
    let deliveryAddress = '';
    if (type === 'outstation' && customer) {
      if (customer.delivery_addresses && customer.delivery_addresses.length > 0) {
        const defaultAddr = customer.delivery_addresses.find(addr => addr.is_default) || customer.delivery_addresses[0];
        deliveryAddress = defaultAddr.address;
        setSelectedAddressIndex(customer.delivery_addresses.findIndex(addr => addr === defaultAddr));
      } else if (customer.address) {
        deliveryAddress = customer.address;
        setIsCustomAddress(true);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      deliveryDate: type === 'counter' ? '' : prev.deliveryDate,
      deliveryAddress
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      // Reset address selection when customer changes
      setSelectedAddressIndex(-1);
      setIsCustomAddress(false);
      
      // Set default delivery address for outstation sales
      let defaultAddress = '';
      if (saleType === 'outstation') {
        if (customer.delivery_addresses && customer.delivery_addresses.length > 0) {
          const defaultAddr = customer.delivery_addresses.find(addr => addr.is_default) || customer.delivery_addresses[0];
          defaultAddress = defaultAddr.address;
          setSelectedAddressIndex(customer.delivery_addresses.findIndex(addr => addr === defaultAddr));
        } else if (customer.address) {
          defaultAddress = customer.address;
          setIsCustomAddress(true);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        customerId,
        paymentTerms: customer.payment_terms,
        deliveryAddress: defaultAddress
      }));
    }
  };

  const handleAddressSelection = (value: string) => {
    const customer = getSelectedCustomer();
    if (!customer) return;

    if (value === 'custom') {
      setIsCustomAddress(true);
      setSelectedAddressIndex(-1);
      setFormData(prev => ({ ...prev, deliveryAddress: '' }));
    } else {
      const index = parseInt(value);
      setSelectedAddressIndex(index);
      setIsCustomAddress(false);
      
      if (customer.delivery_addresses && customer.delivery_addresses[index]) {
        setFormData(prev => ({ 
          ...prev, 
          deliveryAddress: customer.delivery_addresses![index].address 
        }));
      }
    }
  };

  const handleAddItem = () => {
    const newItem: SalesOrderItem = {
      id: `item_${Date.now()}`,
      productId: '',
      productName: '',
      skuId: '',
      skuCode: '',
      quantity: 1,
      unitType: 'box',
      unitPrice: 0,
      totalPrice: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof SalesOrderItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If SKU is changed, update related fields
        if (field === 'skuId') {
          const inventoryItem = inventory.find(inv => inv.sku_id === value);
          if (inventoryItem) {
            updatedItem.productId = inventoryItem.product_id;
            updatedItem.productName = inventoryItem.product_name;
            updatedItem.skuCode = inventoryItem.sku_code;
            updatedItem.unitType = inventoryItem.unit_type;
          }
        }
        
        // Recalculate total price
        updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discountAmount;
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === formData.customerId);
  };

  const checkCreditLimit = () => {
    const customer = getSelectedCustomer();
    if (!customer || formData.paymentMode !== 'credit') return { valid: true, message: '' };

    const orderTotal = calculateTotal();
    const availableCredit = customer.credit_limit - customer.current_balance;
    
    if (orderTotal > availableCredit) {
      return {
        valid: false,
        message: `Order total (₹${orderTotal.toFixed(2)}) exceeds available credit limit (₹${availableCredit.toFixed(2)})`
      };
    }
    
    return { valid: true, message: '' };
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

    // Validate sale type specific requirements
    if (saleType === 'outstation') {
      if (!formData.deliveryDate) {
        toast.error('Delivery date is required for outstation sales');
        return;
      }
      if (!formData.deliveryAddress.trim()) {
        toast.error('Delivery address is required for outstation sales');
        return;
      }
    }

    // Check credit limit for credit payments
    const creditCheck = checkCreditLimit();
    if (!creditCheck.valid) {
      toast.error(creditCheck.message);
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.skuId || item.quantity <= 0 || item.unitPrice <= 0) {
        toast.error('Please complete all item details');
        return;
      }

      // Check inventory availability for new items
      if (item.id.startsWith('item_')) {
        const inventoryItem = inventory.find(inv => inv.sku_id === item.skuId);
        
        if (!inventoryItem || inventoryItem.available_quantity < item.quantity) {
          toast.error(`Insufficient inventory for ${item.productName}. Available: ${inventoryItem?.available_quantity || 0}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();

      // Update sales order
      const orderData = {
        customer_id: formData.customerId,
        order_date: formData.orderDate,
        delivery_date: saleType === 'outstation' ? formData.deliveryDate : null,
        delivery_address: saleType === 'outstation' ? formData.deliveryAddress : null,
        payment_terms: formData.paymentTerms,
        payment_mode: formData.paymentMode,
        payment_status: 'unpaid', // Keep as unpaid
        subtotal,
        tax_amount: 0, // Tax removed
        discount_amount: discountAmount,
        total_amount: totalAmount,
        notes: formData.notes || null
      };

      // Prepare items data
      const itemsData = items.map(item => ({
        product_id: item.productId,
        sku_id: item.skuId,
        product_name: item.productName,
        sku_code: item.skuCode,
        quantity: item.quantity,
        unit_type: item.unitType,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
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
    const inventoryItem = inventory.find(inv => inv.sku_id === skuId);
    return inventoryItem?.available_quantity || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const selectedCustomer = getSelectedCustomer();
  const creditCheck = checkCreditLimit();

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
          {/* Sale Type Selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sale Type</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="saleType"
                  value="counter"
                  checked={saleType === 'counter'}
                  onChange={(e) => handleSaleTypeChange(e.target.value as 'counter' | 'outstation')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Counter Sale</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="saleType"
                  value="outstation"
                  checked={saleType === 'outstation'}
                  onChange={(e) => handleSaleTypeChange(e.target.value as 'counter' | 'outstation')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Outstation Sale</span>
              </label>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
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
              </div>

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
                    value={formData.orderDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              {saleType === 'outstation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required={saleType === 'outstation'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: Number(e.target.value) }))}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {saleType === 'outstation' && selectedCustomer && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Address Selection */}
                  {selectedCustomer.delivery_addresses && selectedCustomer.delivery_addresses.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Select Address
                        </label>
                        <select
                          value={isCustomAddress ? 'custom' : selectedAddressIndex.toString()}
                          onChange={(e) => handleAddressSelection(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          {selectedCustomer.delivery_addresses.map((addr, index) => (
                            <option key={index} value={index.toString()}>
                              {addr.label} {addr.is_default ? '(Default)' : ''}
                            </option>
                          ))}
                          <option value="custom">Custom Address</option>
                        </select>
                      </div>
                      
                      {/* Address Display/Edit */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          value={formData.deliveryAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                          rows={3}
                          className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            !isCustomAddress && selectedAddressIndex >= 0 ? 'bg-gray-50' : ''
                          }`}
                          placeholder="Enter delivery address..."
                          required={saleType === 'outstation'}
                          readOnly={!isCustomAddress && selectedAddressIndex >= 0}
                        />
                        {!isCustomAddress && selectedAddressIndex >= 0 && (
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={() => handleAddressSelection('custom')}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit address"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // No saved addresses - show editable field
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        rows={3}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter delivery address..."
                        required={saleType === 'outstation'}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Credit Information */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Credit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Credit Limit:</span>
                    <span className="ml-2 font-medium">₹{selectedCustomer.credit_limit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Outstanding:</span>
                    <span className="ml-2 font-medium">₹{selectedCustomer.current_balance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Credit:</span>
                    <span className="ml-2 font-medium">₹{(selectedCustomer.credit_limit - selectedCustomer.current_balance).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Mode
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

            {/* Credit Limit Warning */}
            {formData.paymentMode === 'credit' && !creditCheck.valid && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">{creditCheck.message}</span>
                </div>
              </div>
            )}
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
                        {item.id.startsWith('item_') ? (
                          <ProductSearchInput
                            inventory={inventory}
                            value={item.skuId}
                            onChange={(skuId) => handleItemChange(item.id, 'skuId', skuId)}
                            placeholder="Type to search products..."
                            className="text-sm"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">{item.skuCode}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAvailableQuantity(item.skuId)} {item.unitType === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          min="1"
                          max={item.id.startsWith('item_') ? getAvailableQuantity(item.skuId) : undefined}
                          className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.totalPrice.toFixed(2)}
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
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
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
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
              disabled={isSubmitting || (formData.paymentMode === 'credit' && !creditCheck.valid)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating Order...' : 'Update Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSale;