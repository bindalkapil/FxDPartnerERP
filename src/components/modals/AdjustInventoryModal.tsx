import React, { useState, useEffect } from 'react';
import { X, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adjustInventoryAsAnotherSKU, adjustInventoryFromAnotherSource, getAllProductsAndSKUs } from '../../lib/api';

interface AdjustInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: {
    productId: string;
    skuId: string;
    productName: string;
    skuCode: string;
    availableQuantity: number;
  };
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  skus: Array<{
    id: string;
    code: string;
  }>;
}

const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'mark_as_sku' | 'mark_from_source'>('mark_as_sku');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [source, setSource] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getAllProductsAndSKUs();
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    if (adjustmentType === 'mark_as_sku' && (!selectedProductId || !selectedSkuId)) {
      toast.error('Please select a product and SKU');
      return;
    }

    if (adjustmentType === 'mark_from_source' && !source.trim()) {
      toast.error('Please specify the source');
      return;
    }

    try {
      setIsSubmitting(true);

      if (adjustmentType === 'mark_as_sku') {
        await adjustInventoryAsAnotherSKU(
          inventoryItem.productId,
          inventoryItem.skuId,
          selectedProductId,
          selectedSkuId,
          reason
        );
        toast.success('Inventory adjusted successfully');
      } else {
        await adjustInventoryFromAnotherSource(
          inventoryItem.productId,
          inventoryItem.skuId,
          source,
          reason
        );
        toast.success('Inventory source updated successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      toast.error('Failed to adjust inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableSKUs = () => {
    if (!selectedProductId) return [];
    const product = products.find(p => p.id === selectedProductId);
    return product?.skus || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Adjust Inventory
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Adjusting inventory for {inventoryItem.productName} ({inventoryItem.skuCode})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current quantity: {inventoryItem.availableQuantity}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="space-y-4">
                {/* Adjustment Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="mark_as_sku"
                        checked={adjustmentType === 'mark_as_sku'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'mark_as_sku')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mark as another SKU</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="mark_from_source"
                        checked={adjustmentType === 'mark_from_source'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'mark_from_source')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mark inventory from another source</span>
                    </label>
                  </div>
                </div>

                {/* Product and SKU Selection (for mark as another SKU) */}
                {adjustmentType === 'mark_as_sku' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setSelectedSkuId('');
                        }}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select SKU
                      </label>
                      <select
                        value={selectedSkuId}
                        onChange={(e) => setSelectedSkuId(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                        disabled={!selectedProductId}
                      >
                        <option value="">Select a SKU</option>
                        {getAvailableSKUs().map(sku => (
                          <option key={sku.id} value={sku.id}>
                            {sku.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Source Input (for mark from another source) */}
                {adjustmentType === 'mark_from_source' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g., Supplier name, location, etc."
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                )}

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Adjustment
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this adjustment is needed..."
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adjusting...' : 'Adjust Inventory'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustInventoryModal; 