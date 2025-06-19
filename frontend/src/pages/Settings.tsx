import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  PrinterIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  KeyIcon,
  ServerIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface StoreSettings {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
  currency: string;
  timezone: string;
}

interface POSSettings {
  autoPrint: boolean;
  emailReceipts: boolean;
  printerName: string;
  receiptFooter: string;
  barcodeScanner: boolean;
  cashDrawer: boolean;
  paymentMethods: string[];
  lowStockThreshold: number;
}

interface UserSettings {
  sessionTimeout: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  allowMultipleSessions: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  reportEmail: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'My POS Store',
    address: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 123-4567',
    email: 'store@example.com',
    website: 'www.mystore.com',
    taxRate: 8.25,
    currency: 'USD',
    timezone: 'America/Los_Angeles'
  });

  const [posSettings, setPosSettings] = useState<POSSettings>({
    autoPrint: true,
    emailReceipts: false,
    printerName: 'Default Printer',
    receiptFooter: 'Thank you for your business!',
    barcodeScanner: true,
    cashDrawer: true,
    paymentMethods: ['Cash', 'Credit Card', 'Debit Card'],
    lowStockThreshold: 10
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowMultipleSessions: false
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    lowStockAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: true,
    reportEmail: 'reports@example.com'
  });

  const tabs = [
    { id: 'store', name: 'Store Info', icon: BuildingStorefrontIcon },
    { id: 'pos', name: 'POS Settings', icon: PrinterIcon },
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'system', name: 'System', icon: CogIcon }
  ];

  const saveSettings = async (settingsType: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${settingsType} settings saved successfully!`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const renderStoreSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-blue-600" />
          Store Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
            <input
              type="text"
              value={storeSettings.name}
              onChange={(e) => setStoreSettings({...storeSettings, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={storeSettings.phone}
              onChange={(e) => setStoreSettings({...storeSettings, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={storeSettings.address}
              onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={storeSettings.city}
              onChange={(e) => setStoreSettings({...storeSettings, city: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={storeSettings.state}
              onChange={(e) => setStoreSettings({...storeSettings, state: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={storeSettings.email}
              onChange={(e) => setStoreSettings({...storeSettings, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={storeSettings.website}
              onChange={(e) => setStoreSettings({...storeSettings, website: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
          Financial Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={storeSettings.taxRate}
              onChange={(e) => setStoreSettings({...storeSettings, taxRate: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={storeSettings.currency}
              onChange={(e) => setStoreSettings({...storeSettings, currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={storeSettings.timezone}
              onChange={(e) => setStoreSettings({...storeSettings, timezone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/New_York">Eastern Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings('Store')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? 'Saving...' : 'Save Store Settings'}
        </button>
      </div>
    </div>
  );

  const renderPOSSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PrinterIcon className="h-5 w-5 mr-2 text-purple-600" />
          Receipt & Printing
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-print receipts</label>
              <p className="text-sm text-gray-500">Automatically print receipts after each sale</p>
            </div>
            <button
              onClick={() => setPosSettings({...posSettings, autoPrint: !posSettings.autoPrint})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                posSettings.autoPrint ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                posSettings.autoPrint ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email receipts</label>
              <p className="text-sm text-gray-500">Send receipts via email to customers</p>
            </div>
            <button
              onClick={() => setPosSettings({...posSettings, emailReceipts: !posSettings.emailReceipts})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                posSettings.emailReceipts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                posSettings.emailReceipts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer</label>
            <textarea
              value={posSettings.receiptFooter}
              onChange={(e) => setPosSettings({...posSettings, receiptFooter: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Thank you for your business!"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2 text-orange-600" />
          Hardware Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Barcode Scanner</label>
              <p className="text-sm text-gray-500">Enable barcode scanning functionality</p>
            </div>
            <button
              onClick={() => setPosSettings({...posSettings, barcodeScanner: !posSettings.barcodeScanner})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                posSettings.barcodeScanner ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                posSettings.barcodeScanner ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Cash Drawer</label>
              <p className="text-sm text-gray-500">Automatically open cash drawer on sale</p>
            </div>
            <button
              onClick={() => setPosSettings({...posSettings, cashDrawer: !posSettings.cashDrawer})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                posSettings.cashDrawer ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                posSettings.cashDrawer ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
            <input
              type="number"
              value={posSettings.lowStockThreshold}
              onChange={(e) => setPosSettings({...posSettings, lowStockThreshold: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings('POS')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save POS Settings'}
        </button>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
          User Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={userSettings.sessionTimeout}
              onChange={(e) => setUserSettings({...userSettings, sessionTimeout: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
            <input
              type="number"
              value={userSettings.passwordMinLength}
              onChange={(e) => setUserSettings({...userSettings, passwordMinLength: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Require Two-Factor Authentication</label>
              <p className="text-sm text-gray-500">Enhance security with 2FA</p>
            </div>
            <button
              onClick={() => setUserSettings({...userSettings, requireTwoFactor: !userSettings.requireTwoFactor})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userSettings.requireTwoFactor ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                userSettings.requireTwoFactor ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings('User')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save User Settings'}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-yellow-600" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Notifications</label>
              <p className="text-sm text-gray-500">Receive system notifications via email</p>
            </div>
            <button
              onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Low Stock Alerts</label>
              <p className="text-sm text-gray-500">Get notified when items are running low</p>
            </div>
            <button
              onClick={() => setNotificationSettings({...notificationSettings, lowStockAlerts: !notificationSettings.lowStockAlerts})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.lowStockAlerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationSettings.lowStockAlerts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reports Email</label>
            <input
              type="email"
              value={notificationSettings.reportEmail}
              onChange={(e) => setNotificationSettings({...notificationSettings, reportEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="reports@example.com"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings('Notification')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-gray-600" />
          System Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Backup Database</h4>
                <p className="text-sm text-gray-500">Create a backup of your data</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Data</h4>
                <p className="text-sm text-gray-500">Export your data to CSV/Excel</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">System Logs</h4>
                <p className="text-sm text-gray-500">View system activity logs</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Clear Cache</h4>
                <p className="text-sm text-gray-500">Clear system cache and temp files</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Version:</span>
            <span className="ml-2 text-gray-900">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Database:</span>
            <span className="ml-2 text-gray-900">PostgreSQL</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Backup:</span>
            <span className="ml-2 text-gray-900">2024-06-19 10:30 AM</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Uptime:</span>
            <span className="ml-2 text-gray-900">2 days, 14 hours</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'store':
        return renderStoreSettings();
      case 'pos':
        return renderPOSSettings();
      case 'users':
        return renderUserSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderStoreSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your POS system settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
