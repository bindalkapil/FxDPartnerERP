import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package2, ArrowLeft, FileText, Pencil } from 'lucide-react';

const ViewRecordPurchase: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, this would be fetched from an API
  const orderData = {
    id: 'RP001',
    orderNumber: 'RP-2025-001',
    supplier: 'Green Farms',
    orderDate: '2025-06-18 08:30 AM',
    arrivalTimestamp: '2025-06-18 08:30 AM',
    paymentTerms: 30,
    pricingModel: 'commission',
    status: 'draft',
    items: [
      {
        category: 'Pomegranate',
        name: 'POMO MH',
        sku: 'POMO-MH-001',
        quantity: 100,
        unitType: 'box',
        unitWeight: 10,
        totalWeight: 1000,
        marketPrice: 1500,
        commission: 8,
        unitPrice: 1380,
        total: 138000
      }
    ],
    additionalCosts: [
      { name: 'Labour Cost', amount: 5, type: 'per_box' },
      { name: 'Handling Cost', amount: 3, type: 'per_box' },
      { name: 'APMC Charge', amount: 1, type: 'percentage' },
      { name: 'Vehicle Charges', amount: 2000, type: 'fixed' }
    ],
    totalAmount: 125000
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/record-purchase')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Package2 className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">View Purchase Record</h1>
          </div>
        </div>
        {orderData.status === 'draft' && (
          <button
            onClick={() => navigate(`/record-purchase/edit/${id}`)}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Record
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Record Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Record Number</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.orderNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Record Date</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.orderDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Arrival Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.arrivalTimestamp}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="mt-1 text-sm text-gray-900">{orderData.paymentTerms} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Pricing Model</label>
                <p className="mt-1 text-sm text-gray-900">
                  {orderData.pricingModel === 'commission' ? 'Commission Sale' : 'Fixed Price'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                  orderData.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Packaging Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    {orderData.pricingModel === 'commission' ? (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                      </>
                    ) : null}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unitType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalWeight} kg
                      </td>
                      {orderData.pricingModel === 'commission' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.marketPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.commission}%
                          </td>
                        </>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.unitPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Costs */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Costs</h2>
            <div className="space-y-2">
              {orderData.additionalCosts.map((cost, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{cost.name}</span>
                  <span className="text-gray-900">
                    {cost.amount} {cost.type === 'percentage' ? '%' : cost.type === 'per_box' ? '₹/box' : '₹'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-lg font-medium">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-gray-900">₹{orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRecordPurchase;