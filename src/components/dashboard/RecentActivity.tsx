import React from 'react';
import { 
  Package, 
  Truck, 
  ShoppingCart, 
  CreditCard,
  User,
  Users
} from 'lucide-react';

interface ActivityItem {
  id: number;
  type: 'inventory' | 'vehicle' | 'sale' | 'payment' | 'customer' | 'supplier';
  title: string;
  description: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: 1,
    type: 'vehicle',
    title: 'New Vehicle Arrival',
    description: 'Vehicle KA-01-AB-1234 arrived with apple delivery',
    time: '10 minutes ago'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Received',
    description: 'Customer ABC Fruits paid ₹25,000',
    time: '1 hour ago'
  },
  {
    id: 3,
    type: 'inventory',
    title: 'Low Inventory Alert',
    description: 'Banana stock is below minimum threshold',
    time: '3 hours ago'
  },
  {
    id: 4,
    type: 'sale',
    title: 'New Sale Order',
    description: 'XYZ Wholesalers placed an order for 200kg mangoes',
    time: '5 hours ago'
  },
  {
    id: 5,
    type: 'customer',
    title: 'New Customer Added',
    description: 'Fresh Fruits Ltd. was added as a new customer',
    time: '1 day ago'
  }
];

const getActivityIcon = (type: string) => {
  switch(type) {
    case 'inventory':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'vehicle':
      return <Truck className="h-4 w-4 text-orange-500" />;
    case 'sale':
      return <ShoppingCart className="h-4 w-4 text-purple-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-green-500" />;
    case 'customer':
      return <User className="h-4 w-4 text-indigo-500" />;
    case 'supplier':
      return <Users className="h-4 w-4 text-red-500" />;
    default:
      return <Package className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityBgColor = (type: string) => {
  switch(type) {
    case 'inventory':
      return 'bg-blue-50';
    case 'vehicle':
      return 'bg-orange-50';
    case 'sale':
      return 'bg-purple-50';
    case 'payment':
      return 'bg-green-50';
    case 'customer':
      return 'bg-indigo-50';
    case 'supplier':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

const RecentActivity: React.FC = () => {
  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className={`p-3 rounded-lg border border-gray-100 ${getActivityBgColor(activity.type)} hover:shadow-sm transition-all duration-200`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {activity.title}
              </p>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">
                {activity.time}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
