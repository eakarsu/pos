import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = global.__PRISMA__;

// Mock Express app for testing
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn()
};

describe('Settings Integration Tests', () => {
  let userId: string;
  let adminUser: any;

  beforeEach(async () => {
    // Create a test admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin',
        firstName: 'Test',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        employeeId: 'TEST001',
        phone: '+1-555-123-4567',
        hireDate: new Date(),
      }
    });
    userId = adminUser.id;
  });

  describe('System Settings CRUD Operations', () => {
    it('should create new system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'test.setting',
          value: 'test value',
          type: 'string',
          category: 'test'
        }
      });

      expect(setting.key).toBe('test.setting');
      expect(setting.value).toBe('test value');
      expect(setting.category).toBe('test');
    });

    it('should retrieve system settings by category', async () => {
      // Create test settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' }
        ]
      });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });

      expect(storeSettings.length).toBe(2);
      expect(storeSettings.find(s => s.key === 'store.name')?.value).toBe('Test Store');
    });

    it('should update existing system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Old Store Name',
          type: 'string',
          category: 'store'
        }
      });

      const updatedSetting = await prisma.systemSetting.update({
        where: { id: setting.id },
        data: { value: 'New Store Name' }
      });

      expect(updatedSetting.value).toBe('New Store Name');
    });

    it('should delete system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'temp.setting',
          value: 'temporary',
          type: 'string',
          category: 'temp'
        }
      });

      await prisma.systemSetting.delete({
        where: { id: setting.id }
      });

      const deletedSetting = await prisma.systemSetting.findUnique({
        where: { id: setting.id }
      });

      expect(deletedSetting).toBeNull();
    });
  });

  describe('Settings Validation', () => {
    it('should validate store settings format', async () => {
      const validStoreSettings = [
        { key: 'store.name', value: 'Valid Store', type: 'string', category: 'store' },
        { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
        { key: 'store.currency', value: 'USD', type: 'string', category: 'store' }
      ];

      for (const setting of validStoreSettings) {
        const created = await prisma.systemSetting.create({ data: setting });
        expect(created.key).toBe(setting.key);
        expect(created.value).toBe(setting.value);
      }
    });

    it('should validate POS settings format', async () => {
      const validPOSSettings = [
        { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.emailReceipts', value: 'false', type: 'boolean', category: 'pos' },
        { key: 'pos.receiptFooter', value: 'Thank you!', type: 'string', category: 'pos' }
      ];

      for (const setting of validPOSSettings) {
        const created = await prisma.systemSetting.create({ data: setting });
        expect(created.key).toBe(setting.key);
        expect(created.value).toBe(setting.value);
      }
    });

    it('should handle boolean type conversion', async () => {
      const booleanSetting = await prisma.systemSetting.create({
        data: {
          key: 'pos.autoPrint',
          value: 'true',
          type: 'boolean',
          category: 'pos'
        }
      });

      // Test boolean conversion
      const isEnabled = booleanSetting.value === 'true';
      expect(isEnabled).toBe(true);
    });

    it('should handle number type conversion', async () => {
      const numberSetting = await prisma.systemSetting.create({
        data: {
          key: 'store.taxRate',
          value: '8.25',
          type: 'number',
          category: 'store'
        }
      });

      // Test number conversion
      const taxRate = parseFloat(numberSetting.value);
      expect(taxRate).toBe(8.25);
    });
  });

  describe('Settings Categories', () => {
    it('should organize settings by category', async () => {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.address', value: '123 Main St', type: 'string', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
          { key: 'pos.cashDrawer', value: 'true', type: 'boolean', category: 'pos' },
          { key: 'user.sessionTimeout', value: '30', type: 'number', category: 'user' }
        ]
      });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });
      const posSettings = await prisma.systemSetting.findMany({
        where: { category: 'pos' }
      });
      const userSettings = await prisma.systemSetting.findMany({
        where: { category: 'user' }
      });

      expect(storeSettings.length).toBe(2);
      expect(posSettings.length).toBe(2);
      expect(userSettings.length).toBe(1);
    });
  });

  describe('Settings Performance', () => {
    it('should handle bulk settings operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 settings
      const bulkSettings = Array.from({ length: 100 }, (_, i) => ({
        key: `test.setting_${i}`,
        value: `value_${i}`,
        type: 'string',
        category: 'test'
      }));

      await prisma.systemSetting.createMany({ data: bulkSettings });

      // Retrieve all test settings
      const settings = await prisma.systemSetting.findMany({
        where: { category: 'test' }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(settings.length).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Settings Defaults from Seed', () => {
    it('should verify default store settings exist after seed', async () => {
      // Run a simplified version of seed data
      const defaultStoreSettings = [
        { key: 'store.name', value: 'POS System Store', type: 'string', category: 'store' },
        { key: 'store.address', value: '123 Main Street', type: 'string', category: 'store' },
        { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
        { key: 'store.currency', value: 'USD', type: 'string', category: 'store' }
      ];

      await prisma.systemSetting.createMany({ data: defaultStoreSettings });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });

      expect(storeSettings.length).toBe(4);
      expect(storeSettings.find(s => s.key === 'store.name')?.value).toBe('POS System Store');
      expect(storeSettings.find(s => s.key === 'store.currency')?.value).toBe('USD');
    });

    it('should verify default POS settings exist after seed', async () => {
      const defaultPOSSettings = [
        { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.emailReceipts', value: 'false', type: 'boolean', category: 'pos' },
        { key: 'pos.barcodeScanner', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.cashDrawer', value: 'true', type: 'boolean', category: 'pos' }
      ];

      await prisma.systemSetting.createMany({ data: defaultPOSSettings });

      const posSettings = await prisma.systemSetting.findMany({
        where: { category: 'pos' }
      });

      expect(posSettings.length).toBe(4);
      expect(posSettings.find(s => s.key === 'pos.autoPrint')?.value).toBe('true');
      expect(posSettings.find(s => s.key === 'pos.emailReceipts')?.value).toBe('false');
    });
  });

  describe('Settings Integration with Users', () => {
    it('should handle user-specific settings', async () => {
      // Create user-specific settings (though current schema doesn't have userId in systemSetting)
      const userSettings = [
        { key: 'user.theme', value: 'dark', type: 'string', category: 'user' },
        { key: 'user.language', value: 'en', type: 'string', category: 'user' },
        { key: 'user.sessionTimeout', value: '30', type: 'number', category: 'user' }
      ];

      await prisma.systemSetting.createMany({ data: userSettings });

      const settings = await prisma.systemSetting.findMany({
        where: { category: 'user' }
      });

      expect(settings.length).toBe(3);
      expect(settings.find(s => s.key === 'user.theme')?.value).toBe('dark');
    });
  });
});
import { PrismaClient, SystemSetting } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = (global as any).__PRISMA__ as PrismaClient;

describe('Settings Integration Tests', () => {
  let userId: string;
  let adminUser: any;

  beforeEach(async () => {
    // Create a test admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin',
        firstName: 'Test',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        employeeId: 'TEST001',
        phone: '+1-555-123-4567',
        hireDate: new Date(),
      }
    });
    userId = adminUser.id;
  });

  describe('System Settings CRUD Operations', () => {
    it('should create new system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'test.setting',
          value: 'test value',
          type: 'string',
          category: 'test'
        }
      });

      expect(setting.key).toBe('test.setting');
      expect(setting.value).toBe('test value');
      expect(setting.category).toBe('test');
    });

    it('should retrieve system settings by category', async () => {
      // Create test settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' }
        ]
      });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });

      expect(storeSettings.length).toBe(2);
      expect(storeSettings.find((s: SystemSetting) => s.key === 'store.name')?.value).toBe('Test Store');
    });

    it('should update existing system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'store.name',
          value: 'Old Store Name',
          type: 'string',
          category: 'store'
        }
      });

      const updatedSetting = await prisma.systemSetting.update({
        where: { id: setting.id },
        data: { value: 'New Store Name' }
      });

      expect(updatedSetting.value).toBe('New Store Name');
    });

    it('should delete system settings', async () => {
      const setting = await prisma.systemSetting.create({
        data: {
          key: 'temp.setting',
          value: 'temporary',
          type: 'string',
          category: 'temp'
        }
      });

      await prisma.systemSetting.delete({
        where: { id: setting.id }
      });

      const deletedSetting = await prisma.systemSetting.findUnique({
        where: { id: setting.id }
      });

      expect(deletedSetting).toBeNull();
    });
  });

  describe('Settings Validation', () => {
    it('should validate store settings format', async () => {
      const validStoreSettings = [
        { key: 'store.name', value: 'Valid Store', type: 'string', category: 'store' },
        { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
        { key: 'store.currency', value: 'USD', type: 'string', category: 'store' }
      ];

      for (const setting of validStoreSettings) {
        const created = await prisma.systemSetting.create({ data: setting });
        expect(created.key).toBe(setting.key);
        expect(created.value).toBe(setting.value);
      }
    });

    it('should validate POS settings format', async () => {
      const validPOSSettings = [
        { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.emailReceipts', value: 'false', type: 'boolean', category: 'pos' },
        { key: 'pos.receiptFooter', value: 'Thank you!', type: 'string', category: 'pos' }
      ];

      for (const setting of validPOSSettings) {
        const created = await prisma.systemSetting.create({ data: setting });
        expect(created.key).toBe(setting.key);
        expect(created.value).toBe(setting.value);
      }
    });

    it('should handle boolean type conversion', async () => {
      const booleanSetting = await prisma.systemSetting.create({
        data: {
          key: 'pos.autoPrint',
          value: 'true',
          type: 'boolean',
          category: 'pos'
        }
      });

      // Test boolean conversion
      const isEnabled = booleanSetting.value === 'true';
      expect(isEnabled).toBe(true);
    });

    it('should handle number type conversion', async () => {
      const numberSetting = await prisma.systemSetting.create({
        data: {
          key: 'store.taxRate',
          value: '8.25',
          type: 'number',
          category: 'store'
        }
      });

      // Test number conversion
      const taxRate = parseFloat(numberSetting.value);
      expect(taxRate).toBe(8.25);
    });
  });

  describe('Settings Categories', () => {
    it('should organize settings by category', async () => {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'store.name', value: 'Test Store', type: 'string', category: 'store' },
          { key: 'store.address', value: '123 Main St', type: 'string', category: 'store' },
          { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
          { key: 'pos.cashDrawer', value: 'true', type: 'boolean', category: 'pos' },
          { key: 'user.sessionTimeout', value: '30', type: 'number', category: 'user' }
        ]
      });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });
      const posSettings = await prisma.systemSetting.findMany({
        where: { category: 'pos' }
      });
      const userSettings = await prisma.systemSetting.findMany({
        where: { category: 'user' }
      });

      expect(storeSettings.length).toBe(2);
      expect(posSettings.length).toBe(2);
      expect(userSettings.length).toBe(1);
    });
  });

  describe('Settings Performance', () => {
    it('should handle bulk settings operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 settings
      const bulkSettings = Array.from({ length: 100 }, (_, i) => ({
        key: `test.setting_${i}`,
        value: `value_${i}`,
        type: 'string',
        category: 'test'
      }));

      await prisma.systemSetting.createMany({ data: bulkSettings });

      // Retrieve all test settings
      const settings = await prisma.systemSetting.findMany({
        where: { category: 'test' }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(settings.length).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Settings Defaults from Seed', () => {
    it('should verify default store settings exist after seed', async () => {
      // Run a simplified version of seed data
      const defaultStoreSettings = [
        { key: 'store.name', value: 'POS System Store', type: 'string', category: 'store' },
        { key: 'store.address', value: '123 Main Street', type: 'string', category: 'store' },
        { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
        { key: 'store.currency', value: 'USD', type: 'string', category: 'store' }
      ];

      await prisma.systemSetting.createMany({ data: defaultStoreSettings });

      const storeSettings = await prisma.systemSetting.findMany({
        where: { category: 'store' }
      });

      expect(storeSettings.length).toBe(4);
      expect(storeSettings.find((s: SystemSetting) => s.key === 'store.name')?.value).toBe('POS System Store');
      expect(storeSettings.find((s: SystemSetting) => s.key === 'store.currency')?.value).toBe('USD');
    });

    it('should verify default POS settings exist after seed', async () => {
      const defaultPOSSettings = [
        { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.emailReceipts', value: 'false', type: 'boolean', category: 'pos' },
        { key: 'pos.barcodeScanner', value: 'true', type: 'boolean', category: 'pos' },
        { key: 'pos.cashDrawer', value: 'true', type: 'boolean', category: 'pos' }
      ];

      await prisma.systemSetting.createMany({ data: defaultPOSSettings });

      const posSettings = await prisma.systemSetting.findMany({
        where: { category: 'pos' }
      });

      expect(posSettings.length).toBe(4);
      expect(posSettings.find((s: SystemSetting) => s.key === 'pos.autoPrint')?.value).toBe('true');
      expect(posSettings.find((s: SystemSetting) => s.key === 'pos.emailReceipts')?.value).toBe('false');
    });
  });

  describe('Settings Integration with Users', () => {
    it('should handle user-specific settings', async () => {
      // Create user-specific settings (though current schema doesn't have userId in systemSetting)
      const userSettings = [
        { key: 'user.theme', value: 'dark', type: 'string', category: 'user' },
        { key: 'user.language', value: 'en', type: 'string', category: 'user' },
        { key: 'user.sessionTimeout', value: '30', type: 'number', category: 'user' }
      ];

      await prisma.systemSetting.createMany({ data: userSettings });

      const settings = await prisma.systemSetting.findMany({
        where: { category: 'user' }
      });

      expect(settings.length).toBe(3);
      expect(settings.find((s: SystemSetting) => s.key === 'user.theme')?.value).toBe('dark');
    });
  });
});
