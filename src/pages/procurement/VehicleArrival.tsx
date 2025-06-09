import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Eye, Pencil, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getVehicleArrivals, updateVehicleArrivalStatus } from '../../lib/api';

interface VehicleArrival {
  id: string;
  vehicle_number: string | null;
  supplier: string;
  arrival_time: string;
  status: 'pending' | 'completed' | 'po-created' | 'cancelled';
  notes: string | null;
  vehicle_arrival_items: Array<{
    id: string;
    product: {
      name: string;
      category: string;
    };
    sku: {
      code: string;
    };
    quantity: number;
    total_weight: number;
    unit_type: string;
  }>;
}

interface StatusUpdateData {
  unloadedItems?: Array<{
    id: string;
    name: string;
    originalQuantity: number;
    unloadedQuantity: number;
    unit: string;
    difference: number;
    differenceType: 'exact' | 'shortage' | 'excess';
  }>;
  cancellationReason?: string;
}

const VehicleArrival: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleArrival | null>(null);
  const [statusAction, setStatusAction] = useState<string>('');
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData>({});

  useEffect(() => {
    loadVehicleArrivals();
  }, []);

  const loadVehicleArrivals = async () => {
    try {
      const data = await getVehicleArrivals();
      const typedData = data.map(vehicle => ({
        ...vehicle,
        status: vehicle.status as 'pending' | 'completed' | 'po-created' | 'cancelled'
      }));
      setVehicles(typedData);
    } catch (error) {
      console.error('Error loading vehicle arrivals:', error);
      toast.error('Failed to load vehicle arrivals');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      (vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) || !vehicle.vehicle_number) ||
      vehicle.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'po-created':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'po-created':
        return 'Record Created';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const canUpdateStatus = (status: string) => {
    return status === 'pending' || status === 'completed';
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'pending':
        return 'complete';
      case 'completed':
        return 'create-record';
      default:
        return null;
    }
  };

  const calculateDifference = (original: number, unloaded: number) => {
    const diff = unloaded - original;
    if (diff === 0) return { difference: 0, type: 'exact' as const };
    if (diff < 0) return { difference: Math.abs(diff), type: 'shortage' as const };
    return { difference: diff, type: 'excess' as const };
  };

  const handleStatusUpdate = (vehicle: VehicleArrival, action: string) => {
    setSelectedVehicle(vehicle);
    setStatusAction(action);
    
    if (action === 'complete') {
      // Prepare unloaded items data for confirmation
      setStatusUpdateData({
        unloadedItems: vehicle.vehicle_arrival_items.map((item, index) => {
          const { difference, type } = calculateDifference(item.quantity, item.quantity);
          return {
            id: `item_${index}`,
            name: item.product.name,
            originalQuantity: item.quantity,
            unloadedQuantity: item.quantity, // Default to original quantity
            unit: item.unit_type === 'box' ? 'boxes' : 'kg',
            difference,
            differenceType: type
          };
        })
      });
    } else if (action === 'cancel') {
      setStatusUpdateData({
        cancellationReason: ''
      });
    } else {
      setStatusUpdateData({});
    }
    
    setShowStatusModal(true);
  };

  const updateUnloadedQuantity = (index: number, newQuantity: number) => {
    if (!statusUpdateData.unloadedItems) return;

    const newItems = [...statusUpdateData.unloadedItems];
    const item = newItems[index];
    const { difference, type } = calculateDifference(item.originalQuantity, newQuantity);
    
    newItems[index] = {
      ...item,
      unloadedQuantity: newQuantity,
      difference,
      differenceType: type
    };

    setStatusUpdateData({
      ...statusUpdateData,
      unloadedItems: newItems
    });
  };

  const confirmStatusUpdate = async () => {
    if (!selectedVehicle || !statusAction || !statusUpdateData.unloadedItems) return;

    try {
      if (statusAction === 'complete') {
        console.log('Starting completion process for vehicle:', selectedVehicle);
        console.log('Unloaded items data:', statusUpdateData.unloadedItems);

        // Validate unloaded quantities
        const hasInvalidQuantity = statusUpdateData.unloadedItems.some(
          item => item.unloadedQuantity < 0
        );

        if (hasInvalidQuantity) {
          toast.error('Unloaded quantities cannot be negative');
          return;
        }

        // Prepare final quantities for each item
        const finalQuantities = selectedVehicle.vehicle_arrival_items.map((item, index) => {
          const unloadedItem = statusUpdateData.unloadedItems[index];
          if (!unloadedItem) {
            console.error('Missing unloaded item data for index:', index);
            throw new Error(`Missing unloaded quantity data for item ${item.id}`);
          }
          const finalQuantity = unloadedItem.unloadedQuantity;
          const finalTotalWeight = item.unit_type === 'box' 
            ? finalQuantity * 1 // Assuming 1 kg per box
            : finalQuantity; // For loose items, quantity is weight

          console.log('Preparing final quantity for item:', {
            itemId: item.id,
            originalQuantity: item.quantity,
            finalQuantity,
            finalTotalWeight,
            unitType: item.unit_type
          });

          return {
            item_id: item.id,
            final_quantity: finalQuantity,
            final_total_weight: finalTotalWeight
          };
        });

        console.log('Final quantities prepared:', finalQuantities);

        // Update status with final quantities
        await updateVehicleArrivalStatus(
          selectedVehicle.id, 
          'completed',
          {},
          finalQuantities
        );
        
        console.log('Status update completed successfully');

        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === selectedVehicle.id 
              ? { ...vehicle, status: 'completed' as const }
              : vehicle
          )
        );

        // Show summary of differences if any
        const itemsWithDifferences = statusUpdateData.unloadedItems.filter(item => item.differenceType !== 'exact');
        if (itemsWithDifferences.length > 0) {
          const shortages = itemsWithDifferences.filter(item => item.differenceType === 'shortage');
          const excesses = itemsWithDifferences.filter(item => item.differenceType === 'excess');
          
          let message = 'Vehicle arrival marked as completed';
          if (shortages.length > 0) {
            message += ` with ${shortages.length} shortage(s)`;
          }
          if (excesses.length > 0) {
            message += ` with ${excesses.length} excess(es)`;
          }
          toast.success(message);
        } else {
          toast.success('Vehicle arrival marked as completed - all quantities match exactly');
        }

        // Redirect to Record Purchase creation page with vehicle data
        navigate(`/record-purchase/new?vehicleId=${selectedVehicle.id}`);
        setShowStatusModal(false);
        return;
      } else if (statusAction === 'cancel') {
        await updateVehicleArrivalStatus(selectedVehicle.id, 'cancelled', {
          notes: statusUpdateData.cancellationReason || selectedVehicle.notes
        });
        
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === selectedVehicle.id 
              ? { ...vehicle, status: 'cancelled' as const }
              : vehicle
          )
        );
        toast.success('Vehicle arrival cancelled');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }

    setShowStatusModal(false);
    setSelectedVehicle(null);
    setStatusAction('');
    setStatusUpdateData({});
  };

  const getDifferenceDisplay = (item: StatusUpdateData['unloadedItems'][0]) => {
    if (item.differenceType === 'exact') {
      return <span className="text-green-600 text-xs">✓ Exact match</span>;
    } else if (item.differenceType === 'shortage') {
      return <span className="text-red-600 text-xs">↓ Short by {item.difference} {item.unit}</span>;
    } else {
      return <span className="text-orange-600 text-xs">↑ Excess of {item.difference} {item.unit}</span>;
    }
  };

  const getStatusModalContent = () => {
    if (!selectedVehicle) return null;

    if (statusAction === 'cancel') {
      return (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Cancellation (Optional)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            rows={3}
            value={statusUpdateData.cancellationReason || ''}
            onChange={(e) => setStatusUpdateData({ 
              ...statusUpdateData, 
              cancellationReason: e.target.value 
            })}
            placeholder="Enter reason for cancellation..."
          />
        </div>
      );
    }

    if (statusAction === 'complete') {
      return (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Confirm Unloaded Quantities
            </h4>
            <div className="space-y-3">
              {statusUpdateData.unloadedItems?.map((item, index) => (
                <div key={item.id} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        Original: {item.originalQuantity} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Unloaded:</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unloadedQuantity}
                        onChange={(e) => updateUnloadedQuantity(index, Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                  
                  {/* Difference Display */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      Difference: {item.originalQuantity} → {item.unloadedQuantity}
                    </div>
                    <div>
                      {getDifferenceDisplay(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-xs text-blue-800">
                <strong>Summary:</strong>
                {(() => {
                  const exactMatches = statusUpdateData.unloadedItems?.filter(item => item.differenceType === 'exact').length || 0;
                  const shortages = statusUpdateData.unloadedItems?.filter(item => item.differenceType === 'shortage').length || 0;
                  const excesses = statusUpdateData.unloadedItems?.filter(item => item.differenceType === 'excess').length || 0;
                  
                  return (
                    <div className="space-y-1">
                      <div>✓ {exactMatches} item(s) match exactly</div>
                      {shortages > 0 && <div className="text-red-600">↓ {shortages} item(s) have shortages</div>}
                      {excesses > 0 && <div className="text-orange-600">↑ {excesses} item(s) have excess quantities</div>}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              * You can adjust quantities if there were any discrepancies during unloading
            </div>
          </div>
        </div>
      );
    }

    if (statusAction === 'create-record') {
      return (
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Proceeding will take you to the Record Purchase page where you can set prices and create the purchase record for this vehicle arrival.
          </p>
        </div>
      );
    }

    return null;
  };

  const getModalTitle = () => {
    switch (statusAction) {
      case 'complete':
        return 'Mark as Completed';
      case 'create-record':
        return 'Create Purchase Record';
      case 'cancel':
        return 'Cancel Vehicle Arrival';
      default:
        return 'Update Status';
    }
  };

  const getModalButtonText = () => {
    switch (statusAction) {
      case 'complete':
        return 'Mark as Completed';
      case 'create-record':
        return 'Create Purchase Record';
      case 'cancel':
        return 'Cancel Arrival';
      default:
        return 'Update';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicle arrivals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Arrivals</h1>
        </div>
        <button 
          onClick={() => navigate('/vehicle-arrival/new')}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Arrival
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Arrivals</p>
              <p className="text-2xl font-bold text-gray-800">{vehicles.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-800">
                {vehicles.filter(v => v.status === 'pending').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {vehicles.filter(v => v.status === 'completed').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Record Created</p>
              <p className="text-2xl font-bold text-gray-800">
                {vehicles.filter(v => v.status === 'po-created').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search vehicle number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
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
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(vehicle.arrival_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.supplier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vehicle.vehicle_number || 'Not Available'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {vehicle.vehicle_arrival_items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-500">
                          {item.product.name} ({item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'} - {item.total_weight}kg)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusDisplay(vehicle.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/vehicle-arrival/view/${vehicle.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canUpdateStatus(vehicle.status) && (
                        <>
                          <button 
                            onClick={() => navigate(`/vehicle-arrival/edit/${vehicle.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {getNextAction(vehicle.status) && (
                            <button 
                              onClick={() => handleStatusUpdate(vehicle, getNextAction(vehicle.status)!)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleStatusUpdate(vehicle, 'cancel')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredVehicles.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            No vehicle arrivals found.
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    statusAction === 'cancel' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {statusAction === 'cancel' ? (
                      <X className="h-6 w-6 text-red-600" />
                    ) : (
                      <ArrowRight className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {getModalTitle()}
                    </h3>
                    {getStatusModalContent()}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmStatusUpdate}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    statusAction === 'cancel' 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {getModalButtonText()}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedVehicle(null);
                    setStatusAction('');
                    setStatusUpdateData({});
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleArrival;