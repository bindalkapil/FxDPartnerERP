import React from 'react';
import { BarChart, LineChart, PieChart } from '../../components/charts/Charts';
import StatCard from '../../components/dashboard/StatCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  ShoppingCart,
  Users
} from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <select className="border border-gray-300 rounded-md text-sm p-2 bg-white">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <button className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value="₹2,35,600" 
          change="+12.5%" 
          trend="up"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        />
        <StatCard 
          title="Total Inventory" 
          value="3,720 kg" 
          change="-4.3%" 
          trend="down"
          icon={<Package className="h-6 w-6 text-blue-600" />}
        />
        <StatCard 
          title="Vehicle Arrivals" 
          value="18" 
          change="+8.1%" 
          trend="up"
          icon={<Truck className="h-6 w-6 text-orange-600" />}
        />
        <StatCard 
          title="Sales Orders" 
          value="42" 
          change="+15.2%" 
          trend="up"
          icon={<ShoppingCart className="h-6 w-6 text-purple-600" />}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h2>
          <LineChart />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Status</h2>
          <BarChart />
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <RecentActivity />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Distribution</h2>
          <div className="mb-4">
            <PieChart />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Retailers</span>
              </div>
              <span className="text-sm font-medium">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-600">Wholesalers</span>
              </div>
              <span className="text-sm font-medium">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-600">Restaurants</span>
              </div>
              <span className="text-sm font-medium">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                <span className="text-sm text-gray-600">Others</span>
              </div>
              <span className="text-sm font-medium">12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;