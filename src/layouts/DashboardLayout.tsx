import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from '../components/navigation/Sidebar';
import Navbar from '../components/navigation/Navbar';

const DashboardLayout: React.FC = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        // On mobile (< md), no margin. On desktop, margin based on sidebar state
        isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
      }`}>
        {/* Top Navigation */}
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500 border-t">
          <p>© {new Date().getFullYear()} FxD Partner ERP - All rights reserved</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
