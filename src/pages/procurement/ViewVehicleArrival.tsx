import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, FileText } from 'lucide-react';

const ViewVehicleArrival: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // In a real app, this would fetch data from an API
  const vehicleData = {
    id: 'VA001',
    vehicleNumber: 'KA-01-AB-1234',
    supplier: 'Green Farms',
    driverName: 'Ramesh Kumar',
    driverContact: '9876543210',
    arrivalTime: '2025-06-18 08:30 AM',
    status: 'po-created',
    items: [
      {
        name: 'POMO MH',
        category: 'Pomegranate',
        sku: 'POMO-MH-001',
        unitType: 'box',
        unitWeight: 10,
        quantity: 100,
        totalWeight: 1000
      }
    ],
    notes: 'Delivery completed on time',
    attachments: [
      { name: 'invoice.pdf', type: 'application/pdf' },
      { name: 'delivery_challan.jpg', type: 'image/jpeg' }
    ]
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vehicle-arrival')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">View Vehicle Arrival</h1>
          </div>
        </div>
        {vehicleData.status !== 'po-created' && vehicleData.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/vehicle-arrival/edit/${id}`)}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            Edit
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 space-y-6">
          {/* Vehicle Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Vehicle Number</label>
                <p className="mt-1 text-sm text-gray-900">{vehicleData.vehicleNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{vehicleData.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Driver Name</label>
                <p className="mt-1 text-sm text-gray-900">{vehicleData.driverName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Driver Contact</label>
                <p className="mt-1 text-sm text-gray-900">{vehicleData.driverContact}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Arrival Time</label>
                <p className="mt-1 text-sm text-gray-900">{vehicleData.arrivalTime}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicleData.status)}`}>
                  {getStatusDisplay(vehicleData.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicleData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unitType === 'box' ? `Box (${item.unitWeight}kg)` : 'Loose'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unitType === 'box' ? 'boxes' : 'kg'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalWeight} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments */}
          {vehicleData.attachments.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {vehicleData.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{attachment.name}</span>
                    </div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {vehicleData.notes && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-sm text-gray-600">{vehicleData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewVehicleArrival;