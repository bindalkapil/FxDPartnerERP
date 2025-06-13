import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  subtitle?: string;
  sparklineData?: number[];
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  subtitle = "vs last period",
  sparklineData = []
}) => {
  const maxValue = Math.max(...sparklineData);
  const minValue = Math.min(...sparklineData);
  const range = maxValue - minValue;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-50">
          {icon}
        </div>
      </div>
      
      {/* Sparkline Chart */}
      {sparklineData.length > 0 && (
        <div className="mb-4">
          <div className="flex items-end space-x-1 h-8">
            {sparklineData.map((value, index) => {
              const height = range > 0 ? ((value - minValue) / range) * 100 : 50;
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    trend === 'up' ? 'bg-green-200' : 'bg-red-200'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
              );
            })}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-semibold ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        </div>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
};

export default StatCard;
