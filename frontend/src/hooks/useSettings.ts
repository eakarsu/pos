import { useContext } from 'react';
import { SettingsContext } from '../utils/SettingsContext';

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Utility hooks for specific setting categories
export const useStoreSettings = () => {
  const { settings } = useSettings();
  return settings.store;
};

export const usePOSSettings = () => {
  const { settings } = useSettings();
  return settings.pos;
};

// Hook to get a specific setting value
export const useSetting = (key: string, defaultValue?: any) => {
  const { settings } = useSettings();
  
  if (key.startsWith('store.')) {
    const storeKey = key.replace('store.', '') as keyof typeof settings.store;
    return settings.store[storeKey] ?? defaultValue;
  } else if (key.startsWith('pos.')) {
    const posKey = key.replace('pos.', '') as keyof typeof settings.pos;
    return settings.pos[posKey] ?? defaultValue;
  }
  
  return defaultValue;
};
