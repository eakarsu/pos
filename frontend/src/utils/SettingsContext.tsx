import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from './api';
import toast from 'react-hot-toast';

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

interface SystemSettings {
  store: StoreSettings;
  pos: POSSettings;
  isLoading: boolean;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
  updatePOSSettings: (settings: POSSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultStoreSettings: StoreSettings = {
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
};

const defaultPOSSettings: POSSettings = {
  autoPrint: true,
  emailReceipts: false,
  printerName: 'Default Printer',
  receiptFooter: 'Thank you for your business!',
  barcodeScanner: true,
  cashDrawer: true,
  paymentMethods: ['Cash', 'Credit Card', 'Debit Card'],
  lowStockThreshold: 10
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    store: defaultStoreSettings,
    pos: defaultPOSSettings,
    isLoading: true
  });

  const refreshSettings = async () => {
    try {
      setSettings(prev => ({ ...prev, isLoading: true }));
      
      const [storeResponse, posResponse] = await Promise.all([
        apiService.getSettings('store'),
        apiService.getSettings('pos')
      ]);

      setSettings({
        store: storeResponse.success ? storeResponse.data : defaultStoreSettings,
        pos: posResponse.success ? posResponse.data : defaultPOSSettings,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if API fails
      setSettings({
        store: defaultStoreSettings,
        pos: defaultPOSSettings,
        isLoading: false
      });
    }
  };

  const updateStoreSettings = async (newSettings: StoreSettings) => {
    try {
      const response = await apiService.updateSettings('store', newSettings);
      if (response.success) {
        setSettings(prev => ({ ...prev, store: newSettings }));
        toast.success('Store settings updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store settings');
      throw error;
    }
  };

  const updatePOSSettings = async (newSettings: POSSettings) => {
    try {
      const response = await apiService.updateSettings('pos', newSettings);
      if (response.success) {
        setSettings(prev => ({ ...prev, pos: newSettings }));
        toast.success('POS settings updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update POS settings');
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const value: SettingsContextType = {
    settings,
    updateStoreSettings,
    updatePOSSettings,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
