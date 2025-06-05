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
  },
  {
    id: 6,
    type: 'supplier',
    title: 'Supplier Payment',
    description: 'Paid ₹35,000 to Green Farms',
    time: '1 day ago'
  }
];

const getActivityIcon = (type: string) => {
  switch(type) {
    case 'inventory':
      return <Package className="h-5 w-5 text-blue-500" />;
    case 'vehicle':
      return <Truck className="h-5 w-5 text-orange-500" />;
    case 'sale':
      return <ShoppingCart className="h-5 w-5 text-purple-500" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case 'customer':
      return <User className="h-5 w-5 text-indigo-500" />;
    case 'supplier':
      return <Users className="h-5 w-5 text-red-500" />;
    default:
      return <Package className="h-5 w-5 text-gray-500" />;
  }
};

const RecentActivity: React.FC = () => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <a href="#" className="font-medium text-gray-900">
                        {activity.title}
                      </a>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>{activity.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;