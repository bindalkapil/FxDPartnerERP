import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Navbar from '../components/navigation/Navbar';
import { useSidebar } from '../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => {}} // Will be handled by sidebar close button
        />
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top navigation */}
        <Navbar />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;