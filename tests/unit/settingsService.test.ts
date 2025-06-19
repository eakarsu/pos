import { PrismaClient } from '@prisma/client';

const prisma = global.__PRISMA__;

// Mock SettingsService for unit testing
class SettingsService {
  constructor(private prisma: PrismaClient) {}

  async getSetting(key: string) {
    return await this.prisma.systemSetting.findUnique({
      where: { key }
    });
  }

  async setSetting(key: string, value: string, type: string = 'string', category: string) {
    return await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, type },
      create: { key, value, type, category }
    });
  }

  async getSettingsByCategory(category: string) {
    return await this.prisma.systemSetting.findMany({
      where: { category }
    });
  }

  async setMultipleSettings(settings: Array<{key: string, value: string, type?: string, category: string}>) {
    const operations = settings.map(setting =>
      this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, type: setting.type || 'string' },
        create: { 
          key: setting.key, 
          value: setting.value, 
          type: setting.type || 'string', 
          category: setting.category 
        }
      })
    );

    return await this.prisma.$transaction(operations);
  }

  validateStoreSettings(settings: any) {
    const errors: string[] = [];
    
    if (settings.name !== undefined && (!settings.name || settings.name.trim() === '')) {
      errors.push('Store name is required');
    }
    
    if (settings.taxRate !== undefined) {
      const taxRate = parseFloat(settings.taxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        errors.push('Tax rate must be a number between 0 and 100');
      }
    }
    
    if (settings.currency && !['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(settings.currency)) {
      errors.push('Invalid currency code');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePOSSettings(settings: any) {
    const errors: string[] = [];
    
    const booleanFields = ['autoPrint', 'emailReceipts', 'barcodeScanner', 'cashDrawer'];
    
    for (const field of booleanFields) {
      if (settings[field] !== undefined && typeof settings[field] !== 'boolean' && 
          settings[field] !== 'true' && settings[field] !== 'false') {
        errors.push(`${field} must be a boolean value`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaultStoreSettings() {
    return {
      name: 'My Store',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: '',
      taxRate: '0',
      currency: 'USD',
      timezone: 'America/Los_Angeles'
    };
  }

  getDefaultPOSSettings() {
    return {
      autoPrint: 'true',
      emailReceipts: 'false',
      printerName: 'Default Printer',
      receiptFooter: 'Thank you for your business!',
      barcodeScanner: 'true',
      cashDrawer: 'true',
      lowStockThreshold: '10'
    };
  }

  async resetToDefaults(category: string) {
    // Delete existing settings for category
    await this.prisma.systemSetting.deleteMany({
      where: { category }
    });

    // Set defaults based on category
    let defaults: any = {};
    if (category === 'store') {
      defaults = this.getDefaultStoreSettings();
    } else if (category === 'pos') {
      defaults = this.getDefaultPOSSettings();
    }

    // Create default settings
    const settingsToCreate = Object.entries(defaults).map(([key, value]) => ({
      key: `${category}.${key}`,
      value: String(value),
      type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
      category
    }));

    return await this.prisma.systemSetting.createMany({
      data: settingsToCreate
    });
  }
}

describe('SettingsService Unit Tests', () => {
  let settingsService: SettingsService;

  beforeEach(async () => {
    settingsService = new SettingsService(prisma);
  });

  describe('getSetting', () => {
    it('should retrieve a specific setting', async () => {
      await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Test Store',
          type: 'string',
          category: 'store'
        }
      });

      const setting = await settingsService.getSetting('store.name');
      expect(setting?.value).toBe('Test Store');
    });

    it('should return null for non-existent setting', async () => {
      const setting = await settingsService.getSetting('nonexistent.setting');
      expect(setting).toBeNull();
    });
  });

  describe('setSetting', () => {
    it('should create a new setting', async () => {
      await settingsService.setSetting('store.name', 'New Store', 'string', 'store');

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'store.name' }
      });
      expect(setting?.value).toBe('New Store');
    });

    it('should update existing setting', async () => {
      await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Old Store',
          type: 'string',
          category: 'store'
        }
      });

      await settingsService.setSetting('store.name', 'Updated Store', 'string', 'store');

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'store.name' }
      });
      expect(setting?.value).toBe('Updated Store');
    });
  });

  describe('getSettingsByCategory', () => {
    it('should retrieve all settings for a category', async () => {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.address', value: '123 Test St', type: 'string', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' }
        ]
      });

      const storeSettings = await settingsService.getSettingsByCategory('store');
      expect(storeSettings.length).toBe(2);
      expect(storeSettings.find(s => s.key === 'store.name')?.value).toBe('Test Store');
    });
  });

  describe('setMultipleSettings', () => {
    it('should set multiple settings at once', async () => {
      const settings = [
        { key: 'store.name', value: 'Bulk Store', type: 'string', category: 'store' },
        { key: 'store.address', value: '456 Bulk St', type: 'string', category: 'store' },
        { key: 'store.phone', value: '555-0123', type: 'string', category: 'store' }
      ];

      await settingsService.setMultipleSettings(settings);

      const storeSettings = await settingsService.getSettingsByCategory('store');
      expect(storeSettings.length).toBe(3);
      expect(storeSettings.find(s => s.key === 'store.name')?.value).toBe('Bulk Store');
    });
  });

  describe('validateSettings', () => {
    it('should validate store settings', () => {
      const validSettings = {
        name: 'Valid Store',
        taxRate: '8.5',
        currency: 'USD'
      };

      const result = settingsService.validateStoreSettings(validSettings);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid store settings', () => {
      const invalidSettings = {
        name: '', // Empty name
        taxRate: '-1', // Negative tax rate
        currency: 'INVALID'
      };

      const result = settingsService.validateStoreSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate POS settings', () => {
      const validSettings = {
        autoPrint: true,
        emailReceipts: false,
        barcodeScanner: 'true'
      };

      const result = settingsService.validatePOSSettings(validSettings);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings for each category', () => {
      const storeDefaults = settingsService.getDefaultStoreSettings();
      expect(storeDefaults.currency).toBe('USD');
      expect(storeDefaults.taxRate).toBe('0');

      const posDefaults = settingsService.getDefaultPOSSettings();
      expect(posDefaults.autoPrint).toBe('true');
      expect(posDefaults.emailReceipts).toBe('false');
    });
  });

  describe('resetToDefaults', () => {
    it('should reset settings to defaults', async () => {
      // Create some custom settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Custom Store', type: 'string', category: 'store' },
          { key: 'store.taxRate', value: '15.5', type: 'number', category: 'store' }
        ]
      });

      await settingsService.resetToDefaults('store');

      const storeSettings = await settingsService.getSettingsByCategory('store');
      const nameSetting = storeSettings.find(s => s.key === 'store.name');
      expect(nameSetting?.value).toBe('My Store'); // Default name
    });
  });

  describe('type conversion helpers', () => {
    it('should handle boolean conversion', async () => {
      await settingsService.setSetting('pos.autoPrint', 'true', 'boolean', 'pos');
      
      const setting = await settingsService.getSetting('pos.autoPrint');
      const boolValue = setting?.value === 'true';
      expect(boolValue).toBe(true);
    });

    it('should handle number conversion', async () => {
      await settingsService.setSetting('store.taxRate', '8.25', 'number', 'store');
      
      const setting = await settingsService.getSetting('store.taxRate');
      const numValue = parseFloat(setting?.value || '0');
      expect(numValue).toBe(8.25);
    });
  });
});
import { PrismaClient, SystemSetting } from '@prisma/client';

const prisma = (global as any).__PRISMA__ as PrismaClient;

// Mock SettingsService for unit testing
class SettingsService {
  constructor(private prisma: PrismaClient) {}

  async getSetting(key: string) {
    return await this.prisma.systemSetting.findUnique({
      where: { key }
    });
  }

  async setSetting(key: string, value: string, type: string = 'string', category: string) {
    return await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, type },
      create: { key, value, type, category }
    });
  }

  async getSettingsByCategory(category: string) {
    return await this.prisma.systemSetting.findMany({
      where: { category }
    });
  }

  async setMultipleSettings(settings: Array<{key: string, value: string, type?: string, category: string}>) {
    const operations = settings.map(setting =>
      this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, type: setting.type || 'string' },
        create: { 
          key: setting.key, 
          value: setting.value, 
          type: setting.type || 'string', 
          category: setting.category 
        }
      })
    );

    return await this.prisma.$transaction(operations);
  }

  validateStoreSettings(settings: any) {
    const errors: string[] = [];
    
    if (settings.name !== undefined && (!settings.name || settings.name.trim() === '')) {
      errors.push('Store name is required');
    }
    
    if (settings.taxRate !== undefined) {
      const taxRate = parseFloat(settings.taxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        errors.push('Tax rate must be a number between 0 and 100');
      }
    }
    
    if (settings.currency && !['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(settings.currency)) {
      errors.push('Invalid currency code');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePOSSettings(settings: any) {
    const errors: string[] = [];
    
    const booleanFields = ['autoPrint', 'emailReceipts', 'barcodeScanner', 'cashDrawer'];
    
    for (const field of booleanFields) {
      if (settings[field] !== undefined && typeof settings[field] !== 'boolean' && 
          settings[field] !== 'true' && settings[field] !== 'false') {
        errors.push(`${field} must be a boolean value`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaultStoreSettings() {
    return {
      name: 'My Store',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: '',
      taxRate: '0',
      currency: 'USD',
      timezone: 'America/Los_Angeles'
    };
  }

  getDefaultPOSSettings() {
    return {
      autoPrint: 'true',
      emailReceipts: 'false',
      printerName: 'Default Printer',
      receiptFooter: 'Thank you for your business!',
      barcodeScanner: 'true',
      cashDrawer: 'true',
      lowStockThreshold: '10'
    };
  }

  async resetToDefaults(category: string) {
    // Delete existing settings for category
    await this.prisma.systemSetting.deleteMany({
      where: { category }
    });

    // Set defaults based on category
    let defaults: any = {};
    if (category === 'store') {
      defaults = this.getDefaultStoreSettings();
    } else if (category === 'pos') {
      defaults = this.getDefaultPOSSettings();
    }

    // Create default settings
    const settingsToCreate = Object.entries(defaults).map(([key, value]) => ({
      key: `${category}.${key}`,
      value: String(value),
      type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
      category
    }));

    return await this.prisma.systemSetting.createMany({
      data: settingsToCreate
    });
  }
}

describe('SettingsService Unit Tests', () => {
  let settingsService: SettingsService;

  beforeEach(async () => {
    settingsService = new SettingsService(prisma);
  });

  describe('getSetting', () => {
    it('should retrieve a specific setting', async () => {
      await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Test Store',
          type: 'string',
          category: 'store'
        }
      });

      const setting = await settingsService.getSetting('store.name');
      expect(setting?.value).toBe('Test Store');
    });

    it('should return null for non-existent setting', async () => {
      const setting = await settingsService.getSetting('nonexistent.setting');
      expect(setting).toBeNull();
    });
  });

  describe('setSetting', () => {
    it('should create a new setting', async () => {
      await settingsService.setSetting('store.name', 'New Store', 'string', 'store');

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'store.name' }
      });
      expect(setting?.value).toBe('New Store');
    });

    it('should update existing setting', async () => {
      await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Old Store',
          type: 'string',
          category: 'store'
        }
      });

      await settingsService.setSetting('store.name', 'Updated Store', 'string', 'store');

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'store.name' }
      });
      expect(setting?.value).toBe('Updated Store');
    });
  });

  describe('getSettingsByCategory', () => {
    it('should retrieve all settings for a category', async () => {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.address', value: '123 Test St', type: 'string', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' }
        ]
      });

      const storeSettings = await settingsService.getSettingsByCategory('store');
      expect(storeSettings.length).toBe(2);
      expect(storeSettings.find((s: SystemSetting) => s.key === 'store.name')?.value).toBe('Test Store');
    });
  });

  describe('setMultipleSettings', () => {
    it('should set multiple settings at once', async () => {
      const settings = [
        { key: 'store.name', value: 'Bulk Store', type: 'string', category: 'store' },
        { key: 'store.address', value: '456 Bulk St', type: 'string', category: 'store' },
        { key: 'store.phone', value: '555-0123', type: 'string', category: 'store' }
      ];

      await settingsService.setMultipleSettings(settings);

      const storeSettings = await settingsService.getSettingsByCategory('store');
      expect(storeSettings.length).toBe(3);
      expect(storeSettings.find((s: SystemSetting) => s.key === 'store.name')?.value).toBe('Bulk Store');
    });
  });

  describe('validateSettings', () => {
    it('should validate store settings', () => {
      const validSettings = {
        name: 'Valid Store',
        taxRate: '8.5',
        currency: 'USD'
      };

      const result = settingsService.validateStoreSettings(validSettings);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid store settings', () => {
      const invalidSettings = {
        name: '', // Empty name
        taxRate: '-1', // Negative tax rate
        currency: 'INVALID'
      };

      const result = settingsService.validateStoreSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate POS settings', () => {
      const validSettings = {
        autoPrint: true,
        emailReceipts: false,
        barcodeScanner: 'true'
      };

      const result = settingsService.validatePOSSettings(validSettings);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings for each category', () => {
      const storeDefaults = settingsService.getDefaultStoreSettings();
      expect(storeDefaults.currency).toBe('USD');
      expect(storeDefaults.taxRate).toBe('0');

      const posDefaults = settingsService.getDefaultPOSSettings();
      expect(posDefaults.autoPrint).toBe('true');
      expect(posDefaults.emailReceipts).toBe('false');
    });
  });

  describe('resetToDefaults', () => {
    it('should reset settings to defaults', async () => {
      // Create some custom settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Custom Store', type: 'string', category: 'store' },
          { key: 'store.taxRate', value: '15.5', type: 'number', category: 'store' }
        ]
      });

      await settingsService.resetToDefaults('store');

      const storeSettings = await settingsService.getSettingsByCategory('store');
      const nameSetting = storeSettings.find((s: SystemSetting) => s.key === 'store.name');
      expect(nameSetting?.value).toBe('My Store'); // Default name
    });
  });

  describe('type conversion helpers', () => {
    it('should handle boolean conversion', async () => {
      await settingsService.setSetting('pos.autoPrint', 'true', 'boolean', 'pos');
      
      const setting = await settingsService.getSetting('pos.autoPrint');
      const boolValue = setting?.value === 'true';
      expect(boolValue).toBe(true);
    });

    it('should handle number conversion', async () => {
      await settingsService.setSetting('store.taxRate', '8.25', 'number', 'store');
      
      const setting = await settingsService.getSetting('store.taxRate');
      const numValue = parseFloat(setting?.value || '0');
      expect(numValue).toBe(8.25);
    });
  });
});
