import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Trash2, Building, Calendar, DollarSign, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrivals, createPurchaseRecord, getSuppliers } from '../../lib/api';

interface PurchaseRecordItem {
  id: string;
  productId: string;
  productName: string;
  skuId: string;
  skuCode: string;
  category: string;
  quantity: number;
  unitType: string;
  totalWeight: number;
  marketPrice: number;
  commission: number;
  unitPrice: number;
  total: number;
}

interface AdditionalCost {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage' | 'per_box';
  calculatedAmount: number;
}

interface VehicleArrival {
  id: string;
  supplier: string;
  arrival_time: string;
  vehicle_number: string | null;
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
    };
    quantity: number;
    unit_type: string;
    total_weight: number;
    final_quantity?: number;
    final_total_weight?: number;
  }>;
}

interface Supplier {
  id: string;
  company_name: string;
  payment_terms: number;
}

const NewRecordPurchase: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleIdFromUrl = searchParams.get('vehicleId');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleArrivals, setVehicleArrivals] = useState<VehicleArrival[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vehicleArrivalId: '',
    supplierId: '',
    recordNumber: '',
    supplier: '',
    recordDate: new Date().toISOString().slice(0, 16),
    arrivalTimestamp: '',
    pricingModel: 'commission',
    defaultCommission: 8,
    paymentTerms: 30,
    closureStatus: 'partial_closure',
    closureNotes: '',
    notes: ''
  });

  const [items, setItems] = useState<PurchaseRecordItem[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-populate from URL parameter
  useEffect(() => {
    if (vehicleIdFromUrl && vehicleArrivals.length > 0) {
      const matchingVehicle = vehicleArrivals.find(arrival => arrival.id === vehicleIdFromUrl);
      if (matchingVehicle) {
        handleVehicleArrivalChange(vehicleIdFromUrl);
      }
    }
  }, [vehicleIdFromUrl, vehicleArrivals]);

  const loadInitialData = async () => {
    try {
      const [arrivalsData, suppliersData] = await Promise.all([
        getVehicleArrivals(),
        getSuppliers()
      ]);
      
      // Filter completed arrivals that don't have purchase records yet
      const completedArrivals = arrivalsData?.filter(arrival => 
        arrival.status === 'completed'
      ) || [];
      
      setVehicleArrivals(completedArrivals);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleArrivalChange = (arrivalId: string) => {
    const arrival = vehicleArrivals.find(a => a.id === arrivalId);
    if (arrival) {
      // Find supplier by name
      const supplier = suppliers.find(s => s.company_name === arrival.supplier);
      
      setFormData(prev => ({
        ...prev,
        vehicleArrivalId: arrivalId,
        supplierId: supplier?.id || '',
        supplier: arrival.supplier,
        arrivalTimestamp: arrival.arrival_time,
        paymentTerms: supplier?.payment_terms || 30
      }));

      // Populate items from vehicle arrival using final_quantity
      const arrivalItems = arrival.vehicle_arrival_items.map(item => ({
        id: `item_${Date.now()}_${Math.random()}`,
        productId: item.product.id,
        productName: item.product.name,
        skuId: item.sku.id,
        skuCode: item.sku.code,
        category: item.product.category,
        quantity: item.final_quantity || item.quantity, // Use final_quantity if available, fallback to quantity
        unitType: item.unit_type,
        totalWeight: item.final_total_weight || item.total_weight, // Use final_total_weight if available
        marketPrice: 0,
        commission: formData.defaultCommission,
        unitPrice: 0,
        total: 0
      }));

      setItems(arrivalItems);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId,
        supplier: supplier.company_name,
        paymentTerms: supplier.payment_terms
      }));
    }
  };

  const handleItemChange = (id: string, field: keyof PurchaseRecordItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate unit price and total based on pricing model
        if (formData.pricingModel === 'commission') {
        if (field === 'marketPrice' || field === 'commission') {
            updatedItem.unitPrice = updatedItem.marketPrice * (1 - updatedItem.commission / 100);
          }
        }
        // For fixed price model, unit price is directly entered
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleAddCost = () => {
    const newCost: AdditionalCost = {
      id: `cost_${Date.now()}`,
      name: '',
      amount: 0,
      type: 'fixed',
      calculatedAmount: 0
    };
    setAdditionalCosts(prev => [...prev, newCost]);
  };

  const handleRemoveCost = (id: string) => {
    setAdditionalCosts(prev => prev.filter(cost => cost.id !== id));
  };

  const handleCostChange = (id: string, field: keyof AdditionalCost, value: any) => {
    setAdditionalCosts(prev => prev.map(cost => {
      if (cost.id === id) {
        const updatedCost = { ...cost, [field]: value };
        
        // Calculate the actual cost amount
        const itemsSubtotal = calculateItemsSubtotal();
        const totalBoxes = items.reduce((sum, item) => sum + (item.unitType === 'box' ? item.quantity : 0), 0);
        
        switch (updatedCost.type) {
          case 'fixed':
            updatedCost.calculatedAmount = updatedCost.amount;
            break;
          case 'percentage':
            updatedCost.calculatedAmount = (itemsSubtotal * updatedCost.amount) / 100;
            break;
          case 'per_box':
            updatedCost.calculatedAmount = updatedCost.amount * totalBoxes;
            break;
        }
        
        return updatedCost;
      }
      return cost;
    }));
  };

  const calculateItemsSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateAdditionalCostsTotal = () => {
    return additionalCosts.reduce((sum, cost) => sum + cost.calculatedAmount, 0);
  };

  const calculateTotal = () => {
    return calculateItemsSubtotal() - calculateAdditionalCostsTotal();
  };

  const generateRecordNumber = () => {
    const timestamp = Date.now();
    return `PR-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        toast.error('Please complete all item details with valid values');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const itemsSubtotal = calculateItemsSubtotal();
      const additionalCostsTotal = calculateAdditionalCostsTotal();
      const totalAmount = calculateTotal();

      // Create purchase record
      const recordData = {
        vehicle_arrival_id: formData.vehicleArrivalId || null,
        supplier_id: formData.supplierId,
        record_number: formData.recordNumber || generateRecordNumber(),
        supplier: formData.supplier,
        record_date: formData.recordDate,
        arrival_timestamp: formData.arrivalTimestamp || formData.recordDate,
        pricing_model: formData.pricingModel,
        default_commission: formData.defaultCommission,
        payment_terms: formData.paymentTerms,
        items_subtotal: itemsSubtotal,
        additional_costs_total: additionalCostsTotal,
        total_amount: totalAmount,
        status: formData.closureStatus,
        closure_date: formData.closureStatus === 'full_closure' ? new Date().toISOString() : null,
        closure_notes: formData.closureStatus === 'full_closure' ? formData.closureNotes || null : null,
        notes: formData.notes || null
      };

      // Prepare items data
      const itemsData = items.map(item => ({
        purchase_record_id: '',
        product_id: item.productId,
        sku_id: item.skuId,
        product_name: item.productName,
        sku_code: item.skuCode,
        category: item.category,
        quantity: item.quantity,
        unit_type: item.unitType,
        total_weight: item.totalWeight,
        market_price: item.marketPrice,
        commission: item.commission,
        unit_price: item.unitPrice,
        total: item.total
      }));

      // Prepare costs data
      const additionalCostsData = additionalCosts.map(cost => ({
        purchase_record_id: '',
        name: cost.name,
        amount: cost.amount,
        type: cost.type,
        calculated_amount: cost.calculatedAmount
      }));

      await createPurchaseRecord(recordData, itemsData, additionalCostsData);
      
      toast.success('Purchase record created successfully!');
      navigate('/record-purchase');
    } catch (error) {
      console.error('Error creating purchase record:', error);
      toast.error('Failed to create purchase record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDefaultCommissionChange = (value: number) => {
    // Update the form data
    setFormData(prev => ({ ...prev, defaultCommission: value }));
    
    // Update commission for all items
    setItems(prev => prev.map(item => {
      const updatedItem = { ...item, commission: value };
      // Recalculate unit price based on new commission
      if (formData.pricingModel === 'commission') {
        updatedItem.unitPrice = updatedItem.marketPrice * (1 - value / 100);
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
      }
      return updatedItem;
    }));
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
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">New Purchase Record</h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Arrival (Optional)
                </label>
                <select
                  value={formData.vehicleArrivalId}
                  onChange={(e) => handleVehicleArrivalChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select vehicle arrival (optional)</option>
                  {vehicleArrivals.map(arrival => (
                    <option key={arrival.id} value={arrival.id}>
                      {arrival.supplier} - {new Date(arrival.arrival_time).toLocaleDateString()} 
                      {arrival.vehicle_number && ` (${arrival.vehicle_number})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Record Number
                </label>
                <input
                  type="text"
                  value={formData.recordNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordNumber: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Record Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.recordDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                
                <label className="block text-sm font-medium text-gray-700">
                  Pricing Model
                </label>
                <select
                  value={formData.pricingModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricingModel: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="commission">Commission Based</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>

              {formData.pricingModel === 'commission' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Default Commission (%)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultCommission}
                    onChange={(e) => handleDefaultCommissionChange(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Closure Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.closureStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, closureStatus: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="partial_closure">Partial Closure (Editable)</option>
                  <option value="full_closure">Full Closure (Read-only)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.closureStatus === 'partial_closure' 
                    ? 'Record can be edited later but is treated as completed for finance.'
                    : 'Record cannot be edited once created. Choose this for final records.'
                  }
                </p>
              </div>

              {formData.closureStatus === 'full_closure' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Closure Notes (Optional)
                  </label>
                  <textarea
                    value={formData.closureNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, closureNotes: e.target.value }))}
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Add notes about why this record is being fully closed..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Purchase Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">{item.skuCode} • {item.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.quantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.totalWeight} kg total
                        </div>
                      </td>
                      {formData.pricingModel === 'commission' ? (
                        <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.marketPrice}
                          onChange={(e) => handleItemChange(item.id, 'marketPrice', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.commission}
                            onChange={(e) => handleItemChange(item.id, 'commission', Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
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
                              disabled
                            />
                          </td>
                        </>
                      ) : (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter unit price"
                        />
                      </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Select a vehicle arrival to populate items automatically.
              </div>
            )}
          </div>

          {/* Additional Costs */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Additional Costs</h2>
              <button
                type="button"
                onClick={handleAddCost}
                className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Cost
              </button>
            </div>

            {additionalCosts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calculated
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {additionalCosts.map((cost) => (
                      <tr key={cost.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={cost.name}
                            onChange={(e) => handleCostChange(cost.id, 'name', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="Cost name"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={cost.type}
                            onChange={(e) => handleCostChange(cost.id, 'type', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage</option>
                            <option value="per_box">Per Box</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <input
                              type="number"
                              value={cost.amount}
                              onChange={(e) => handleCostChange(cost.id, 'amount', Number(e.target.value))}
                              min="0"
                              step="0.01"
                              className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                            {cost.type === 'percentage' && (
                              <span className="absolute right-2 top-1 text-xs text-gray-500">%</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{cost.calculatedAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveCost(cost.id)}
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
            )}
          </div>

          {/* Summary */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Purchase Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items Subtotal:</span>
                    <span className="text-gray-900">₹{calculateItemsSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Additional Costs:</span>
                    <span className="text-gray-900">₹{calculateAdditionalCostsTotal().toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total Amount:</span>
                    <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
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
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Record...' : 'Create Purchase Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRecordPurchase;
