import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Package2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrival, getProducts } from '../../lib/api';

interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  skuId: string;
  skuCode: string;
  category: string;
  quantity: number;
  unitType: string;
  totalWeight: number;
  commission?: number;
  unitPrice?: number;
  marketPrice?: number;
  total: number;
}

interface AdditionalCost {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage' | 'per_box';
}

interface PurchaseOrderData {
  id?: string;
  orderNumber?: string;
  supplier: string;
  arrivalTimestamp: string;
  pricingModel: 'commission' | 'fixed';
  items: PurchaseOrderItem[];
  additionalCosts: AdditionalCost[];
  totalAmount: number;
}

interface NewRecordPurchaseProps {
  initialData?: PurchaseOrderData;
}

const defaultAdditionalCosts: AdditionalCost[] = [
  { name: 'Labour Cost', amount: 5, type: 'per_box' },
  { name: 'Handling Cost', amount: 3, type: 'per_box' },
  { name: 'APMC Charge', amount: 1, type: 'percentage' },
  { name: 'Vehicle Charges', amount: 2000, type: 'fixed' }
];

const NewRecordPurchase: React.FC<NewRecordPurchaseProps> = ({ initialData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleId = queryParams.get('vehicleId');

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);

  const [formData, setFormData] = useState({
    supplier: initialData?.supplier || '',
    arrivalTimestamp: initialData?.arrivalTimestamp || '',
    pricingModel: initialData?.pricingModel || 'commission'
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>(initialData?.items || []);
  const [commission, setCommission] = useState(8); // Default commission
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(
    initialData?.additionalCosts || [...defaultAdditionalCosts]
  );
  
  const [newCost, setNewCost] = useState({
    name: '',
    amount: 0,
    type: 'fixed' as const | 'percentage' | 'per_box'
  });

  useEffect(() => {
    loadProducts();
    if (vehicleId && !initialData) {
      loadVehicleData();
    }
  }, [vehicleId, initialData]);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadVehicleData = async () => {
    if (!vehicleId) return;
    
    setLoading(true);
    try {
      const data = await getVehicleArrival(vehicleId);
      setVehicleData(data);
      
      // Format arrival_time to YYYY-MM-DDTHH:mm
      const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Pre-populate form with vehicle data
      setFormData(prev => ({
        ...prev,
        supplier: data.supplier,
        arrivalTimestamp: formatDateTime(data.arrival_time)
      }));

      // Convert vehicle arrival items to purchase order items
      const poItems: PurchaseOrderItem[] = data.vehicle_arrival_items.map((item: any, index: number) => ({
        id: `item_${index}`,
        productId: item.product_id,
        productName: item.product.name,
        skuId: item.sku_id,
        skuCode: item.sku.code,
        category: item.product.category,
        quantity: item.quantity,
        unitType: item.unit_type,
        totalWeight: item.total_weight,
        commission: commission,
        marketPrice: 0,
        unitPrice: 0,
        total: 0
      }));

      setItems(poItems);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      toast.error('Failed to load vehicle arrival data');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionChange = (value: number) => {
    setCommission(value);
    setItems(prev => prev.map(item => ({
      ...item,
      commission: value,
      total: calculateItemTotal({ ...item, commission: value })
    })));
  };

  const handleItemCommissionChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        commission: value,
        total: calculateItemTotal({ ...item, commission: value })
      } : item
    ));
  };

  const handleItemPriceChange = (id: string, field: 'unitPrice' | 'marketPrice', value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        [field]: value,
        total: calculateItemTotal({ ...item, [field]: value })
      } : item
    ));
  };

  const calculateItemTotal = (item: PurchaseOrderItem): number => {
    if (formData.pricingModel === 'fixed') {
      return (item.unitPrice || 0) * item.quantity;
    }

    const marketPrice = item.marketPrice || 0;
    const commission = item.commission || 0;
    const unitPrice = marketPrice - (marketPrice * commission / 100);
    return unitPrice * item.quantity;
  };

  const calculateUnitPrice = (marketPrice: number, commission: number): number => {
    return marketPrice - (marketPrice * commission / 100);
  };

  const calculateTotalBoxes = (): number => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const calculateSingleAdditionalCost = (cost: AdditionalCost, marketValue: number, totalBoxes: number): number => {
    if (formData.pricingModel === 'fixed' && cost.name !== 'Vehicle Charges') {
      return 0;
    }

    switch (cost.type) {
      case 'per_box':
        return cost.amount * totalBoxes;
      case 'percentage':
        return marketValue * (cost.amount / 100);
      case 'fixed':
        return cost.amount;
      default:
        return 0;
    }
  };

  const calculateAdditionalCosts = (marketValue: number = 0): number => {
    const totalBoxes = calculateTotalBoxes();
    
    return additionalCosts.reduce((total, cost) => {
      return total + calculateSingleAdditionalCost(cost, marketValue, totalBoxes);
    }, 0);
  };

  const handleAdditionalCostChange = (index: number, field: keyof AdditionalCost, value: any) => {
    setAdditionalCosts(prev => {
      const newCosts = [...prev];
      newCosts[index] = {
        ...newCosts[index],
        [field]: field === 'amount' ? Number(value) : value
      };
      return newCosts;
    });
  };

  const calculateTotalAmount = (): number => {
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    
    if (formData.pricingModel === 'fixed') {
      return itemsTotal + calculateAdditionalCosts(itemsTotal);
    }

    const marketValue = items.reduce((sum, item) => sum + ((item.marketPrice || 0) * item.quantity), 0);
    return itemsTotal + calculateAdditionalCosts(marketValue);
  };

  const handleAddCost = () => {
    if (!newCost.name || newCost.amount <= 0) {
      toast.error('Please enter valid cost details');
      return;
    }
    setAdditionalCosts(prev => [...prev, newCost]);
    setNewCost({ name: '', amount: 0, type: 'fixed' });
  };

  const handleRemoveCost = (index: number) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (products.length === 0) {
      toast.error('No products available. Please add products first.');
      return;
    }

    const newItem: PurchaseOrderItem = {
      id: `item_${Date.now()}`,
      productId: '',
      productName: '',
      skuId: '',
      skuCode: '',
      category: '',
      quantity: 0,
      unitType: 'box',
      totalWeight: 0,
      commission: commission,
      marketPrice: 0,
      unitPrice: 0,
      total: 0
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If product is changed, update related fields
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.category = product.category;
            updatedItem.skuId = '';
            updatedItem.skuCode = '';
          }
        }
        
        // If SKU is changed, update SKU code
        if (field === 'skuId') {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const sku = product.skus.find((s: any) => s.id === value);
            if (sku) {
              updatedItem.skuCode = sku.code;
              updatedItem.unitType = sku.unit_type;
            }
          }
        }

        // Recalculate total
        updatedItem.total = calculateItemTotal(updatedItem);
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier || !formData.arrivalTimestamp) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.skuId || item.quantity <= 0) {
        toast.error('Please complete all item details');
        return;
      }

      if (formData.pricingModel === 'fixed') {
        if (!item.unitPrice || item.unitPrice <= 0) {
          toast.error('Please enter valid unit prices for all items');
          return;
        }
      } else {
        if (!item.marketPrice || item.marketPrice <= 0) {
          toast.error('Please enter valid market prices for all items');
          return;
        }
      }
    }

    const orderData = {
      ...formData,
      items,
      additionalCosts,
      totalAmount: calculateTotalAmount()
    };

    console.log('Purchase record data:', orderData);
    toast.success('Purchase record created successfully');
    navigate('/record-purchase');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
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
            <h1 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Edit Purchase Record' : 'New Purchase Record'}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Supplier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
                disabled={!!vehicleId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Arrival Timestamp <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.arrivalTimestamp}
                onChange={(e) => setFormData({ ...formData, arrivalTimestamp: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
                disabled={!!vehicleId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pricing Model <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pricingModel}
                onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value as 'commission' | 'fixed' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="commission">Commission Sale</option>
                <option value="fixed">Fixed Price Buy</option>
              </select>
            </div>
          </div>

          {/* Commission Settings */}
          {formData.pricingModel === 'commission' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Commission Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Commission (%)
                </label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => handleCommissionChange(parseFloat(e.target.value))}
                  step="0.1"
                  min="0"
                  max="100"
                  className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Items</h2>
              {!vehicleId && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    {formData.pricingModel === 'commission' ? (
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicleId ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          </div>
                        ) : (
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.category})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicleId ? (
                          <div className="text-sm text-gray-900">{item.skuCode}</div>
                        ) : (
                          <select
                            value={item.skuId}
                            onChange={(e) => handleItemChange(item.id, 'skuId', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            disabled={!item.productId}
                          >
                            <option value="">Select SKU</option>
                            {item.productId && products.find(p => p.id === item.productId)?.skus.map((sku: any) => (
                              <option key={sku.id} value={sku.id}>
                                {sku.code}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicleId ? (
                          <div className="text-sm text-gray-900">
                            {item.quantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                            min="0"
                            step="1"
                            className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalWeight} kg
                      </td>
                      {formData.pricingModel === 'commission' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={item.marketPrice || ''}
                              onChange={(e) => handleItemPriceChange(item.id, 'marketPrice', parseFloat(e.target.value))}
                              step="0.1"
                              min="0"
                              className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={item.commission}
                              onChange={(e) => handleItemCommissionChange(item.id, parseFloat(e.target.value))}
                              step="0.1"
                              min="0"
                              max="100"
                              className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{calculateUnitPrice(item.marketPrice || 0, item.commission || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemPriceChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                            className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!vehicleId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={formData.pricingModel === 'commission' ? 7 : 5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Items Subtotal:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. {!vehicleId && 'Click "Add Item" to get started.'}
              </div>
            )}
          </div>

          {/* Additional Costs */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Costs</h2>
            
            <div className="space-y-2 mb-4">
              {additionalCosts
                .filter(cost => formData.pricingModel !== 'fixed' || cost.name === 'Vehicle Charges')
                .map((cost, index) => {
                  const originalIndex = additionalCosts.findIndex(c => c.name === cost.name);
                  const costValue = calculateSingleAdditionalCost(cost, 
                    items.reduce((sum, item) => sum + ((item.marketPrice || 0) * item.quantity), 0),
                    calculateTotalBoxes()
                  );

                  return (
                    <div key={cost.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700 w-32">{cost.name}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => handleAdditionalCostChange(originalIndex, 'amount', e.target.value)}
                            className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            step={cost.type === 'percentage' ? '0.1' : '1'}
                            min="0"
                          />
                          <select
                            value={cost.type}
                            onChange={(e) => handleAdditionalCostChange(originalIndex, 'type', e.target.value as any)}
                            className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="fixed">Fixed (₹)</option>
                            <option value="per_box">Per Box (₹/box)</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{costValue.toFixed(2)}
                        </span>
                        {cost.name !== 'Vehicle Charges' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCost(originalIndex)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-end space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Name</label>
                <input
                  type="text"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  className="mt-1 block w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Transport Cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={newCost.type}
                  onChange={(e) => setNewCost({ ...newCost, type: e.target.value as 'fixed' | 'percentage' | 'per_box' })}
                  className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="per_box">Per Box (₹)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddCost}
                className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total Summary */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span className="text-gray-900">₹{items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                </div>
                {additionalCosts
                  .filter(cost => formData.pricingModel !== 'fixed' || cost.name === 'Vehicle Charges')
                  .map((cost, index) => {
                    const costValue = calculateSingleAdditionalCost(
                      cost,
                      items.reduce((sum, item) => sum + ((item.marketPrice || 0) * item.quantity), 0),
                      calculateTotalBoxes()
                    );
                    
                    return (
                      <div key={cost.name} className="flex justify-between text-sm">
                        <span className="text-gray-600">{cost.name}:</span>
                        <span className="text-gray-900">
                          ₹{costValue.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">₹{calculateTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/record-purchase')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {initialData ? 'Update Purchase Record' : 'Create Purchase Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRecordPurchase;