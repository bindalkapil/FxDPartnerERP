import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Download, Eye, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSalesOrders, getPurchaseRecords } from '../../lib/api';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number;
  reference: string;
  category: string;
}

const Ledger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch both sales orders and purchase records
      const [salesOrders, purchaseRecords] = await Promise.all([
        getSalesOrders(),
        getPurchaseRecords()
      ]);

      const ledgerEntries: LedgerEntry[] = [];

      // Transform sales orders into credit entries
      if (salesOrders) {
        salesOrders.forEach((order: any) => {
          ledgerEntries.push({
            id: `SO-${order.id}`,
            date: order.order_date,
            description: `Sales to ${order.customer?.name || 'Unknown Customer'} - ${order.order_number}`,
            type: 'credit',
            amount: order.total_amount ?? 0,
            balance: 0, // Will be calculated later
            reference: order.order_number,
            category: 'Sales'
          });
        });
      }

      // Transform purchase records into debit entries
      if (purchaseRecords) {
        purchaseRecords.forEach((record: any) => {
          ledgerEntries.push({
            id: `PR-${record.id}`,
            date: record.record_date,
            description: `Purchase from ${record.supplier} - ${record.record_number}`,
            type: 'debit',
            amount: record.total_amount ?? 0,
            balance: 0, // Will be calculated later
            reference: record.record_number,
            category: 'Purchase'
          });
        });
      }

      // Sort entries by date (oldest first) to calculate running balance
      ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      ledgerEntries.forEach(entry => {
        if (entry.type === 'credit') {
          runningBalance += entry.amount;
        } else {
          runningBalance -= entry.amount;
        }
        entry.balance = runningBalance;
      });

      // Sort by date (newest first) for display
      ledgerEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEntries(ledgerEntries);
    } catch (error) {
      console.error('Error loading ledger data:', error);
      setError('Failed to load ledger data. Please check your connection and try again.');
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesType = selectedType === 'all' || entry.type === selectedType;
    
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      matchesDate = 
        entryDate >= dateRange.from &&
        entryDate <= dateRange.to;
    }
    
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  const categories = Array.from(new Set(entries.map(entry => entry.category)));
  
  const totalCredits = filteredEntries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + (entry.amount ?? 0), 0);
    
  const totalDebits = filteredEntries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + (entry.amount ?? 0), 0);
    
  const netBalance = totalCredits - totalDebits;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">General Ledger</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading ledger data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">General Ledger</h1>
          </div>
          <button 
            onClick={loadLedgerData}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">General Ledger</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadLedgerData}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button 
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            Export Ledger
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credits (Sales)</p>
              <p className="text-2xl font-bold text-green-600">₹{(totalCredits ?? 0).toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Debits (Purchases)</p>
              <p className="text-2xl font-bold text-red-600">₹{(totalDebits ?? 0).toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(netBalance ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {netBalance >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
            <div className={`h-10 w-10 flex items-center justify-center rounded-full ${
              netBalance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <select
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="debit">Debit (Purchases)</option>
            <option value="credit">Credit (Sales)</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            placeholder="From date"
          />
          <span className="text-gray-500 self-center">to</span>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            placeholder="To date"
          />
        </div>
      </div>
      
      {/* Ledger Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Running Balance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(entry.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.category === 'Sales' 
                        ? 'bg-green-100 text-green-800'
                        : entry.category === 'Purchase'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {entry.type === 'debit' ? `₹${(entry.amount ?? 0).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {entry.type === 'credit' ? `₹${(entry.amount ?? 0).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(entry.balance ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEntries.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Ledger Entries Found</h3>
            <p className="text-sm text-gray-500">
              {entries.length === 0 
                ? "No sales orders or purchase records found. Ledger entries will appear automatically when you create sales orders and purchase records."
                : "No entries match your current search and filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <BookOpen className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Ledger Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Ledger entries are automatically generated from sales orders and purchase records</li>
                <li>Sales orders appear as credit entries (money coming in)</li>
                <li>Purchase records appear as debit entries (money going out)</li>
                <li>Running balance shows the cumulative effect of all transactions</li>
                <li>Use filters to analyze specific time periods or transaction types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;