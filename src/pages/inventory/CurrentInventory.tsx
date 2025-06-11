import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CurrentInventoryItem {
  id: string;
  product_id: string;
  sku_id: string;
  product_name: string;
  sku_code: string;
  category: string;
  unit_type: 'box' | 'loose';
  available_quantity: number;
  total_weight: number;
  last_updated_at: string;
}

const CurrentInventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<CurrentInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnitType, setSelectedUnitType] = useState('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('current_inventory')
        .select('*')
        .order('product_name');

      if (error) throw error;

      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data. Please check your connection and try again.');
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesUnitType = selectedUnitType === 'all' || item.unit_type === selectedUnitType;
    
    return matchesSearch && matchesCategory && matchesUnitType;
  });

  const categories = Array.from(new Set(inventoryItems.map(item => item.category)));
  const unitTypes = Array.from(new Set(inventoryItems.map(item => item.unit_type)));

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalInventoryValue = () => {
    return {
      totalItems: inventoryItems.length,
      totalQuantity: inventoryItems.reduce((sum, item) => sum + item.available_quantity, 0),
      totalWeight: inventoryItems.reduce((sum, item) => sum + item.total_weight, 0)
    };
  };

  const inventoryStats = getTotalInventoryValue();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Current Inventory</h1>
        </div>
        <button 
          onClick={loadInventoryData}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Inventory
        </button>
      </div>
      
      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalItems}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Available Quantity</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalQuantity}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Weight</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalWeight} kg</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, SKU, or category..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unitType" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type
            </label>
            <select
              id="unitType"
              value={selectedUnitType}
              onChange={(e) => setSelectedUnitType(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="all">All Unit Types</option>
              {unitTypes.map(type => (
                <option key={type} value={type}>{type === 'box' ? 'Box/Crate' : 'Loose'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU & Packaging
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.sku_code}</div>
                    <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                      item.unit_type === 'box' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.unit_type === 'box' ? 'Box/Crate' : 'Loose'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.available_quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Weight: {item.total_weight} kg
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDateTime(item.last_updated_at)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items Found</h3>
            <p className="text-sm text-gray-500">
              {inventoryItems.length === 0 
                ? "No inventory items found. Inventory will be populated automatically when vehicle arrivals are completed."
                : "No items match your current search and filter criteria."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentInventory;

 