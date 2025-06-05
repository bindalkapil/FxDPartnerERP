import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Package2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseOrderItem {
  id: string;
  category: string;
  name: string;
  sku: string;
  quantity: number;
  unitType: string;
  unitWeight: number;
  totalWeight: number;
  commission?: number;
  unitPrice?: number;
  marketPrice?: number;
}

interface AdditionalCost {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage' | 'per_box';
}

interface PurchaseOrderData {
  id: string;
  orderNumber: string;
  supplier: string;
  orderDate: string;
  arrivalTimestamp: string;
  paymentTerms: number;
  pricingModel: 'commission' | 'fixed';
  status: 'draft' | 'completed';
  items: PurchaseOrderItem[];
  additionalCosts: AdditionalCost[];
  totalAmount: number;
}

interface NewPurchaseOrderProps {
  initialData?: PurchaseOrderData;
}

const NewPurchaseOrder: React.FC<NewPurchaseOrderProps> = ({ initialData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleId = queryParams.get('vehicleId');

  const mockVehicleData = {
    id: 'VA001',
    supplier: 'Green Farms',
    arrivalTime: '2025-06-18T08:30',
    items: [
      {
        id: '1',
        category: 'Pomegranate',
        name: 'POMO MH',
        sku: 'POMO-MH-001',
        quantity: 100,
        unitType: 'box',
        unitWeight: 10,
        totalWeight: 1000
      }
    ]
  };

  const mockSupplierData = {
    id: 'SUP001',
    name: 'Green Farms',
    defaultCommission: 8,
    paymentTerms: 30,
    additionalCosts: [
      { name: 'Labour Cost', amount: 5, type: 'per_box' as const },
      { name: 'Handling Cost', amount: 3, type: 'per_box' as const },
      { name: 'APMC Charge', amount: 1, type: 'percentage' as const },
      { name: 'Vehicle Charges', amount: 2000, type: 'fixed' as const }
    ]
  };

  const [formData, setFormData] = useState({
    supplier: initialData?.supplier || '',
    orderDate: initialData?.orderDate || new Date().toISOString().slice(0, 16),
    arrivalTimestamp: initialData?.arrivalTimestamp || '',
    paymentTerms: initialData?.paymentTerms || 0,
    pricingModel: initialData?.pricingModel || 'commission',
    status: initialData?.status || 'draft' as 'draft' | 'completed'
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>(initialData?.items || []);
  const [commission, setCommission] = useState(initialData?.items?.[0]?.commission || 0);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(initialData?.additionalCosts || []);
  const [newCost, setNewCost] = useState({
    name: '',
    amount: 0,
    type: 'fixed' as const | 'percentage' | 'per_box'
  });

  useEffect(() => {
    if (vehicleId && !initialData) {
      setFormData({
        ...formData,
        supplier: mockSupplierData.name,
        arrivalTimestamp: mockVehicleData.arrivalTime,
        paymentTerms: mockSupplierData.paymentTerms
      });
      setItems(mockVehicleData.items.map(item => ({
        ...item,
        commission: mockSupplierData.defaultCommission
      })));
      setCommission(mockSupplierData.defaultCommission);
      setAdditionalCosts(mockSupplierData.additionalCosts);
    }
  }, [vehicleId, initialData]);

  const handleCommissionChange = (value: number) => {
    setCommission(value);
    setItems(prev => prev.map(item => ({
      ...item,
      commission: value
    })));
  };

  const handleItemCommissionChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, commission: value } : item
    ));
  };

  const handleItemPriceChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, unitPrice: value } : item
    ));
  };

  const handleMarketPriceChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, marketPrice: value } : item
    ));
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

  const calculateAdditionalCosts = (marketValue: number = 0): number => {
    const totalBoxes = calculateTotalBoxes();
    
    return additionalCosts.reduce((total, cost) => {
      switch (cost.type) {
        case 'per_box':
          return total + (cost.amount * totalBoxes);
        case 'percentage':
          return total + (marketValue * (cost.amount / 100));
        case 'fixed':
          return total + cost.amount;
        default:
          return total;
      }
    }, 0);
  };

  const calculateTotalAmount = (): number => {
    const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    if (formData.pricingModel === 'fixed') {
      return itemsTotal + calculateAdditionalCosts(itemsTotal);
    }

    const marketValue = items.reduce((sum, item) => sum + ((item.marketPrice || 0) * item.quantity), 0);
    return itemsTotal + calculateAdditionalCosts(marketValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier || !formData.orderDate || !formData.arrivalTimestamp) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.pricingModel === 'fixed') {
      const invalidItems = items.some(item => !item.unitPrice || item.unitPrice <= 0);
      if (invalidItems) {
        toast.error('Please enter valid unit prices for all items');
        return;
      }
    } else {
      const invalidItems = items.some(item => !item.marketPrice || item.marketPrice <= 0);
      if (invalidItems) {
        toast.error('Please enter valid market prices for all items');
        return;
      }
    }

    console.log('Form submitted:', {
      ...formData,
      items,
      commission: formData.pricingModel === 'commission' ? commission : undefined,
      additionalCosts
    });

    toast.success('Purchase order created successfully');
    navigate('/purchase-orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Package2 className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order Date
              </label>
              <input
                type="datetime-local"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Arrival Timestamp
              </label>
              <input
                type="datetime-local"
                value={formData.arrivalTimestamp}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })}
                  className="block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                <span className="ml-2 text-gray-500">Days</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pricing Model
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'completed' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total (₹)
                        </th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price (₹)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total (₹)
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unitType}
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
                              onChange={(e) => handleMarketPriceChange(item.id, parseFloat(e.target.value))}
                              step="0.1"
                              min="0"
                              className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                              className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{calculateUnitPrice(item.marketPrice || 0, item.commission || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{calculateItemTotal(item).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleItemPriceChange(item.id, parseFloat(e.target.value))}
                              step="0.1"
                              min="0"
                              className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{calculateItemTotal(item).toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={formData.pricingModel === 'commission' ? 8 : 6} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Items Subtotal:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Costs</h2>
            
            <div className="space-y-2">
              {additionalCosts.map((cost, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 w-32">{cost.name}</span>
                  <span className="text-sm text-gray-900">
                    {cost.amount} {cost.type === 'percentage' ? '%' : cost.type === 'per_box' ? '₹/box' : '₹'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCost(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-end space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Name</label>
                <input
                  type="text"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  className="mt-1 block w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
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

          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span className="text-gray-900">₹{items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}</span>
                </div>
                {additionalCosts.map((cost, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{cost.name}:</span>
                    <span className="text-gray-900">
                      ₹{(cost.type === 'per_box' 
                        ? cost.amount * calculateTotalBoxes()
                        : cost.type === 'percentage'
                          ? (items.reduce((sum, item) => sum + ((item.marketPrice || 0) * item.quantity), 0) * cost.amount / 100)
                          : cost.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">₹{calculateTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/purchase-orders')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {initialData ? 'Update Purchase Order' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPurchaseOrder;