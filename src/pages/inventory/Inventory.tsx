import React, { useState, useRef, useEffect } from 'react';
import { Package, Search, Filter, Plus, Trash2, Upload, X, Edit, FileText, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupplierStock {
  supplier: string;
  quantity: number;
  arrivalDate: string;
  batchNumber: string;
  value: number;
}

interface SKU {
  id: string;
  category: string;
  name: string;
  sku: string;
  currentStock: number;
  status: 'active' | 'inactive';
  lastUpdated: string;
  avgPrice: number;
  supplierStock: SupplierStock[];
  suggestedPrice: number;
  priceUnit: 'box' | 'kg';
}

const productData = {
  'Pomegranate': ['POMO MH', 'POMO GJ', 'POMO RJ'],
  'Mango': ['Sindura', 'Alphonso', 'Banganpally'],
  'Imported': ['Washington Apple', 'Kiwi', 'Dragon Fruit']
};

const mockSKUs: SKU[] = [
  {
    id: 'SKU001',
    category: 'Pomegranate',
    name: 'POMO MH',
    sku: 'POMO-MH-001',
    currentStock: 100,
    status: 'active',
    lastUpdated: '2025-06-18',
    avgPrice: 120,
    suggestedPrice: 150,
    priceUnit: 'box',
    supplierStock: [
      {
        supplier: 'Green Farms',
        quantity: 60,
        arrivalDate: '2025-06-15',
        batchNumber: 'GF-001',
        value: 7200
      },
      {
        supplier: 'Fresh Harvests',
        quantity: 40,
        arrivalDate: '2025-06-18',
        batchNumber: 'FH-001',
        value: 4800
      }
    ]
  },
  {
    id: 'SKU002',
    category: 'Mango',
    name: 'Alphonso',
    sku: 'MNG-ALP-001',
    currentStock: 50,
    status: 'active',
    lastUpdated: '2025-06-17',
    avgPrice: 200,
    suggestedPrice: 250,
    priceUnit: 'kg',
    supplierStock: [
      {
        supplier: 'Fresh Harvests',
        quantity: 50,
        arrivalDate: '2025-06-17',
        batchNumber: 'FH-002',
        value: 10000
      }
    ]
  },
  {
    id: 'SKU003',
    category: 'Imported',
    name: 'Washington Apple',
    sku: 'IMP-APP-001',
    currentStock: 0,
    status: 'inactive',
    lastUpdated: '2025-06-16',
    avgPrice: 150,
    suggestedPrice: 180,
    priceUnit: 'box',
    supplierStock: []
  }
];

const Inventory: React.FC = () => {
  const [skus, setSKUs] = useState<SKU[]>(mockSKUs);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showNewSKUModal, setShowNewSKUModal] = useState(false);
  const [showManageSKUsModal, setShowManageSKUsModal] = useState(false);
  const [expandedSKU, setExpandedSKU] = useState<string | null>(null);
  const [newSKU, setNewSKU] = useState({
    category: '',
    name: '',
    sku: '',
    suggestedPrice: 0,
    priceUnit: 'box' as 'box' | 'kg'
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editingSKU, setEditingSKU] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);

  const handlePriceEdit = (skuId: string, currentPrice: number) => {
    setEditingSKU(skuId);
    setEditedPrice(currentPrice);
  };

  const handlePriceSave = (skuId: string) => {
    if (editedPrice <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setSKUs(prev => prev.map(sku => 
      sku.id === skuId 
        ? { ...sku, suggestedPrice: editedPrice }
        : sku
    ));
    setEditingSKU(null);
    toast.success('Price updated successfully');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowNewSKUModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New SKU
          </button>
          <button
            onClick={() => setShowManageSKUsModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Package className="w-5 h-5 mr-2" />
            Manage SKUs
          </button>
        </div>
      </div>

      {showManageSKUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage SKUs</h2>
              <button
                onClick={() => setShowManageSKUsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Suggested Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {skus.map((sku) => (
                    <tr key={sku.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sku.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sku.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sku.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sku.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sku.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sku.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingSKU === sku.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={editedPrice}
                              onChange={(e) => setEditedPrice(parseFloat(e.target.value))}
                              min="0"
                              step="0.01"
                              className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                            <button
                              onClick={() => handlePriceSave(sku.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSKU(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>₹{sku.suggestedPrice}/{sku.priceUnit}</span>
                            <button
                              onClick={() => handlePriceEdit(sku.id, sku.suggestedPrice)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setExpandedSKU(sku.id === expandedSKU ? null : sku.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {sku.id === expandedSKU ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;