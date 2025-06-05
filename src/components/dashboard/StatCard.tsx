import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gray-50">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center mt-3">
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-500' : 'text-red-500'
        }`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">vs last period</span>
      </div>
    </div>
  );
};

export default StatCard;