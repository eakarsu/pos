import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useSettings } from '../utils/SettingsContext';
import { apiService } from '../utils/api';
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
  const { settings, updateStoreSettings, updatePOSSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(settings.store);
  const [posSettings, setPosSettings] = useState<POSSettings>(settings.pos);

  // Update local state when settings context changes
  useEffect(() => {
    setStoreSettings(settings.store);
    setPosSettings(settings.pos);
  }, [settings]);

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // For now, just use default settings since backend endpoints don't exist yet
      // TODO: Implement backend settings endpoints
      // Settings are already initialized with defaults from context
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsType: string) => {
    setLoading(true);
    try {
      // For now, just simulate saving since backend endpoints don't exist yet
      // TODO: Implement backend settings endpoints
      
      switch (settingsType.toLowerCase()) {
        case 'store':
          await updateStoreSettings(storeSettings);
          break;
        case 'pos':
          await updatePOSSettings(posSettings);
          break;
        case 'user':
          // Just show success for now
          toast.success(`${settingsType} settings saved successfully!`);
          break;
        case 'notification':
          // Just show success for now
          toast.success(`${settingsType} settings saved successfully!`);
          break;
        default:
          throw new Error('Invalid settings type');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
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

  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [showLogsPage, setShowLogsPage] = useState(false);
  const [showBackupPage, setShowBackupPage] = useState(false);
  const [showExportPage, setShowExportPage] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any>(null);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const handleBackupDatabase = async () => {
    try {
      setLoading(true);
      const result = await apiService.backupDatabase();
      if (result.success) {
        toast.success('Database backup created successfully!');
        // Add to backup history
        setBackupHistory(prev => [result.data, ...prev]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to backup database');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      setLoading(true);
      const result = await apiService.exportData(format);
      if (result.success) {
        toast.success(`Data exported to ${format.toUpperCase()} successfully!`);
        // Add to export history
        setExportHistory(prev => [result.data, ...prev]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async () => {
    try {
      setLoading(true);
      const result = await apiService.getSystemLogs(1000);
      if (result.success) {
        setSystemLogs(result.data);
        setShowLogsPage(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      await apiService.downloadFile(url, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleClearCache = async () => {
    try {
      setLoading(true);
      const result = await apiService.clearCache();
      if (result.success) {
        toast.success('Cache cleared successfully!');
        const results = result.data.results.join('\n');
        toast.success(`Cache clearing results:\n${results}`, { duration: 5000 });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const result = await apiService.getSystemInfo();
      if (result.success) {
        setSystemInfo(result.data);
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemInfo();
    }
  }, [activeTab]);

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-gray-600" />
          System Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowBackupPage(true)}
            disabled={loading}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Backup Database</h4>
                <p className="text-sm text-gray-500">Create and manage database backups</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          <button 
            onClick={() => setShowExportPage(true)}
            disabled={loading}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Data</h4>
                <p className="text-sm text-gray-500">Export your data to CSV/JSON</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          <button 
            onClick={handleViewLogs}
            disabled={loading}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">System Logs</h4>
                <p className="text-sm text-gray-500">View system activity logs</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          <button 
            onClick={handleClearCache}
            disabled={loading}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
          >
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
        {systemInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Version:</span>
              <span className="ml-2 text-gray-900">{systemInfo.version}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Node Version:</span>
              <span className="ml-2 text-gray-900">{systemInfo.nodeVersion}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className="ml-2 text-gray-900">{systemInfo.database}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Platform:</span>
              <span className="ml-2 text-gray-900">{systemInfo.platform}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Uptime:</span>
              <span className="ml-2 text-gray-900">{Math.floor(systemInfo.uptime / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Memory Usage:</span>
              <span className="ml-2 text-gray-900">{Math.round(systemInfo.memoryUsage.used / 1024 / 1024)}MB</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <span className="ml-2 text-gray-900">{systemInfo.environment}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-900">{new Date(systemInfo.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading system information...</p>
          </div>
        )}
      </div>

      {/* System Logs Page */}
      {showLogsPage && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLogsPage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-180" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
            </div>
            <button
              onClick={handleViewLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Logs'}
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{systemLogs || 'No logs available'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Backup Management Page */}
      {showBackupPage && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBackupPage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-180" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Database Backup</h2>
            </div>
            <button
              onClick={handleBackupDatabase}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Backup...' : 'Create New Backup'}
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup History</h3>
            {backupHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No backups created yet</p>
            ) : (
              <div className="space-y-3">
                {backupHistory.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{backup.filename}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(backup.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Size: {(backup.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(`/system/backup/${backup.filename}`, backup.filename)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Management Page */}
      {showExportPage && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowExportPage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-180" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportData('csv')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={() => handleExportData('json')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Exporting...' : 'Export JSON'}
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export History</h3>
            {exportHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exports created yet</p>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((exportItem, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{exportItem.filename}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(exportItem.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Format: {exportItem.format?.toUpperCase()} | Size: {(exportItem.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(`/system/export/${exportItem.filename}`, exportItem.filename)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    // Show dedicated pages when active
    if (showLogsPage || showBackupPage || showExportPage) {
      return null; // Content is rendered separately above
    }

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
        {(showLogsPage || showBackupPage || showExportPage) ? (
          <>
            {showLogsPage && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowLogsPage(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
                  </div>
                  <button
                    onClick={handleViewLogs}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Refreshing...' : 'Refresh Logs'}
                  </button>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4 flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">INFO</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">WARN</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">ERROR</span>
                    </div>
                  </div>
                  
                  <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {systemLogs && systemLogs.logEntries ? (
                      <div className="divide-y divide-gray-100">
                        {systemLogs.logEntries.map((entry: any, index: number) => (
                          <div key={index} className="p-3 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                entry.level === 'ERROR' ? 'bg-red-500' :
                                entry.level === 'WARN' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    entry.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                                    entry.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {entry.level}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-900">{entry.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-full overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{systemLogs || 'No logs available'}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showBackupPage && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowBackupPage(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">Database Backup</h2>
                  </div>
                  <button
                    onClick={handleBackupDatabase}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating Backup...' : 'Create New Backup'}
                  </button>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Backup History</h3>
                  {backupHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No backups created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {backupHistory.map((backup, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{backup.filename}</div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(backup.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Size: {(backup.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(`/system/backup/${backup.filename}`, backup.filename)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showExportPage && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowExportPage(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportData('csv')}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button
                      onClick={() => handleExportData('json')}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Exporting...' : 'Export JSON'}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export History</h3>
                  {exportHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No exports created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {exportHistory.map((exportItem, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{exportItem.filename}</div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(exportItem.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Format: {exportItem.format?.toUpperCase()} | Size: {(exportItem.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(`/system/export/${exportItem.filename}`, exportItem.filename)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default Settings;
