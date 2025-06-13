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
  Users,
  Plus,
  FileText,
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back!</h1>
            <div className="flex items-center space-x-4 text-green-100">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">{currentDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{currentTime}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors duration-200 flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Add Vehicle
            </button>
            <button className="bg-green-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value="₹45,280" 
          change="+18.2%" 
          trend="up"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          subtitle="vs yesterday"
          sparklineData={[20, 35, 25, 45, 30, 50, 45]}
        />
        <StatCard 
          title="Active Inventory" 
          value="3,720 kg" 
          change="-2.1%" 
          trend="down"
          icon={<Package className="h-6 w-6 text-blue-600" />}
          subtitle="stock levels"
          sparklineData={[40, 35, 30, 25, 28, 32, 30]}
        />
        <StatCard 
          title="Vehicles Today" 
          value="12" 
          change="+25%" 
          trend="up"
          icon={<Truck className="h-6 w-6 text-orange-600" />}
          subtitle="arrivals"
          sparklineData={[8, 10, 6, 12, 9, 15, 12]}
        />
        <StatCard 
          title="Orders Pending" 
          value="28" 
          change="+5.8%" 
          trend="up"
          icon={<ShoppingCart className="h-6 w-6 text-purple-600" />}
          subtitle="to dispatch"
          sparklineData={[25, 30, 28, 35, 32, 30, 28]}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Revenue & Sales Trends</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-lg font-medium">7D</button>
              <button className="px-3 py-1 text-sm text-gray-500 rounded-lg font-medium hover:bg-gray-100">30D</button>
              <button className="px-3 py-1 text-sm text-gray-500 rounded-lg font-medium hover:bg-gray-100">90D</button>
            </div>
          </div>
          <LineChart />
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">₹2.4L</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">₹9.8L</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">15.2%</p>
              <p className="text-sm text-gray-500">Growth Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">Daily Target</p>
                  <p className="text-sm text-gray-500">₹50,000</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">90.6%</p>
                <p className="text-xs text-gray-500">achieved</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">Top Product</p>
                  <p className="text-sm text-gray-500">Apples</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">450kg</p>
                <p className="text-xs text-gray-500">sold today</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">Active Customers</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">142</p>
                <p className="text-xs text-gray-500">+12 new</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            <button className="text-green-600 text-sm font-medium hover:text-green-700">View All</button>
          </div>
          <RecentActivity />
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Alerts</h2>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-600">Bananas below 50kg threshold</p>
                <p className="text-xs text-red-500 mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Payment Due</p>
                <p className="text-sm text-yellow-600">ABC Fruits - ₹15,000</p>
                <p className="text-xs text-yellow-500 mt-1">Due tomorrow</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Vehicle Arrived</p>
                <p className="text-sm text-green-600">KA-01-CD-5678 with mangoes</p>
                <p className="text-xs text-green-500 mt-1">30 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Inventory Status</h2>
          <BarChart />
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-sm text-gray-600">In Stock</span>
              </div>
              <span className="text-sm font-medium text-gray-800">2,840 kg</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500 mr-3"></div>
                <span className="text-sm text-gray-600">Low Stock</span>
              </div>
              <span className="text-sm font-medium text-gray-800">680 kg</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-3"></div>
                <span className="text-sm text-gray-600">Out of Stock</span>
              </div>
              <span className="text-sm font-medium text-gray-800">3 items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
