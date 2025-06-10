import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, FileText, Edit, Package, User, Phone, Calendar, MapPin, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getVehicleArrival } from '../../lib/api';

interface VehicleArrivalData {
  id: string;
  vehicle_number: string | null;
  supplier: string;
  driver_name: string | null;
  driver_contact: string | null;
  arrival_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle_arrival_items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      category: string;
    };
    sku: {
      id: string;
      code: string;
      unit_type: string;
    };
    quantity: number;
    total_weight: number;
    unit_type: string;
    final_quantity?: number;
    final_total_weight?: number;
  }>;
  vehicle_arrival_attachments: Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    created_at: string;
  }>;
}

const ViewVehicleArrival: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState<VehicleArrivalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadVehicleData();
    }
  }, [id]);

  const loadVehicleData = async () => {
    if (!id) return;
    
    try {
      const data = await getVehicleArrival(id);
      setVehicleData(data);
    } catch (error) {
      console.error('Error loading vehicle arrival:', error);
      toast.error('Failed to load vehicle arrival data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'po-created':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'po-created':
        return 'Record Created';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment: VehicleArrivalData['vehicle_arrival_attachments'][0]) => {
    // In a real app, this would handle file download
    window.open(attachment.file_url, '_blank');
  };

  const canEdit = () => {
    return vehicleData && vehicleData.status !== 'po-created' && vehicleData.status !== 'cancelled';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicle arrival...</div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Vehicle arrival not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vehicle-arrival')}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Vehicle Arrival Details</h1>
          </div>
        </div>
        <div className="flex space-x-3">
          {canEdit() && (
            <button
              onClick={() => navigate(`/vehicle-arrival/edit/${id}`)}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
          {vehicleData.status === 'completed' && (
            <button
              onClick={() => navigate(`/record-purchase/new?vehicleId=${id}`)}
              className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <FileText className="h-4 w-4 mr-1" />
              Create Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Truck className="h-5 w-5 text-green-600 mr-2" />
                Vehicle Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle Number</label>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{vehicleData.vehicle_number || 'Not Available'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{vehicleData.supplier}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Arrival Time</label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{formatDateTime(vehicleData.arrival_time)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Driver Name</label>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{vehicleData.driver_name || 'Not Available'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Driver Contact</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{vehicleData.driver_contact || 'Not Available'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`inline-flex px-3 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicleData.status)}`}>
                      {getStatusDisplay(vehicleData.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                Products & Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Packaging Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Total Weight
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicleData.vehicle_arrival_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500">{item.product.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sku.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.unit_type === 'box' ? 'Box/Crate' : 'Loose'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.final_quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_weight} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.final_total_weight} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicleData.vehicle_arrival_items.reduce((sum, item) => sum + item.quantity, 0)} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicleData.vehicle_arrival_items.reduce((sum, item) => sum + item.total_weight, 0)} kg
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {vehicleData.notes && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  Additional Notes
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{vehicleData.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Items:</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicleData.vehicle_arrival_items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Quantity:</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicleData.vehicle_arrival_items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Weight:</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicleData.vehicle_arrival_items.reduce((sum, item) => sum + item.total_weight, 0)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(vehicleData.created_at)}
                </span>
              </div>
              {vehicleData.updated_at !== vehicleData.created_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(vehicleData.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {vehicleData.vehicle_arrival_attachments.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  Attachments ({vehicleData.vehicle_arrival_attachments.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {vehicleData.vehicle_arrival_attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size)} • {formatDateTime(attachment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <button
                          onClick={() => handleDownload(attachment)}
                          className="text-green-600 hover:text-green-700 transition-colors duration-200"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(attachment.file_url, '_blank')}
                          className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              {canEdit() && (
                <button
                  onClick={() => navigate(`/vehicle-arrival/edit/${id}`)}
                  className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Arrival
                </button>
              )}
              {vehicleData.status === 'completed' && (
                <button
                  onClick={() => navigate(`/record-purchase/new?vehicleId=${id}`)}
                  className="w-full bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Purchase Record
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVehicleArrival;