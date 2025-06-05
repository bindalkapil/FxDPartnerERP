import React, { useState } from 'react';
import { Package, Search, Filter, Plus, RefreshCw, Edit, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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

// Mock data for product categories and names
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
  
  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = 
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || sku.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || sku.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const calculateInventoryAge = (arrivalDate: string): number => {
    const arrival = new Date(arrivalDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - arrival.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateWeightedAverageAge = (supplierStock: SupplierStock[]): string => {
    if (supplierStock.length === 0) return 'N/A';

    const totalQuantity = supplierStock.reduce((sum, stock) => sum + stock.quantity, 0);
    if (totalQuantity === 0) return 'N/A';

    const weightedAgeSum = supplierStock.reduce((sum, stock) => {
      const age = calculateInventoryAge(stock.arrivalDate);
      return sum + (age * stock.quantity);
    }, 0);

    return `${(weightedAgeSum / totalQuantity).toFixed(1)} days`;
  };

  const calculateTotalValue = (sku: SKU): number => {
    return sku.supplierStock.reduce((total, stock) => total + stock.value, 0);
  };

  const calculateTotalInventoryValue = (): number => {
    return skus.reduce((total, sku) => total + calculateTotalValue(sku), 0);
  };

  const categories = Object.keys(productData);
  const filteredCategories = categories.filter(category => 
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = newSKU.category 
    ? productData[newSKU.category].filter(product => 
        product.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  const handleNewSKU = () => {
    if (!newSKU.category || !newSKU.name || !newSKU.sku || newSKU.suggestedPrice <= 0) {
      toast.error('Please fill in all required fields including a valid selling price');
      return;
    }

    const skuExists = skus.some(sku => sku.sku === newSKU.sku);
    if (skuExists) {
      toast.error('SKU already exists');
      return;
    }

    const newSKUItem: SKU = {
      id: `SKU${skus.length + 1}`.padStart(6, '0'),
      ...newSKU,
      currentStock: 0,
      status: 'active',
      lastUpdated: new Date().toISOString().split('T')[0],
      avgPrice: 0,
      supplierStock: []
    };

    setSKUs(prev => [...prev, newSKUItem]);
    setShowNewSKUModal(false);
    setNewSKU({
      category: '',
      name: '',
      sku: '',
      suggestedPrice: 0,
      priceUnit: 'box'
    });
    toast.success('New SKU created successfully');
  };

  const handleStatusChange = (id: string, newStatus: 'active' | 'inactive') => {
    const sku = skus.find(s => s.id === id);
    if (sku && sku.currentStock > 0 && newStatus === 'inactive') {
      toast.error('Cannot deactivate SKU with existing inventory');
      return;
    }

    setSKUs(prev => prev.map(sku => 
      sku.id === id ? { ...sku, status: newStatus } : sku
    ));
    toast.success(`SKU ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };

  const handleCategorySelect = (category: string) => {
    setNewSKU({ ...newSKU, category, name: '' });
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const handleProductSelect = (product: string) => {
    setNewSKU({ ...newSKU, name: product });
    setProductSearch('');
    setShowProductDropdown(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowManageSKUsModal(true)}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Manage SKUs
          </button>
          <button 
            onClick={() => setShowNewSKUModal(true)}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            New SKU
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-800">{skus.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active SKUs</p>
              <p className="text-2xl font-bold text-gray-800">
                {skus.filter(sku => sku.status === 'active').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-800">
                {skus.filter(sku => sku.currentStock === 0).length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{calculateTotalInventoryValue().toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search SKUs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Age
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSKUs.map((sku) => (
                <React.Fragment key={sku.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedSKU(expandedSKU === sku.id ? null : sku.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{sku.name}</div>
                          <div className="text-sm text-gray-500">{sku.sku}</div>
                        </div>
                        {expandedSKU === sku.id ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sku.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sku.currentStock}</div>
                      <div className="text-sm text-gray-500">Avg. Price: ₹{sku.avgPrice}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{calculateTotalValue(sku).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateWeightedAverageAge(sku.supplierStock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sku.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sku.status.charAt(0).toUpperCase() + sku.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sku.lastUpdated}
                    </td>
                  </tr>
                  {expandedSKU === sku.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm">
                          <h4 className="font-medium text-gray-900 mb-2">Supplier-wise Inventory</h4>
                          <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase mb-2">
                            <div>Supplier</div>
                            <div>Quantity</div>
                            <div>Arrival Date</div>
                            <div>Age (Days)</div>
                            <div>Value</div>
                            <div>Batch Number</div>
                          </div>
                          {sku.supplierStock.map((stock, index) => (
                            <div key={index} className="grid grid-cols-6 gap-4 py-2 border-t border-gray-200">
                              <div className="text-gray-900">{stock.supplier}</div>
                              <div className="text-gray-900">{stock.quantity}</div>
                              <div className="text-gray-900">{stock.arrivalDate}</div>
                              <div className="text-gray-900">{calculateInventoryAge(stock.arrivalDate)}</div>
                              <div className="text-gray-900">₹{stock.value.toLocaleString()}</div>
                              <div className="text-gray-900">{stock.batchNumber}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSKUs.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No SKUs found.
          </div>
        )}
      </div>

      {showNewSKUModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Create New SKU
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div className="relative">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Product Category
                        </label>
                        <input
                          type="text"
                          id="category"
                          value={categorySearch}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setShowCategoryDropdown(true);
                          }}
                          onFocus={() => setShowCategoryDropdown(true)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Search category..."
                        />
                        {showCategoryDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                            {filteredCategories.map((category) => (
                              <div
                                key={category}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                                onClick={() => handleCategorySelect(category)}
                              >
                                {category}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Product Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          disabled={!newSKU.category}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder={newSKU.category ? "Search product..." : "Select category first"}
                        />
                        {showProductDropdown && newSKU.category && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                            {filteredProducts.map((product) => (
                              <div
                                key={product}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                                onClick={() => handleProductSelect(product)}
                              >
                                {product}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                          Product SKU Code
                        </label>
                        <input
                          type="text"
                          id="sku"
                          value={newSKU.sku}
                          onChange={(e) => setNewSKU({ ...newSKU, sku: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Suggested Selling Price (₹)
                          </label>
                          <input
                            type="number"
                            value={newSKU.suggestedPrice}
                            onChange={(e) => setNewSKU({ ...newSKU, suggestedPrice: parseFloat(e.target.value) })}
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Price Unit
                          </label>
                          <select
                            value={newSKU.priceUnit}
                            onChange={(e) => setNewSKU({ ...newSKU, priceUnit: e.target.value as 'box' | 'kg' })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="box">Per Box</option>
                            <option value="kg">Per Kg</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleNewSKU}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create SKU
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSKUModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageSKUsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Manage SKUs
                  </h3>
                  <button
                
                    onClick={() => setShowManageSKUsModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suggested Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {skus.map((sku) => (
                        <tr key={sku.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{sku.name}</div>
                                <div className="text-sm text-gray-500">{sku.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sku.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sku.currentStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{sku.suggestedPrice}/{sku.priceUnit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sku.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {sku.status.charAt(0).toUpperCase() + sku.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleStatusChange(
                                sku.id,
                                sku.status === 'active' ? 'inactive' : 'active'
                              )}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                sku.status === 'active'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {sku.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;