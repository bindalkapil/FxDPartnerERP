import React from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface MobileTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (item: any) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

const MobileTable: React.FC<MobileTableProps> = ({
  columns,
  data,
  onRowClick,
  emptyState,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {emptyState || (
          <div className="py-12 text-center text-gray-500">
            <p>No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key] || ''
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.map((item, index) => (
          <div
            key={index}
            className={`p-4 border-b border-gray-200 last:border-b-0 ${
              onRowClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
            }`}
            onClick={() => onRowClick?.(item)}
          >
            <div className="space-y-3">
              {columns.map((column) => {
                // For mobile, always use the render function if available
                const renderedContent = column.render 
                  ? column.render(item[column.key], item)
                  : item[column.key];
                
                // Skip if content is empty
                if (!renderedContent && renderedContent !== 0) return null;
                
                return (
                  <div key={column.key} className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.mobileLabel || column.label}
                    </span>
                    <div className="text-sm text-gray-900">
                      {renderedContent}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTable;
