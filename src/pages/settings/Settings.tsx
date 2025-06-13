import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, User, Globe, Database, HelpCircle, Save, Users } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import UserManagement from '../../components/settings/UserManagement';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const Settings: React.FC = () => {
  const { hasRole } = useRole();
  const [activeSection, setActiveSection] = useState('profile');

  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: <User className="h-5 w-5" />,
      description: 'Update your personal information and preferences'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      description: 'Configure how you receive alerts and notifications'
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock className="h-5 w-5" />,
      description: 'Manage your password and security settings'
    },
    {
      id: 'system',
      title: 'System Settings',
      icon: <Globe className="h-5 w-5" />,
      description: 'Configure system-wide preferences'
    },
    {
      id: 'database',
      title: 'Database Settings',
      icon: <Database className="h-5 w-5" />,
      description: 'Manage database connections and backups'
    },
    ...(hasRole('admin') ? [{
      id: 'users',
      title: 'User Management',
      icon: <Users className="h-5 w-5" />,
      description: 'Manage system users and their roles'
    }] : []),
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle className="h-5 w-5" />,
      description: 'Get help and access documentation'
    }
  ];
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [timeZone, setTimeZone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('INR');
  const [backupFrequency, setBackupFrequency] = useState('daily');
  
  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    console.log('Saving settings...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        </div>
        <button 
          onClick={handleSaveSettings}
          className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <Save className="h-4 w-4 mr-1" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="col-span-12 md:col-span-3">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                <span className="ml-3">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="col-span-12 md:col-span-9">
          <div className="bg-white shadow-sm rounded-lg">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      defaultValue="Demo User"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      defaultValue="demo@fruitshop.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                      defaultValue="Administrator"
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.email ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.email ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.push ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.push ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.sms ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.sms ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeSection === 'system' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">System Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="IST">IST (UTC+5:30)</option>
                      <option value="PST">PST (UTC-8)</option>
                      <option value="EST">EST (UTC-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Database Settings */}
            {activeSection === 'database' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Database Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => setBackupFrequency(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <button className="mt-4 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                      Backup Now
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Backups</h3>
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">backup_2025_06_18.sql</span>
                          <span className="text-gray-500">2025-06-18 10:00 AM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">backup_2025_06_17.sql</span>
                          <span className="text-gray-500">2025-06-17 10:00 AM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">backup_2025_06_16.sql</span>
                          <span className="text-gray-500">2025-06-16 10:00 AM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeSection === 'users' && hasRole('admin') && (
              <UserManagement />
            )}

            {/* Help & Support */}
            {activeSection === 'help' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Help & Support</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Documentation</h3>
                    <p className="text-sm text-gray-600">
                      Access our comprehensive documentation to learn more about using FruitERP.
                    </p>
                    <a
                      href="#"
                      className="mt-2 inline-flex items-center text-sm text-green-600 hover:text-green-700"
                    >
                      View Documentation
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Support</h3>
                    <p className="text-sm text-gray-600">
                      Need help? Contact our support team for assistance.
                    </p>
                    <a
                      href="mailto:support@fruiterp.com"
                      className="mt-2 inline-flex items-center text-sm text-green-600 hover:text-green-700"
                    >
                      Contact Support
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">FAQs</h3>
                    <p className="text-sm text-gray-600">
                      Find answers to commonly asked questions about FruitERP.
                    </p>
                    <a
                      href="#"
                      className="mt-2 inline-flex items-center text-sm text-green-600 hover:text-green-700"
                    >
                      View FAQs
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
