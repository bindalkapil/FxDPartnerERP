import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Trash2, Building, Calendar, DollarSign, Package }  from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPurchaseRecord, updatePurchaseRecord, getSuppliers } from '../../lib/api';

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

interface PurchaseRecordData {
  id: string;
  vehicle_arrival_id: string | null;
  supplier_id: string | null;
  record_number: string;
  supplier: string;
  record_date: string;
  arrival_timestamp: string;
  pricing_model: string;
  default_commission: number | null;
  payment_terms: number | null;
  items_subtotal: number;
  additional_costs_total: number;
  total_amount: number;
  status: string;
  notes: string | null;
  vehicle_arrival_items?: Array<{
    id: string;
    product_id: string;
    sku_id: string;
    quantity: number;
    final_quantity?: number;
    total_weight: number;
    final_total_weight?: number;
    unit_type: string;
  }>;
  purchase_record_items: Array<{
    id: string;
    purchase_record_id: string;
    product_id: string;
    sku_id: string;
    product_name: string;
    sku_code: string;
    category: string;
    quantity: number;
    unit_type: string;
    total_weight: number;
    market_price: number | null;
    commission: number | null;
    unit_price: number;
    total: number;
    created_at: string | null;
    updated_at: string | null;
  }>;
  purchase_record_costs: Array<{
    id: string;
    purchase_record_id: string;
    name: string;
    amount: number;
    type: string;
    calculated_amount: number | null;
    created_at: string | null;
    updated_at: string | null;
  }>;
}

interface Supplier {
  id: string;
  company_name: string;
  payment_terms: number;
}

const EditRecordPurchase: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recordData, setRecordData] = useState<PurchaseRecordData | null>(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    recordNumber: '',
    supplier: '',
    recordDate: '',
    arrivalTimestamp: '',
    pricingModel: 'commission',
    defaultCommission: 8,
    paymentTerms: 30,
    notes: ''
  });

  const [items, setItems] = useState<PurchaseRecordItem[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);

  useEffect(() => {
    if (id) {
      loadRecordData();
    }
  }, [id]);

  const loadRecordData = async () => {
    if (!id) return;

    try {
      const [recordInfo, suppliersData] = await Promise.all([
        getPurchaseRecord(id),
        getSuppliers()
      ]);

      // Transform the API response to match the expected type
      const transformedRecordInfo: PurchaseRecordData = {
        ...recordInfo,
        purchase_record_costs: recordInfo.purchase_record_costs.map((cost: any) => ({
          ...cost,
          calculated_amount: cost.calculated_amount || null,
          updated_at: cost.updated_at || null
        }))
      };

      setRecordData(transformedRecordInfo);
      setSuppliers(suppliersData || []);

      // Set form data with null checks
      setFormData({
        supplierId: transformedRecordInfo.supplier_id || '',
        recordNumber: transformedRecordInfo.record_number,
        supplier: transformedRecordInfo.supplier,
        recordDate: new Date(transformedRecordInfo.record_date).toISOString().slice(0, 16),
        arrivalTimestamp: new Date(transformedRecordInfo.arrival_timestamp).toISOString().slice(0, 16),
        pricingModel: transformedRecordInfo.pricing_model,
        defaultCommission: transformedRecordInfo.default_commission || 8,
        paymentTerms: transformedRecordInfo.payment_terms || 30,
        notes: transformedRecordInfo.notes || ''
      });

      // Set items, using final_quantity if available from vehicle arrival
      const recordItems = transformedRecordInfo.purchase_record_items.map((item: any) => {
        // If this is from a vehicle arrival, try to get the final quantities
        let quantity = item.quantity;
        let totalWeight = item.total_weight;

        if (transformedRecordInfo.vehicle_arrival_id) {
          // Find the corresponding vehicle arrival item to get final quantities
          const vehicleArrivalItem = transformedRecordInfo.vehicle_arrival_items?.find(
            (vai: any) => vai.product_id === item.product_id && vai.sku_id === item.sku_id
          );
          if (vehicleArrivalItem) {
            quantity = vehicleArrivalItem.final_quantity || quantity;
            totalWeight = vehicleArrivalItem.final_total_weight || totalWeight;
          }
        }

        return {
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        skuId: item.sku_id,
        skuCode: item.sku_code,
        category: item.category,
          quantity,
        unitType: item.unit_type,
          totalWeight,
        marketPrice: item.market_price || 0,
        commission: item.commission || 0,
        unitPrice: item.unit_price,
        total: item.total
        };
      });
      setItems(recordItems);

      // Set additional costs
      const recordCosts = transformedRecordInfo.purchase_record_costs.map((cost: any) => ({
        id: cost.id,
        name: cost.name,
        amount: cost.amount,
        type: cost.type as 'fixed' | 'percentage' | 'per_box',
        calculatedAmount: cost.calculated_amount
      }));
      setAdditionalCosts(recordCosts);

    } catch (error) {
      console.error('Error loading purchase record:', error);
      toast.error('Failed to load purchase record data');
      navigate('/record-purchase');
    } finally {
      setLoading(false);
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
    return calculateItemsSubtotal() + calculateAdditionalCostsTotal();
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

      // Update purchase record
      const recordUpdateData = {
        supplier_id: formData.supplierId,
        record_number: formData.recordNumber,
        supplier: formData.supplier,
        record_date: formData.recordDate,
        arrival_timestamp: formData.arrivalTimestamp,
        pricing_model: formData.pricingModel,
        default_commission: formData.defaultCommission,
        payment_terms: formData.paymentTerms,
        items_subtotal: itemsSubtotal,
        additional_costs_total: additionalCostsTotal,
        total_amount: totalAmount,
        notes: formData.notes || null
      };

      // Prepare items data
      const itemsData = items.map(item => ({
        id: item.id,
        purchase_record_id: id!,
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
      const costsData = additionalCosts.map(cost => ({
        id: cost.id,
        purchase_record_id: id!,
        name: cost.name,
        amount: cost.amount,
        type: cost.type,
        calculated_amount: cost.calculatedAmount
      }));

      await updatePurchaseRecord(id!, recordUpdateData, itemsData, costsData);
      
      toast.success('Purchase record updated successfully!');
      navigate('/record-purchase');
    } catch (error) {
      console.error('Error updating purchase record:', error);
      toast.error('Failed to update purchase record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading purchase record...</div>
      </div>
    );
  }

  if (!recordData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Purchase record not found</div>
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
            <h1 className="text-2xl font-bold text-gray-800">Edit Purchase Record</h1>
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
                  Record Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recordNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordNumber: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
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
                  Arrival Timestamp
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTimestamp}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalTimestamp: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                          ₹{cost.calculatedAmount?.toFixed(2) || ''}
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
              {isSubmitting ? 'Updating Record...' : 'Update Purchase Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecordPurchase;