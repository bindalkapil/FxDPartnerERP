import React from 'react';

// This is a placeholder component for Bar Chart
// In a real app, you would use a charting library like Chart.js, Recharts, or Victory
export const BarChart: React.FC = () => {
  return (
    <div className="w-full h-64 flex items-end space-x-2 pb-4 px-4">
      {[65, 40, 80, 45, 60, 75, 90, 85].map((value, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-green-500 rounded-t-sm transition-all duration-500" 
            style={{ height: `${value}%` }}
          ></div>
          <div className="text-xs text-gray-500 mt-2">{['A', 'B', 'M', 'G', 'O', 'P', 'K', 'S'][index]}</div>
        </div>
      ))}
    </div>
  );
};

// This is a placeholder component for Line Chart
export const LineChart: React.FC = () => {
  return (
    <div className="w-full h-64 relative">
      <div className="absolute inset-0 flex items-center">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="w-full h-px bg-gray-200"></div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48">
        <svg viewBox="0 0 100 20" className="w-full h-full">
          <path
            d="M0,10 L10,8 L20,15 L30,5 L40,12 L50,7 L60,10 L70,5 L80,12 L90,8 L100,10"
            fill="none"
            stroke="#10B981"
            strokeWidth="0.5"
          />
          <path
            d="M0,10 L10,8 L20,15 L30,5 L40,12 L50,7 L60,10 L70,5 L80,12 L90,8 L100,10"
            fill="url(#gradient)"
            strokeWidth="0"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-2">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
          <div key={month}>{month}</div>
        ))}
      </div>
    </div>
  );
};

// This is a placeholder component for Pie Chart
export const PieChart: React.FC = () => {
  return (
    <div className="w-full h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="20" />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#10B981" 
          strokeWidth="20" 
          strokeDasharray="251.2" 
          strokeDashoffset="146" 
          transform="rotate(-90 50 50)" 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#3B82F6" 
          strokeWidth="20" 
          strokeDasharray="251.2" 
          strokeDashoffset="181" 
          transform="rotate(61 50 50)" 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#FBBF24" 
          strokeWidth="20" 
          strokeDasharray="251.2" 
          strokeDashoffset="206" 
          transform="rotate(151 50 50)" 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#8B5CF6" 
          strokeWidth="20" 
          strokeDasharray="251.2" 
          strokeDashoffset="220" 
          transform="rotate(211 50 50)" 
        />
      </svg>
    </div>
  );
};