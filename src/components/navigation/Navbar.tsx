import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { 
  Menu, 
  Bell, 
  MessageSquare, 
  LogOut,
  User,
  Settings
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user) return null;
  
  return (
    <header className="bg-white border-b h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">
      {/* Left section */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 focus:outline-none mr-2 sm:mr-4 p-1"
        >
          <Menu size={20} className="sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 hidden sm:block">
          FxD Partner ERP
        </h1>
      </div>
      
      {/* Right section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-md shadow-lg py-1 z-50 max-w-[calc(100vw-2rem)]">
              <div className="px-4 py-2 border-b">
                <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">New vehicle arrived</p>
                  <p className="text-xs text-gray-500">Vehicle KA-01-AB-1234 has arrived with apple delivery</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
                <div className="px-4 py-3 border-b hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">Payment received</p>
                  <p className="text-xs text-gray-500">Customer ABC Fruits paid ₹25,000</p>
                  <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">Low inventory alert</p>
                  <p className="text-xs text-gray-500">Banana stock is below minimum threshold</p>
                  <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t">
                <a href="#" className="text-xs font-medium text-green-600 hover:text-green-700">
                  View all notifications
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Messages */}
        <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
          <MessageSquare size={20} />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
        </button>
        
        {/* Profile */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center focus:outline-none"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
              {user.name}
            </span>
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <a 
                href="#" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <User size={16} className="mr-2" />
                Profile
              </a>
              <a 
                href="#" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Settings size={16} className="mr-2" />
                Settings
              </a>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
