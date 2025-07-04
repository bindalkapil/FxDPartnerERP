import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, User, Calendar, MapPin, CreditCard, AlertTriangle, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomers, getAvailableInventory, createSalesOrderWithMultiplePayments, checkInventoryForSalesOrder } from '../../lib/api';
import ProductSearchInput from '../../components/forms/ProductSearchInput';
import AdjustInventoryModal from '../../components/modals/AdjustInventoryModal';
// import MultiplePaymentSection, { PaymentMethod } from '../../components/forms/MultiplePaymentSection';

interface SalesOrderItem {
  id: string;
  inventoryId: string;
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
  delivery_addresses: any[] | null; // Using any[] to match Json[] from database
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
}

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  sku_id: string;
  sku_code: string;
  unit_type: string;
  available_quantity: number;
  total_weight: number;
}

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const [saleType, setSaleType] = useState<'counter' | 'outstation'>('counter');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date().toISOString().slice(0, 16),
    deliveryDate: '',
    deliveryAddress: '',
    paymentTerms: 30,
    notes: ''
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  // const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  // const [paymentValidation, setPaymentValidation] = useState({ isValid: true, message: '' });
  const [showNegativeInventoryModal, setShowNegativeInventoryModal] = useState(false);
  const [negativeInventoryWarnings, setNegativeInventoryWarnings] = useState<any[]>([]);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  // const [pendingPaymentMethods, setPendingPaymentMethods] = useState<any[]>([]);
  const [showCreditWarningModal, setShowCreditWarningModal] = useState(false);
  const [creditWarningData, setCreditWarningData] = useState<{
    availableCredit: number;
    orderValue: number;
    customerName: string;
  } | null>(null);
  console.log(items)
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [customersData, inventoryData] = await Promise.all([
        getCustomers(),
        getAvailableInventory()
      ]);
      
      console.log('Loaded customers data:', customersData);
      console.log('Number of customers:', customersData?.length || 0);
      
      setCustomers(customersData || []);
      
      // Map and validate the inventory data to match the expected interface
      const mappedInventory = (inventoryData || [])
        .filter((item: any) => {
          // Validate required fields
          if (!item.product_id || !item.sku_id || !item.product_name || !item.sku_code) {
            console.warn('Skipping invalid inventory item:', item);
            return false;
          }
          return true;
        })
        .map((item: any) => {
          const mappedItem = {
            id: item.id || `${item.product_id}_${item.sku_id}`, // Generate ID if not present
            product_id: item.product_id,
            product_name: item.product_name || '',
            product_category: item.category || 'Uncategorized', // Use category from database schema
            sku_id: item.sku_id,
            sku_code: item.sku_code || '',
            unit_type: item.unit_type || 'box',
            available_quantity: typeof item.available_quantity === 'number' ? item.available_quantity : 0,
            total_weight: typeof item.total_weight === 'number' ? item.total_weight : 0
          };
          
          // Enhanced logging for debugging the specific issue
          if (mappedItem.sku_code === 'Premium') {
            console.log('🍎🍌 PREMIUM SKU FOUND:', {
              product_id: mappedItem.product_id,
              product_name: mappedItem.product_name,
              sku_id: mappedItem.sku_id,
              sku_code: mappedItem.sku_code,
              searchKey: `${mappedItem.product_name} - ${mappedItem.sku_code}`
            });
          }
          
          return mappedItem;
        });
      
      console.log('Loaded and mapped inventory data:', {
        originalCount: inventoryData?.length || 0,
        mappedCount: mappedInventory.length,
        sampleItems: mappedInventory.slice(0, 3)
      });

      // Data validation: Check for proper unique constraints
      const productSkuCombinations = new Set<string>();
      const duplicateCombinations: string[] = [];

      mappedInventory.forEach(item => {
        const combination = `${item.product_id}_${item.sku_id}`;
        if (productSkuCombinations.has(combination)) {
          duplicateCombinations.push(combination);
        }
        productSkuCombinations.add(combination);
      });

      if (duplicateCombinations.length > 0) {
        console.error('CRITICAL: Duplicate product_id + sku_id combinations found:', duplicateCombinations);
        toast.error('Data integrity error: Duplicate product/SKU combinations found. Please contact support.');
      }

      // Log SKU code sharing (this is normal business logic)
      const skuCodeCounts = new Map<string, number>();
      mappedInventory.forEach(item => {
        const count = skuCodeCounts.get(item.sku_code) || 0;
        skuCodeCounts.set(item.sku_code, count + 1);
      });

      const sharedSkuCodes = Array.from(skuCodeCounts.entries()).filter(([_, count]) => count > 1);
      if (sharedSkuCodes.length > 0) {
        console.log('Products sharing SKU codes (normal business logic):',
          sharedSkuCodes.map(([code, count]) => `${code}: ${count} products`)
        );
      }

      setInventory(mappedInventory);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
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
          // Find default address or use first one
          const defaultAddr = customer.delivery_addresses.find(addr => addr.is_default) || customer.delivery_addresses[0];
          defaultAddress = defaultAddr.address;
          setSelectedAddressIndex(customer.delivery_addresses.findIndex(addr => addr === defaultAddr));
        } else if (customer.address) {
          // Use main address if no delivery addresses
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

  const handleSaleTypeChange = (type: 'counter' | 'outstation') => {
    setSaleType(type);
    const customer = customers.find(c => c.id === formData.customerId);
    
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
      inventoryId: '',
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

  const handleItemChange = (id: string, field: keyof SalesOrderItem, value: any, selectedItem?: InventoryItem) => {
    console.log('Adjusting inventory for item:', selectedItem);
console.log('Selected item ID:', selectedItem?.id);
    // For inventory ID changes (when selecting a product), handle differently to ensure we have complete product info before updating UI
    if (field === 'inventoryId') {
      console.log('📥 NewSale - SKU selection changed:', {
        itemId: id,
        newSkuId: value,
        hasSelectedItem: !!selectedItem,
        selectedItemDetails: selectedItem ? {
          product_id: selectedItem.product_id,
          product_name: selectedItem.product_name,
          sku_id: selectedItem.sku_id,
          sku_code: selectedItem.sku_code
        } : null,
        timestamp: new Date().toISOString()
      });

      // Clear selection if no value provided (user cleared the input or is typing)
      if (!value) {
        console.log('Clearing product selection for item:', id);
        
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              inventoryId: '',
              skuId: '',
              productId: '',
              productName: '',
              skuCode: '',
              unitType: 'box'
            };
          }
          return item;
        }));
        return;
      }

      // CRITICAL: Only update the table if we have a selectedItem from ProductSearchInput
      // This ensures we use the exact product the user selected, not just any product with the same SKU ID
      if (selectedItem) {
        // Validate the selectedItem has all required fields
        if (!selectedItem.product_id || !selectedItem.product_name || !selectedItem.sku_code || !selectedItem.sku_id) {
          console.error('Invalid inventory item found:', selectedItem);
          toast.error('Selected product has invalid data. Please contact support.');
          return;
        }

        // Validate that the selectedItem's id matches the value (this should always be true)
        if (selectedItem.id !== value) {
          console.error('Inventory ID mismatch between value and selectedItem:', {
            expectedInventoryId: value,
            selectedItemInventoryId: selectedItem.id,
            selectedItem
          });
          toast.error('Product selection error. Please try selecting the product again.');
          return;
        }

        console.log('✅ NewSale - Processing exact selected item from ProductSearchInput:', {
          product_id: selectedItem.product_id,
          product_name: selectedItem.product_name,
          sku_id: selectedItem.sku_id,
          sku_code: selectedItem.sku_code,
          itemId: id,
          expectedTableDisplay: `Should show "${selectedItem.product_name}" with SKU "${selectedItem.sku_code}"`
        });

        // Update all fields atomically with the exact selected item
        // This is the key fix: we use the exact selectedItem, not a lookup by SKU ID
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            const updatedItem = {
              ...item,
              inventoryId: selectedItem.id,
              skuId: selectedItem.sku_id,
              productId: selectedItem.product_id,
              productName: selectedItem.product_name,
              skuCode: selectedItem.sku_code,
              unitType: selectedItem.unit_type
            };

            console.log('🎯 NewSale - Updated item in table with exact selection:', {
              itemId: id,
              updatedItem: {
                productName: updatedItem.productName,
                skuCode: updatedItem.skuCode,
                productId: updatedItem.productId,
                skuId: updatedItem.skuId
              },
              verification: `Table should now display "${updatedItem.productName}" with SKU "${updatedItem.skuCode}"`
            });

            return updatedItem;
          }
          return item;
        }));
        return;
      } else {
        // If no selectedItem is provided, we should not proceed with the update
        // This prevents the fallback logic from running and potentially selecting the wrong product
        console.warn('⚠️ No selectedItem provided for SKU change. Ignoring update to prevent incorrect product selection.', {
          skuId: value,
          itemId: id
        });
        
        // Clear the selection to force user to select again from dropdown
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              inventoryId: '',
              skuId: '',
              productId: '',
              productName: '',
              skuCode: '',
              unitType: 'box'
            };
          }
          return item;
        }));
        
        toast.error('Please select a product from the dropdown list');
        return;
      }
    } else {
      // For non-SKU changes, use the simple update logic
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total price if quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }

          return updatedItem;
        }
        return item;
      }));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discountAmount;
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    return `SO-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === formData.customerId);
  };

  // const handlePaymentMethodsChange = (methods: PaymentMethod[]) => {
  //   setPaymentMethods(methods);
  // };

  // const handlePaymentValidationChange = (isValid: boolean, message?: string) => {
  //   setPaymentValidation({ isValid, message: message || '' });
  // };

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

    // Check customer credit limit
    const customer = getSelectedCustomer();
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }

    const totalAmount = calculateTotal();
    const availableCredit = customer.credit_limit - customer.current_balance;
    
    if (totalAmount > availableCredit) {
      // Show credit warning modal and stop execution
      setCreditWarningData({
        availableCredit,
        orderValue: totalAmount,
        customerName: customer.name
      });
      setShowCreditWarningModal(true);
      return; // This stops the function execution
    }

    // Validate items
    for (const item of items) {
      if (!item.skuId || !item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
        toast.error('Please complete all item details and ensure a product is selected');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create order directly with credit (only if credit is sufficient)
      await createOrderWithCredit();
    } catch (error) {
      console.error('Error checking inventory or creating sales order:', error);
      toast.error('Failed to create sales order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const createOrderWithCredit = async () => {
    try {
      setIsSubmitting(true);
      
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();

      const itemsData = items.map(item => ({
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        skuCode: item.skuCode,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));

      // Check for negative inventory warnings
      const warnings = await checkInventoryForSalesOrder(itemsData);
      
      if (warnings.length > 0) {
        // Store the order data for later use
        const orderData = {
          order_number: generateOrderNumber(),
          customer_id: formData.customerId,
          order_date: formData.orderDate,
          delivery_date: saleType === 'outstation' ? formData.deliveryDate : null,
          delivery_address: saleType === 'outstation' ? formData.deliveryAddress : null,
          payment_terms: formData.paymentTerms,
          payment_mode: 'credit',
          payment_status: 'unpaid',
          subtotal,
          tax_amount: 0,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          status: saleType === 'counter' ? 'completed' : 'processing',
          notes: formData.notes || null,
          items: itemsData
        };

        setPendingOrderData(orderData);
        setNegativeInventoryWarnings(warnings);
        setShowNegativeInventoryModal(true);
        setIsSubmitting(false);
        return;
      }

      // Create order directly
      await proceedWithOrderCreation();
    } catch (error) {
      console.error('Error creating sales order:', error);
      toast.error('Failed to create sales order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const proceedWithOrderCreation = async () => {
    try {
      setIsSubmitting(true);
      
      let orderData = pendingOrderData;

      // If no pending data (direct creation without warnings), prepare it
      if (!orderData) {
        const subtotal = calculateSubtotal();
        const totalAmount = calculateTotal();

        const itemsData = items.map(item => ({
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuCode: item.skuCode,
          quantity: item.quantity,
          unitType: item.unitType,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }));

        orderData = {
          order_number: generateOrderNumber(),
          customer_id: formData.customerId,
          order_date: formData.orderDate,
          delivery_date: saleType === 'outstation' ? formData.deliveryDate : null,
          delivery_address: saleType === 'outstation' ? formData.deliveryAddress : null,
          payment_terms: formData.paymentTerms,
          payment_mode: 'credit',
          payment_status: 'unpaid',
          subtotal: subtotal,
          tax_amount: 0,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          status: saleType === 'counter' ? 'completed' : 'processing',
          notes: formData.notes || null,
          items: itemsData
        };
      }

      // Create sales order with credit payment
      const paymentMethods = [{
        id: `payment_${Date.now()}`,
        type: 'credit' as const,
        amount: orderData.total_amount
      }];

      await createSalesOrderWithMultiplePayments(orderData, paymentMethods);
      
      toast.success('Sales order created successfully!');
      navigate('/sales');
    } catch (error) {
      console.error('Error creating sales order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('customer')) {
          toast.error('Customer validation failed. Please select a valid customer.');
        } else if (error.message.includes('product') || error.message.includes('SKU')) {
          toast.error('Product validation failed. Please check that all selected products are valid.');
        } else if (error.message.includes('Invalid data format')) {
          toast.error('Data format error. Please check all required fields.');
        } else {
          toast.error(`Failed to create sales order: ${error.message}`);
        }
      } else {
        toast.error('Failed to create sales order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      // Clear pending data
      setPendingOrderData(null);
      setNegativeInventoryWarnings([]);
    }
  };

  const createPendingApprovalOrder = async () => {
    try {
      setIsSubmitting(true);
      
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();

      const itemsData = items.map(item => ({
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        skuCode: item.skuCode,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));

      const orderData = {
        order_number: generateOrderNumber(),
        customer_id: formData.customerId,
        order_date: formData.orderDate,
        delivery_date: saleType === 'outstation' ? formData.deliveryDate : null,
        delivery_address: saleType === 'outstation' ? formData.deliveryAddress : null,
        payment_terms: formData.paymentTerms,
        payment_mode: 'credit',
        payment_status: 'unpaid',
        subtotal,
        tax_amount: 0,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'pending_approval', // Explicitly set status for pending approval
        notes: formData.notes || null,
        items: itemsData
      };

      // Create sales order with pending approval status
      const paymentMethods = [{
        id: `payment_${Date.now()}`,
        type: 'credit' as const,
        amount: totalAmount
      }];

      await createSalesOrderWithMultiplePayments(orderData, paymentMethods);
      
      toast.success('Sales order created and moved to pending approval!');
      navigate('/sales');
    } catch (error) {
      console.error('Error creating pending approval order:', error);
      toast.error('Failed to create sales order. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowCreditWarningModal(false);
      setCreditWarningData(null);
    }
  };

  const getAvailableQuantity = (skuId: string) => {
    const inventoryItem = inventory.find(inv => inv.sku_id === skuId);
    return inventoryItem?.available_quantity || 0;
  };

  const getAvailableQuantityByInventoryId = (inventoryId: string) => {
    const inventoryItem = inventory.find(inv => inv.id === inventoryId);
    return inventoryItem?.available_quantity || 0;
  };

  const handleAdjustInventory = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setShowAdjustModal(true);
  };

  const handleAdjustmentSuccess = () => {
    loadInitialData(); // Reload inventory data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const selectedCustomer = getSelectedCustomer();

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
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="px-6 py-4">
                        <ProductSearchInput
                          inventory={inventory}
                          value={item.inventoryId}
                          onChange={(inventoryId, selectedItem) => handleItemChange(item.id, 'inventoryId', inventoryId, selectedItem)}
                          placeholder="Type to search products..."
                          className="text-sm"
                          onAdjustInventory={handleAdjustInventory}
                        />
                        {/* Enhanced debug info */}
                        {item.inventoryId && (
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <div>Inventory ID = {item.inventoryId}</div>
                            <div>SKU ID = {item.skuId}</div>
                            <div>Product = {item.productName}, SKU Code = {item.skuCode}</div>
                            <div>Product ID = {item.productId}</div>
                            <div>Item ID = {item.id}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAvailableQuantityByInventoryId(item.inventoryId)} {item.unitType === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          min="1"
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

          {/* Customer Credit Information */}
          {selectedCustomer && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Credit Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Credit Limit:</span>
                    <span className="font-medium">₹{selectedCustomer.credit_limit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Outstanding:</span>
                    <span className="font-medium">₹{selectedCustomer.current_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Credit:</span>
                    <span className={`font-medium ${(selectedCustomer.credit_limit - selectedCustomer.current_balance) >= calculateTotal() ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(selectedCustomer.credit_limit - selectedCustomer.current_balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-600">Order Value:</span>
                    <span className="font-medium text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </div>

      {showAdjustModal && selectedInventoryItem && (
        <AdjustInventoryModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={handleAdjustmentSuccess}
          inventoryItem={{
            // selectedProductObjectID: selectedInventoryItem.id,
            productId: selectedInventoryItem.product_id,
            skuId: selectedInventoryItem.sku_id,
            productName: selectedInventoryItem.product_name,
            skuCode: selectedInventoryItem.sku_code,
            availableQuantity: selectedInventoryItem.available_quantity
          }}
        />
      )}

      {/* Negative Inventory Warning Modal */}
      {showNegativeInventoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Inventory Warning
                  </h3>
                  <p className="text-sm text-gray-500">
                    The following items will result in negative inventory
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="space-y-3">
                    {negativeInventoryWarnings.map((warning, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {warning.productName} ({warning.skuCode})
                          </div>
                          <div className="text-gray-600">
                            {warning.type === 'not_found' ? (
                              'Product not found in inventory'
                            ) : (
                              <>
                                Available: {warning.currentQuantity} | 
                                Requested: {warning.requestedQuantity} | 
                                Resulting: {warning.resultingQuantity}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {warning.type === 'not_found' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Not Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {Math.abs(warning.resultingQuantity)} Short
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      What happens if you proceed?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Inventory quantities will go negative for the listed items</li>
                        <li>This indicates backorders or oversold items</li>
                        <li>You'll need to restock these items to fulfill the order</li>
                        <li>The sales order will still be created successfully</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNegativeInventoryModal(false);
                    setNegativeInventoryWarnings([]);
                    setPendingOrderData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowNegativeInventoryModal(false);
                    await proceedWithOrderCreation();
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Order...' : 'Proceed with Negative Inventory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Warning Modal */}
      {showCreditWarningModal && creditWarningData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Insufficient Credit Limit
                  </h3>
                  <p className="text-sm text-gray-500">
                    Customer does not have enough credit for this order
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Customer:</span>
                      <span className="text-gray-700">{creditWarningData.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Available Credit:</span>
                      <span className="text-red-600 font-medium">₹{creditWarningData.availableCredit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Order Value:</span>
                      <span className="text-gray-700 font-medium">₹{creditWarningData.orderValue.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">Credit Shortage:</span>
                      <span className="text-red-600 font-bold">₹{(creditWarningData.orderValue - creditWarningData.availableCredit).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      What happens if you proceed?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>The order will be moved to "Pending Approval" status</li>
                        <li>It will appear in the Pending Approvals tab for review</li>
                        <li>An authorized person can approve or reject the order</li>
                        <li>Inventory will not be affected until the order is approved</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreditWarningModal(false);
                    setCreditWarningData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createPendingApprovalOrder}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Order...' : 'Move to Pending Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
