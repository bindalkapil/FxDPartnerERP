import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Eye, Pencil, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getVehicleArrivals, updateVehicleArrivalStatus } from '../../lib/api';

interface VehicleArrival {
  id: string;
  vehicle_number: string | null;
  supplier: string;
  arrival_time: string;
  status: 'in-transit' | 'arrived' | 'unloading' | 'unloaded' | 'po-created' | 'cancelled';
  vehicle_arrival_items: Array<{
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

const VehicleArrival: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleArrival | null>(null);
  const [statusAction, setStatusAction] = useState<string>('');
  const [statusUpdateData, setStatusUpdateData] = useState<{
    time?: string;
    items?: Array<{ name: string; quantity: number; totalWeight: number }>;
  }>({});

  useEffect(() => {
    loadVehicleArrivals();
  }, []);

  const loadVehicleArrivals = async () => {
    try {
      const data = await getVehicleArrivals();
      setVehicles(data);
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
      case 'po-created':
        return 'bg-green-100 text-green-800';
      case 'unloaded':
        return 'bg-blue-100 text-blue-800';
      case 'unloading':
        return 'bg-yellow-100 text-yellow-800';
      case 'arrived':
        return 'bg-indigo-100 text-indigo-800';
      case 'in-transit':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'po-created':
        return 'PO Created';
      case 'in-transit':
        return 'In Transit';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = ['in-transit', 'arrived', 'unloading', 'unloaded', 'po-created'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const handleStatusUpdate = (vehicle: VehicleArrival, action: string) => {
    setSelectedVehicle(vehicle);
    setStatusAction(action);
    setStatusUpdateData({
      time: new Date().toISOString().slice(0, 16),
      items: vehicle.vehicle_arrival_items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        totalWeight: item.total_weight
      }))
    });
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedVehicle || !statusAction) return;

    try {
      if (statusAction === 'next') {
        const nextStatus = getNextStatus(selectedVehicle.status);
        if (!nextStatus) return;

        if (nextStatus === 'po-created') {
          // Redirect to PO creation page with vehicle data
          navigate(`/purchase-orders/new?vehicleId=${selectedVehicle.id}`);
          setShowStatusModal(false);
          return;
        }

        // Validate required data
        if (!statusUpdateData.time) {
          toast.error('Please enter the required time');
          return;
        }

        if (nextStatus === 'unloaded' && !statusUpdateData.items) {
          toast.error('Please confirm all item quantities');
          return;
        }

        await updateVehicleArrivalStatus(selectedVehicle.id, nextStatus);
        
        // Update local state
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === selectedVehicle.id 
              ? { ...vehicle, status: nextStatus as VehicleArrival['status'] }
              : vehicle
          )
        );

        toast.success(`Status updated to ${getStatusDisplay(nextStatus)}`);
      } else {
        await updateVehicleArrivalStatus(selectedVehicle.id, 'cancelled');
        
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === selectedVehicle.id 
              ? { ...vehicle, status: 'cancelled' as VehicleArrival['status'] }
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

  const getStatusModalContent = () => {
    if (!selectedVehicle) return null;

    if (statusAction === 'cancel') {
      return (
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Are you sure you want to cancel this vehicle arrival? This action cannot be undone.
          </p>
        </div>
      );
    }

    const nextStatus = getNextStatus(selectedVehicle.status);
    if (!nextStatus) return null;

    switch (selectedVehicle.status) {
      case 'in-transit':
        return (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Actual Arrival Time
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={statusUpdateData.time}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, time: e.target.value })}
              />
            </div>
          </div>
        );

      case 'arrived':
        return (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unloading Start Time
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={statusUpdateData.time}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, time: e.target.value })}
              />
            </div>
          </div>
        );

      case 'unloading':
        return (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unloading Complete Time
              </label>
              <input
                type="datetime-local"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={statusUpdateData.time}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Received Quantities
              </label>
              <div className="space-y-2">
                {statusUpdateData.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 w-32">{item.name}</span>
                    <input
                      type="number"
                      className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...statusUpdateData.items!];
                        newItems[index] = {
                          ...newItems[index],
                          quantity: parseInt(e.target.value) || 0
                        };
                        setStatusUpdateData({ ...statusUpdateData, items: newItems });
                      }}
                    />
                    <span className="text-sm text-gray-500">boxes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'unloaded':
        return (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Proceeding will take you to the Purchase Order creation page where you can set prices and create the PO.
            </p>
          </div>
        );

      default:
        return null;
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
                      {vehicle.status !== 'po-created' && vehicle.status !== 'cancelled' && (
                        <>
                          <button 
                            onClick={() => navigate(`/vehicle-arrival/edit/${vehicle.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(vehicle, 'next')}
                            className="text-green-600 hover:text-green-900"
                            disabled={!getNextStatus(vehicle.status)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(vehicle, 'cancel')}
                            className="text-red-600 hover:text-red-900"
                          >
                            ✕
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    {statusAction === 'next' ? (
                      <ArrowRight className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <span className="text-red-600 text-xl">✕</span>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {statusAction === 'next' ? 'Update Status' : 'Cancel Vehicle Arrival'}
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
                    statusAction === 'next' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {statusAction === 'next' ? 'Update Status' : 'Cancel Arrival'}
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