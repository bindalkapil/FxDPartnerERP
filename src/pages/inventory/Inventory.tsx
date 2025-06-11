import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Truck, Calendar, AlertCircle, ShoppingCart, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrivals, getSalesOrders } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  skuId: string;
  skuCode: string;
  unitType: 'box' | 'loose';
  currentQuantity: number;  // From current_inventory table
  currentWeight: number;    // From current_inventory table
  totalQuantity: number;    // From vehicle arrivals (historical)
  totalWeight: number;      // From vehicle arrivals (historical)
  lastArrival: string;
  arrivalCount: number;
  supplier: string;
  vehicleArrivals: Array<{
    id: string;
    arrivalTime: string;
    supplier: string;
    vehicleNumber: string | null;
    quantity: number;
    weight: number;
    status: string;
  }>;
  salesOrders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    customerName: string;
    quantity: number;
    status: string;
  }>;
}

const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnitType, setSelectedUnitType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Get current inventory data
      const { data: currentInventory, error: currentInventoryError } = await supabase
        .from('current_inventory')
        .select('*')
        .order('product_name');

      if (currentInventoryError) throw currentInventoryError;

      // Get all vehicle arrivals and filter for only completed ones
      const arrivals = (await getVehicleArrivals()).filter(
        (arrival: any) => arrival.status === 'completed' || arrival.status === 'po-created'
      );

      // Get all sales orders
      const salesOrders = await getSalesOrders();
      
      if (!arrivals || arrivals.length === 0) {
        // If no arrivals but we have current inventory, create inventory items from that
        if (currentInventory && currentInventory.length > 0) {
          const inventoryArray = currentInventory.map(item => ({
            id: `${item.product_id}_${item.sku_id}`,
            productId: item.product_id,
            productName: item.product_name,
            category: item.category,
            skuId: item.sku_id,
            skuCode: item.sku_code,
            unitType: item.unit_type as 'box' | 'loose',
            currentQuantity: item.available_quantity,
            currentWeight: item.total_weight,
            totalQuantity: item.available_quantity,
            totalWeight: item.total_weight,
            lastArrival: item.last_updated_at,
            arrivalCount: 0,
            supplier: 'N/A',
            vehicleArrivals: [],
            salesOrders: []
          }));
          setInventoryItems(inventoryArray);
          return;
        }
        setInventoryItems([]);
        return;
      }

      // Group items by product and SKU to create inventory
      const inventoryMap = new Map<string, InventoryItem>();

      // First, populate with current inventory data
      if (currentInventory) {
        currentInventory.forEach(item => {
          const key = `${item.product_id}_${item.sku_id}`;
          inventoryMap.set(key, {
            id: key,
            productId: item.product_id,
            productName: item.product_name,
            category: item.category,
            skuId: item.sku_id,
            skuCode: item.sku_code,
            unitType: item.unit_type as 'box' | 'loose',
            currentQuantity: item.available_quantity,
            currentWeight: item.total_weight,
            totalQuantity: 0,
            totalWeight: 0,
            lastArrival: item.last_updated_at,
            arrivalCount: 0,
            supplier: 'N/A',
            vehicleArrivals: [],
            salesOrders: []
          });
        });
      }

      // Then, add historical data from vehicle arrivals
      arrivals.forEach(arrival => {
        if (!arrival.vehicle_arrival_items) return;

        arrival.vehicle_arrival_items.forEach((item: any) => {
          const key = `${item.product.id}_${item.sku.id}`;
          const existingItem = inventoryMap.get(key);

          if (existingItem) {
            // Update existing item with arrival data
            existingItem.totalQuantity += item.final_quantity || item.quantity;
            existingItem.totalWeight += item.final_total_weight || item.total_weight;
            existingItem.arrivalCount += 1;
            existingItem.vehicleArrivals.push({
              id: arrival.id,
              arrivalTime: arrival.arrival_time,
              supplier: arrival.supplier,
              vehicleNumber: arrival.vehicle_number,
              quantity: item.final_quantity || item.quantity,
              weight: item.final_total_weight || item.total_weight,
              status: arrival.status
            });
          } else {
            // Create new inventory item
            inventoryMap.set(key, {
              id: key,
              productId: item.product.id,
              productName: item.product.name,
              category: item.product.category,
              skuId: item.sku.id,
              skuCode: item.sku.code,
              unitType: item.unit_type as 'box' | 'loose',
              currentQuantity: 0,
              currentWeight: 0,
              totalQuantity: item.final_quantity || item.quantity,
              totalWeight: item.final_total_weight || item.total_weight,
              lastArrival: arrival.arrival_time,
              arrivalCount: 1,
              supplier: arrival.supplier,
              vehicleArrivals: [{
                id: arrival.id,
                arrivalTime: arrival.arrival_time,
                supplier: arrival.supplier,
                vehicleNumber: arrival.vehicle_number,
                quantity: item.final_quantity || item.quantity,
                weight: item.final_total_weight || item.total_weight,
                status: arrival.status
              }],
              salesOrders: []
            });
          }
        });
      });

      // Add sales order data
      salesOrders.forEach(order => {
        if (!order.sales_order_items) return;

        order.sales_order_items.forEach((item: any) => {
          const key = `${item.product_id}_${item.sku_id}`;
          const existingItem = inventoryMap.get(key);

          if (existingItem) {
            existingItem.salesOrders.push({
              id: order.id,
              orderNumber: order.order_number,
              orderDate: order.order_date,
              customerName: order.customer.name,
              quantity: item.quantity,
              status: order.status
            });
          }
        });
      });

      // Sort vehicle arrivals and sales orders by date (most recent first) for each item
      inventoryMap.forEach(item => {
        item.vehicleArrivals.sort((a, b) => 
          new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime()
        );
        item.salesOrders.sort((a, b) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        // Update lastArrival if there are vehicle arrivals
        if (item.vehicleArrivals.length > 0) {
          item.lastArrival = item.vehicleArrivals[0].arrivalTime;
          item.supplier = item.vehicleArrivals[0].supplier;
        }
      });

      const inventoryArray = Array.from(inventoryMap.values());
      
      // Sort inventory items by product name
      inventoryArray.sort((a, b) => a.productName.localeCompare(b.productName));
      
      setInventoryItems(inventoryArray);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesUnitType = selectedUnitType === 'all' || item.unitType === selectedUnitType;
    
    return matchesSearch && matchesCategory && matchesUnitType;
  });

  const categories = Array.from(new Set(inventoryItems.map(item => item.category)));
  const unitTypes = Array.from(new Set(inventoryItems.map(item => item.unitType)));

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalInventoryValue = () => {
    return {
      totalItems: inventoryItems.length,
      currentQuantity: inventoryItems.reduce((sum, item) => sum + item.currentQuantity, 0),
      currentWeight: inventoryItems.reduce((sum, item) => sum + item.currentWeight, 0),
      totalQuantity: inventoryItems.reduce((sum, item) => sum + item.totalQuantity, 0),
      totalWeight: inventoryItems.reduce((sum, item) => sum + item.totalWeight, 0),
      totalArrivals: inventoryItems.reduce((sum, item) => sum + item.arrivalCount, 0)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'po-created':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'po-created':
        return 'PO Created';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const inventoryStats = getTotalInventoryValue();

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          </div>
          <button 
            onClick={loadInventoryData}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <p className="text-sm font-medium text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.currentQuantity}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Weight</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.currentWeight} kg</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Arrivals</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalArrivals}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Historical</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalQuantity}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search inventory..."
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
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedUnitType}
            onChange={(e) => setSelectedUnitType(e.target.value)}
          >
            <option value="all">All Packaging Types</option>
            {unitTypes.map(type => (
              <option key={type} value={type}>{type === 'box' ? 'Box/Crate' : 'Loose'}</option>
            ))}
          </select>
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
                  Current Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Historical Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Arrival
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                        {expandedItem === item.id ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.skuCode}</div>
                      <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                        item.unitType === 'box' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.unitType === 'box' ? 'Box/Crate' : 'Loose'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentQuantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {item.currentWeight} kg
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.totalQuantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {item.totalWeight} kg
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        {item.arrivalCount} arrivals
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(item.lastArrival)}</div>
                      <div className="text-sm text-gray-500">From: {item.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHistory(item);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                  {expandedItem === item.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Truck className="h-4 w-4 mr-2" />
                            Arrival History for {item.productName} ({item.skuCode})
                          </h4>
                          <div className="space-y-3">
                            {item.vehicleArrivals.map((arrival, index) => (
                              <div key={index} className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-700">Arrival Date:</span>
                                    <div className="text-gray-900">{formatDateTime(arrival.arrivalTime)}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Supplier:</span>
                                    <div className="text-gray-900">{arrival.supplier}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Vehicle:</span>
                                    <div className="text-gray-900">{arrival.vehicleNumber || 'Not specified'}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Quantity:</span>
                                    <div className="text-gray-900">
                                      {arrival.quantity} {item.unitType === 'box' ? 'boxes' : 'kg'} 
                                      ({arrival.weight} kg total)
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Status:</span>
                                    <div>
                                      <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${getStatusColor(arrival.status)}`}>
                                        {arrival.status.charAt(0).toUpperCase() + arrival.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
                ? "No vehicle arrivals found. Inventory will be populated automatically when vehicle arrivals are recorded."
                : "No items match your current search and filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  History for {selectedItem.productName} ({selectedItem.skuCode})
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* Arrival History */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Arrival History
                </h4>
                <div className="space-y-3">
                  {selectedItem.vehicleArrivals.map((arrival, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Arrival Date:</span>
                          <div className="text-gray-900">{formatDateTime(arrival.arrivalTime)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Supplier:</span>
                          <div className="text-gray-900">{arrival.supplier}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Vehicle:</span>
                          <div className="text-gray-900">{arrival.vehicleNumber || 'Not specified'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span>
                          <div className="text-gray-900">
                            {arrival.quantity} {selectedItem.unitType === 'box' ? 'boxes' : 'kg'} 
                            ({arrival.weight} kg total)
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${getStatusColor(arrival.status)}`}>
                              {arrival.status.charAt(0).toUpperCase() + arrival.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sales History
                </h4>
                <div className="space-y-3">
                  {selectedItem.salesOrders.map((order, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Order Date:</span>
                          <div className="text-gray-900">{formatDateTime(order.orderDate)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Order Number:</span>
                          <div className="text-gray-900">{order.orderNumber}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Customer:</span>
                          <div className="text-gray-900">{order.customerName}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span>
                          <div className="text-gray-900">
                            {order.quantity} {selectedItem.unitType === 'box' ? 'boxes' : 'kg'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusDisplayText(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Package className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Inventory Management Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Current Stock shows the actual available inventory after sales</li>
                <li>Historical Stock shows the total quantity received from all vehicle arrivals</li>
                <li>Inventory is automatically updated when vehicle arrivals are completed or sales are made</li>
                <li>Click on any row to view detailed arrival history for that item</li>
                <li>Use the refresh button to update inventory with the latest data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;