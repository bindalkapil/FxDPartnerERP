import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Plus, FileText, Trash2, Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSalesOrders, deleteSalesOrder } from '../../lib/api';
import MobileTable from '../../components/ui/MobileTable';

interface SalesOrder {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    customer_type: string;
  };
  order_date: string;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_mode: string;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  status: string;
  sale_type: string;
  sales_order_items: Array<{
    product_name: string;
    sku_code: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total_price: number;
  }>;
}

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    try {
      const data = await getSalesOrders();
      
      // Add sale_type to each order and exclude pending approval orders
      const salesWithType = (data || [])
        .filter(order => order.status !== 'pending_approval') // Exclude pending approval orders
        .map(order => ({
          ...order,
          sale_type: order.delivery_date || order.delivery_address ? 'outstation' : 'counter'
        }));
      
      setSales(salesWithType);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await deleteSalesOrder(id);
        setSales(prev => prev.filter(order => order.id !== id));
        toast.success('Sales order deleted successfully');
      } catch (error) {
        console.error('Error deleting sales order:', error);
        toast.error('Failed to delete sales order');
      }
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.order_number.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getSaleTypeColor = (saleType: string) => {
    return saleType === 'outstation' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Dispatch Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'draft':
        return 'Draft';
      case 'pending_approval':
        return 'Pending Approval';
      case 'dispatched':
        return 'Dispatched';
      case 'delivered':
        return 'Delivered';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPaymentModeDisplay = (mode: string) => {
    switch (mode) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'cash':
        return 'Cash';
      case 'credit':
        return 'Credit';
      default:
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Sales Management</h1>
        </div>
        <button 
          onClick={() => navigate('/sales/new')}
          className="bg-green-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Sale
        </button>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{sales.reduce((sum, sale) => sum + (sale.total_amount ?? 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{sales.length}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Processing Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {sales.filter(sale => sale.status === 'processing').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {sales.filter(sale => sale.status === 'completed' || sale.status === 'delivered').length}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <MobileTable
        columns={[
          {
            key: 'orderDetails',
            label: 'Order Details',
            mobileLabel: 'Order',
            render: (_, sale) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{sale.order_number}</div>
                  <div className="text-sm text-gray-500">{formatDateTime(sale.order_date)}</div>
                  {sale.delivery_date && (
                    <div className="text-sm text-gray-500">Delivery: {formatDateTime(sale.delivery_date)}</div>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'customer',
            label: 'Customer',
            mobileLabel: 'Customer',
            render: (_, sale) => (
              <div>
                <div className="text-sm text-gray-900">{sale.customer.name}</div>
                <div className="text-sm text-gray-500 capitalize">{sale.customer.customer_type}</div>
              </div>
            )
          },
          {
            key: 'items',
            label: 'Items',
            mobileLabel: 'Items',
            render: (_, sale) => (
              <div className="text-sm text-gray-900">
                {sale.sales_order_items.slice(0, 2).map((item: any, index: number) => (
                  <div key={index}>
                    {item.product_name} - {item.quantity} {item.unit_type === 'box' ? 'boxes' : 'kg'}
                  </div>
                ))}
                {sale.sales_order_items.length > 2 && (
                  <div className="text-sm text-gray-500">
                    +{sale.sales_order_items.length - 2} more items
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'total',
            label: 'Total',
            mobileLabel: 'Total',
            render: (_, sale) => (
              <div>
                <div className="text-sm text-gray-900">₹{(sale.total_amount ?? 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">{getPaymentModeDisplay(sale.payment_mode)}</div>
              </div>
            )
          },
          {
            key: 'saleType',
            label: 'Sale Type',
            mobileLabel: 'Type',
            render: (_, sale) => (
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSaleTypeColor(sale.sale_type)}`}>
                {sale.sale_type === 'outstation' ? 'Outstation' : 'Counter'}
              </span>
            )
          },
          {
            key: 'status',
            label: 'Status',
            mobileLabel: 'Status',
            render: (_, sale) => (
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                {getStatusDisplayText(sale.status)}
              </span>
            )
          },
          {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Actions',
            render: (_, sale) => (
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate(`/sales/view/${sale.id}`)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {(sale.status === 'draft' || sale.status === 'processing') && (
                  <button 
                    onClick={() => navigate(`/sales/edit/${sale.id}`)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                    title="Edit Order"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                  className="text-green-600 hover:text-green-900 text-sm"
                  title="Generate Invoice"
                >
                  <FileText className="h-4 w-4" />
                </button>
                {sale.status === 'draft' && (
                  <button 
                    onClick={() => handleDeleteOrder(sale.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={filteredSales}
        loading={loading}
        emptyState={
          <div className="py-12 text-center text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Orders Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {sales.length === 0 
                ? "Get started by creating your first sales order."
                : "No orders match your current search criteria."
              }
            </p>
            {sales.length === 0 && (
              <button
                onClick={() => navigate('/sales/new')}
                className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Create First Sales Order
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default Sales;
