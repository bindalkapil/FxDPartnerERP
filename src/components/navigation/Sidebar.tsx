import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Truck, ClipboardList, Package, ShoppingCart, Truck as TruckLoading, Users, User, BookOpen, CreditCard, Settings, Home } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  closeSidebar?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, closeSidebar }) => {
  const { isSidebarOpen } = useSidebar();
  
  const handleClick = () => {
    if (window.innerWidth < 768 && closeSidebar) {
      closeSidebar();
    }
  };

  return (
    <NavLink 
      to={to} 
      onClick={handleClick}
      className={({ isActive }) => `
        flex items-center px-4 py-3 text-gray-700 transition-colors duration-200
        ${isActive 
          ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
          : 'hover:bg-gray-100'
        }
        ${!isSidebarOpen && 'justify-center'}
      `}
    >
      <span className={!isSidebarOpen ? 'mr-0' : 'mr-3'}>{icon}</span>
      {isSidebarOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  if (!user) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-full bg-white border-r shadow-sm
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-64 -translate-x-full md:w-20 md:translate-x-0'
          }
        `}
      >
        {/* Sidebar Header */}
        <div 
          className="flex items-center h-16 px-4 border-b cursor-pointer"
          onClick={toggleSidebar}
        >
          <div className="flex items-center">
            <span className="text-green-600">
              <Package size={24} />
            </span>
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-gray-800 ml-2">FxD Partner ERP</h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 overflow-y-auto h-[calc(100vh-4rem)]">
          <NavItem to="/" icon={<Home size={20} />} label="Dashboard" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Procurement</div>}
          <NavItem to="/vehicle-arrival" icon={<Truck size={20} />} label="Vehicle Arrival" closeSidebar={closeSidebar} />
          <NavItem to="/record-purchase" icon={<ClipboardList size={20} />} label="Record Purchase" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Inventory</div>}
          <NavItem to="/inventory" icon={<Package size={20} />} label="Inventory" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Sales</div>}
          <NavItem to="/sales" icon={<ShoppingCart size={20} />} label="Sales" closeSidebar={closeSidebar} />
          <NavItem to="/dispatch" icon={<TruckLoading size={20} />} label="Dispatch" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Financials</div>}
          <NavItem to="/ledger" icon={<BookOpen size={20} />} label="Ledger" closeSidebar={closeSidebar} />
          <NavItem to="/payments" icon={<CreditCard size={20} />} label="Payments" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Partners</div>}
          <NavItem to="/suppliers" icon={<Users size={20} />} label="Suppliers" closeSidebar={closeSidebar} />
          <NavItem to="/customers" icon={<User size={20} />} label="Customers" closeSidebar={closeSidebar} />
          
          {isSidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">System</div>}
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" closeSidebar={closeSidebar} />
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
