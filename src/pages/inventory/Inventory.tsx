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

  // ... (rest of the component implementation remains exactly the same as in the original file)
  // Include all the existing functions, JSX, and modal components

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

  // ... (all remaining code from the original file stays exactly the same)
  // Including all the JSX structure, modals, and other functionality

  return (
    // ... (exact same JSX structure as the original file)
    // Update only the suggested price cell in the Manage SKUs Modal table with:
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
    // ... (rest of the JSX structure remains unchanged)
  );
};

export default Inventory;