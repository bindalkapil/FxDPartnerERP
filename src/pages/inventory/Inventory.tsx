import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, RefreshCw, Truck, Calendar, AlertCircle, ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrivals, getSalesOrders, getAvailableInventory } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import MobileTable from '../../components/ui/MobileTable';

interface TimelineEntry {
  id: string;
  date: string;
  type: 'arrival' | 'sale';
  quantity: number;
  weight?: number;
  source: string; // supplier or customer name
  details: string; // vehicle number or order number
  status?: string;
}

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
      
      // Get current inventory data using the API function
      const currentInventory = await getAvailableInventory();
      
      // Debug: Log the current inventory data
      console.log('Current Inventory Data:', currentInventory);
      
      // Get all vehicle arrivals and filter for only completed ones
      const arrivals = (await getVehicleArrivals()).filter(
        (arrival: any) => arrival.status === 'completed' || arrival.status === 'po-created'
      );

      // Get all sales orders
      const salesOrders = await getSalesOrders();
      
      // Create inventory items from current inventory data
      const inventoryArray = currentInventory.map(item => {
        // Debug: Log each inventory item being processed
        console.log(`Processing SKU ${item.sku_code}:`, {
          productName: item.product_name,
          available_quantity: item.available_quantity,
          total_weight: item.total_weight
        });
        
        const inventoryItem: InventoryItem = {
          id: `${item.product_id}_${item.sku_id}`,
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
        };

        // Add historical data from vehicle arrivals
        arrivals.forEach(arrival => {
          if (!arrival.vehicle_arrival_items) return;

          arrival.vehicle_arrival_items.forEach((arrivalItem: any) => {
            if (arrivalItem.product_id === item.product_id && arrivalItem.sku_id === item.sku_id) {
              inventoryItem.totalQuantity += arrivalItem.final_quantity || arrivalItem.quantity;
              inventoryItem.totalWeight += arrivalItem.final_total_weight || arrivalItem.total_weight;
              inventoryItem.arrivalCount += 1;
              inventoryItem.vehicleArrivals.push({
                id: arrival.id,
                arrivalTime: arrival.arrival_time,
                supplier: arrival.supplier,
                vehicleNumber: arrival.vehicle_number,
                quantity: arrivalItem.final_quantity || arrivalItem.quantity,
                weight: arrivalItem.final_total_weight || arrivalItem.total_weight,
                status: arrival.status
              });
            }
          });
        });

        // Add sales order data
        salesOrders.forEach(order => {
          if (!order.sales_order_items) return;

          order.sales_order_items.forEach((orderItem: any) => {
            if (orderItem.product_id === item.product_id && orderItem.sku_id === item.sku_id) {
              inventoryItem.salesOrders.push({
                id: order.id,
                orderNumber: order.order_number,
                orderDate: order.order_date,
                customerName: order.customer.name,
                quantity: orderItem.quantity,
                status: order.status
              });
            }
          });
        });

        // Sort vehicle arrivals and sales orders by date (most recent first)
        inventoryItem.vehicleArrivals.sort((a, b) => 
          new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime()
        );
        inventoryItem.salesOrders.sort((a, b) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );

        // Update lastArrival if there are vehicle arrivals
        if (inventoryItem.vehicleArrivals.length > 0) {
          inventoryItem.lastArrival = inventoryItem.vehicleArrivals[0].arrivalTime;
          inventoryItem.supplier = inventoryItem.vehicleArrivals[0].supplier;
        }

        return inventoryItem;
      });
      
      // Debug: Log the final inventory array
      console.log('Final Inventory Array:', inventoryArray);
      
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

  const createTimelineEntries = (item: InventoryItem): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    // Add arrival entries
    item.vehicleArrivals.forEach((arrival, index) => {
      entries.push({
        id: `arrival-${arrival.id}-${item.skuId}-${index}`,
        date: arrival.arrivalTime,
        type: 'arrival',
        quantity: arrival.quantity,
        weight: arrival.weight,
        source: arrival.supplier,
        details: arrival.id, // Use arrival ID as Purchase Record Number
        status: arrival.status
      });
    });

    // Add sales entries
    item.salesOrders.forEach((order, index) => {
      entries.push({
        id: `sale-${order.id}-${item.skuId}-${index}`,
        date: order.orderDate,
        type: 'sale',
        quantity: order.quantity,
        source: order.customerName,
        details: order.orderNumber,
        status: order.status
      });
    });

    // Sort by date (most recent first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Inventory Management</h1>
        </div>
        <button 
          onClick={loadInventoryData}
          className="bg-green-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Inventory
        </button>
      </div>
      
      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <MobileTable
        columns={[
          {
            key: 'productDetails',
            label: 'Product Details',
            mobileLabel: 'Product',
            render: (_, item) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Package className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                  <div className="text-sm text-gray-500">{item.category}</div>
                </div>
              </div>
            )
          },
          {
            key: 'skuDetails',
            label: 'SKU & Packaging',
            mobileLabel: 'SKU',
            render: (_, item) => (
              <div>
                <div className="text-sm text-gray-900">{item.skuCode}</div>
                <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                  item.unitType === 'box' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.unitType === 'box' ? 'Box/Crate' : 'Loose'}
                </span>
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Current Stock',
            mobileLabel: 'Stock',
            render: (_, item) => (
              <div className="text-sm text-gray-900">
                {item.currentQuantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
              </div>
            )
          },
          {
            key: 'lastActivity',
            label: 'Last Activity',
            mobileLabel: 'Activity',
            render: (_, item) => {
              const lastArrival = item.vehicleArrivals.length > 0 ? item.vehicleArrivals[0] : null;
              const lastSale = item.salesOrders.length > 0 ? item.salesOrders[0] : null;
              
              let activityText = 'No activity';
              let sourceText = '';
              
              if (!lastArrival && !lastSale) {
                activityText = 'No activity';
              } else if (!lastArrival) {
                activityText = `Sale: ${formatDateTime(lastSale!.orderDate)}`;
                sourceText = `To: ${lastSale!.customerName}`;
              } else if (!lastSale) {
                activityText = `Arrival: ${formatDateTime(lastArrival.arrivalTime)}`;
                sourceText = `From: ${lastArrival.supplier}`;
              } else {
                const arrivalDate = new Date(lastArrival.arrivalTime);
                const saleDate = new Date(lastSale.orderDate);
                
                if (arrivalDate > saleDate) {
                  activityText = `Arrival: ${formatDateTime(lastArrival.arrivalTime)}`;
                  sourceText = `From: ${lastArrival.supplier}`;
                } else {
                  activityText = `Sale: ${formatDateTime(lastSale.orderDate)}`;
                  sourceText = `To: ${lastSale.customerName}`;
                }
              }
              
              return (
                <div>
                  <div className="text-sm text-gray-900">{activityText}</div>
                  <div className="text-sm text-gray-500">{sourceText}</div>
                </div>
              );
            }
          },
          {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Actions',
            render: (_, item) => (
              <button
                onClick={() => handleViewHistory(item)}
                className="text-green-600 hover:text-green-900 text-sm font-medium"
              >
                View History
              </button>
            )
          }
        ]}
        data={filteredItems}
        loading={loading}
        emptyState={
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
        }
      />

      {/* History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 pr-4">
                  History for {selectedItem.productName} ({selectedItem.skuCode})
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4">
              {(() => {
                const timelineEntries = createTimelineEntries(selectedItem);
                
                if (timelineEntries.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
                      <p className="text-sm text-gray-500">
                        No arrivals or sales recorded for this inventory item yet.
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Inventory Timeline
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({timelineEntries.length} {timelineEntries.length === 1 ? 'entry' : 'entries'})
                      </span>
                    </h4>
                    
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-4">
                        {timelineEntries.map((entry, index) => {
                          // Calculate running balance after this transaction
                          let runningBalance = selectedItem.currentQuantity;
                          for (let i = 0; i < index; i++) {
                            const prevEntry = timelineEntries[i];
                            if (prevEntry.type === 'arrival') {
                              runningBalance -= prevEntry.quantity;
                            } else {
                              runningBalance += prevEntry.quantity;
                            }
                          }
                          
                          return (
                            <div key={entry.id} className="relative flex items-start">
                              {/* Timeline dot */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                                entry.type === 'arrival' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {entry.type === 'arrival' ? (
                                  <Plus className="h-5 w-5" />
                                ) : (
                                  <Minus className="h-5 w-5" />
                                )}
                              </div>
                              
                              {/* Timeline content */}
                              <div className="ml-4 flex-1 min-w-0">
                                <div className={`rounded-lg p-4 shadow-sm border ${
                                  entry.type === 'arrival' 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        entry.type === 'arrival' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {entry.type === 'arrival' ? (
                                          <>
                                            <Truck className="h-3 w-3 mr-1" />
                                            Arrival
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingCart className="h-3 w-3 mr-1" />
                                            Sale
                                          </>
                                        )}
                                      </span>
                                      <span className="ml-2 text-sm font-medium text-gray-900">
                                        {entry.type === 'arrival' ? '+' : '-'}{entry.quantity} {selectedItem.unitType === 'box' ? 'boxes' : 'kg'}
                                      </span>
                                      <span className="ml-2 text-sm font-semibold text-gray-600">
                                        (Balance: {runningBalance} {selectedItem.unitType === 'box' ? 'boxes' : 'kg'})
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 sm:mt-0">
                                      {formatDateTime(entry.date)}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        {entry.type === 'arrival' ? 'From:' : 'To:'}
                                      </span>
                                      <div className="text-gray-900">{entry.source}</div>
                                    </div>
                                    {entry.type === 'sale' && (
                                      <div>
                                        <span className="font-medium text-gray-700">Order:</span>
                                        <div className="text-gray-900">{entry.details}</div>
                                      </div>
                                    )}
                                    {entry.type === 'arrival' && (
                                      <div>
                                        <span className="font-medium text-gray-700">Purchase Record:</span>
                                        <div className="text-gray-900">{entry.details}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
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
