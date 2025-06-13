import React from 'react';

// Enhanced Bar Chart with better styling and animations
export const BarChart: React.FC = () => {
  const data = [
    { label: 'Apples', value: 85, color: 'bg-green-500' },
    { label: 'Bananas', value: 40, color: 'bg-yellow-500' },
    { label: 'Mangoes', value: 75, color: 'bg-orange-500' },
    { label: 'Grapes', value: 60, color: 'bg-purple-500' },
    { label: 'Oranges', value: 90, color: 'bg-orange-400' },
    { label: 'Pomegranates', value: 55, color: 'bg-red-500' },
    { label: 'Kiwi', value: 30, color: 'bg-green-400' },
    { label: 'Strawberries', value: 70, color: 'bg-pink-500' }
  ];

  return (
    <div className="w-full h-64">
      <div className="flex items-end justify-between space-x-2 h-48 pb-4 px-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="relative w-full flex flex-col items-center">
              <div 
                className={`w-full ${item.color} rounded-t-lg transition-all duration-700 ease-out hover:opacity-80 shadow-sm`}
                style={{ 
                  height: `${item.value}%`,
                  animationDelay: `${index * 100}ms`
                }}
              ></div>
              <div className="absolute -top-6 text-xs font-medium text-gray-600 bg-white px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                {item.value}%
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center font-medium">
              {item.label.charAt(0)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        {data.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${item.color} mr-1`}></div>
            <span className="text-gray-600 truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Line Chart with gradient and better styling
export const LineChart: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [15, 25, 20, 35, 30, 45, 40, 50, 45, 55, 50, 60];

  return (
    <div className="w-full h-64 relative bg-gradient-to-b from-green-50 to-white rounded-lg p-4">
      {/* Grid Lines */}
      <div className="absolute inset-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <div 
            key={index} 
            className="absolute w-full border-t border-gray-200" 
            style={{ top: `${index * 25}%` }}
          ></div>
        ))}
      </div>
      
      {/* Chart Area */}
      <div className="relative h-48 mt-4">
        <svg viewBox="0 0 100 40" className="w-full h-full">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          
          {/* Area Fill */}
          <path
            d={`M0,${40-data[0]} ${data.map((value, index) => 
              `L${(index * 100) / (data.length - 1)},${40 - value}`
            ).join(' ')} L100,40 L0,40 Z`}
            fill="url(#lineGradient)"
          />
          
          {/* Line */}
          <path
            d={`M0,${40-data[0]} ${data.map((value, index) => 
              `L${(index * 100) / (data.length - 1)},${40 - value}`
            ).join(' ')}`}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data Points */}
          {data.map((value, index) => (
            <circle
              key={index}
              cx={(index * 100) / (data.length - 1)}
              cy={40 - value}
              r="2"
              fill="#10B981"
              stroke="white"
              strokeWidth="2"
              className="hover:r-3 transition-all duration-200"
            />
          ))}
        </svg>
      </div>
      
      {/* X-axis Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
        {months.slice(0, 6).map((month) => (
          <div key={month} className="text-center">{month}</div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Pie Chart with better colors and hover effects
export const PieChart: React.FC = () => {
  const data = [
    { label: 'Retailers', value: 42, color: '#10B981' },
    { label: 'Wholesalers', value: 28, color: '#3B82F6' },
    { label: 'Restaurants', value: 18, color: '#F59E0B' },
    { label: 'Others', value: 12, color: '#8B5CF6' }
  ];

  let cumulativePercentage = 0;

  return (
    <div className="w-full h-48 flex items-center justify-center relative">
      <svg viewBox="0 0 100 100" className="w-full h-full transform hover:scale-105 transition-transform duration-300">
        {data.map((segment, index) => {
          const startAngle = cumulativePercentage * 3.6 - 90;
          const endAngle = (cumulativePercentage + segment.value) * 3.6 - 90;
          const largeArcFlag = segment.value > 50 ? 1 : 0;
          
          const startX = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
          const startY = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
          const endX = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
          const endY = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
          
          const pathData = [
            `M 50 50`,
            `L ${startX} ${startY}`,
            `A 35 35 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');
          
          cumulativePercentage += segment.value;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
          );
        })}
        
        {/* Center Circle */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="white"
          stroke="#E5E7EB"
          strokeWidth="2"
        />
        
        {/* Center Text */}
        <text
          x="50"
          y="47"
          textAnchor="middle"
          className="text-xs font-semibold fill-gray-600"
        >
          Total
        </text>
        <text
          x="50"
          y="57"
          textAnchor="middle"
          className="text-xs font-bold fill-gray-800"
        >
          100%
        </text>
      </svg>
    </div>
  );
};
