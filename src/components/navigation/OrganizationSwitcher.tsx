import React from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrganizationSwitcherProps {
  currentOrganization: Organization;
  organizations: Organization[];
  onSwitchOrganization: (organizationId: string) => void;
  loading?: boolean;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  currentOrganization,
  organizations,
  onSwitchOrganization,
  loading = false
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwitchOrganization = (organizationId: string) => {
    if (organizationId !== currentOrganization.id) {
      onSwitchOrganization(organizationId);
    }
    setShowDropdown(false);
  };

  // Don't render if user has only one organization
  if (organizations.length <= 1) {
    return null;
  }
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200 disabled:opacity-50"
      >
        <Building2 size={16} className="text-gray-500" />
        <span className="hidden sm:block max-w-32 truncate">
          {currentOrganization.name}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 ${
            showDropdown ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[9999] max-w-[calc(100vw-2rem)]">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Switch Organization
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrganization(org.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{org.role}</p>
                  </div>
                </div>
                
                {org.id === currentOrganization.id && (
                  <Check size={16} className="text-green-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSwitcher;
