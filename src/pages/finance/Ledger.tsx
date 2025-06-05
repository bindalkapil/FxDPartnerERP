import React, { useState } from 'react';
import { BookOpen, Search, Filter, Download, Eye, FileText } from 'lucide-react';

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

const mockLedger: LedgerEntry[] = [
  {
    id: 'LE001',
    date: '2025-06-18',
    description: 'Payment received from Fresh Mart',
    type: 'credit',
    amount: 16000,
    balance: 16000,
    reference: 'SO001',
    category: 'Sales'
  },
  {
    id: 'LE002',
    date: '2025-06-18',
    description: 'Payment to Green Farms for apple delivery',
    type: 'debit',
    amount: 25000,
    balance: -9000,
    reference: 'PO001',
    category: 'Purchase'
  },
  {
    id: 'LE003',
    date: '2025-06-18',
    description: 'Commission paid to agent',
    type: 'debit',
    amount: 1500,
    balance: -10500,
    reference: 'EX001',
    category: 'Expense'
  }
];

const Ledger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>(mockLedger);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesType = selectedType === 'all' || entry.type === selectedType;
    
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      matchesDate = 
        entry.date >= dateRange.from &&
        entry.date <= dateRange.to;
    }
    
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  const categories = Array.from(new Set(entries.map(entry => entry.category)));
  
  const totalCredits = filteredEntries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalDebits = filteredEntries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const netBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">General Ledger</h1>
        </div>
        <button 
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          Export Ledger
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credits</p>
              <p className="text-2xl font-bold text-green-600">₹{totalCredits}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Debits</p>
              <p className="text-2xl font-bold text-red-600">₹{totalDebits}</p>
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
                ₹{netBalance}
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
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
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
                  Balance
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
                    {entry.date}
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
                    {entry.type === 'debit' ? `₹${entry.amount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {entry.type === 'credit' ? `₹${entry.amount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(entry.balance)}
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
          <div className="py-6 text-center text-gray-500">
            No ledger entries found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;