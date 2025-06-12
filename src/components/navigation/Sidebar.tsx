import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  FileText, 
  Package, 
  ShoppingCart, 
  Send,
  Users, 
  UserCheck,
  BookOpen, 
  CreditCard, 
  Settings,
  X
} from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { 
    name: 'Procurement', 
    icon: Truck,
    children: [
      { name: 'Vehicle Arrival', href: '/vehicle-arrival' },
      { name: 'Record Purchase', href: '/record-purchase' },
    ]
  },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { 
    name: 'Sales', 
    icon: ShoppingCart,
    children: [
      { name: 'Sales Orders', href: '/sales' },
      { name: 'Dispatch', href: '/dispatch' },
    ]
  },
  { 
    name: 'Partners', 
    icon: Users,
    children: [
      { name: 'Suppliers', href: '/suppliers' },
      { name: 'Customers', href: '/customers' },
    ]
  },
  { 
    name: 'Finance', 
    icon: BookOpen,
    children: [
      { name: 'Ledger', href: '/ledger' },
      { name: 'Payments', href: '/payments' },
    ]
  },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isActiveParent = (children: any[]) => {
    return children.some(child => isActiveLink(child.href));
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-400" />
            <span className="ml-2 text-xl font-bold">FxD Partner ERP</span>
          </div>
          
          {/* Close button - only visible on mobile */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1 h-[calc(100vh-4rem)] overflow-y-auto">
          {navigation.map((item) => {
            if (item.children) {
              const isParentActive = isActiveParent(item.children);
              return (
                <div key={item.name} className="space-y-1">
                  <div className={`
                    flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isParentActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}>
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        onClick={() => {
                          // Close sidebar on mobile when navigating
                          if (window.innerWidth < 768) {
                            toggleSidebar();
                          }
                        }}
                        className={({ isActive }) => `
                          block px-2 py-2 text-sm rounded-md transition-colors duration-200
                          ${isActive
                            ? 'bg-green-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }
                        `}
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
                className={({ isActive }) => `
                  flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;