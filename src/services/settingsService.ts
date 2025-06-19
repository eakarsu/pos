import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const settingsService = {
  async getAllSettings() {
    return await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });
  },

  async getSettingsByCategory(category: string) {
    return await prisma.systemSetting.findMany({
      where: {
        OR: [
          { category },
          { key: { startsWith: `${category}.` } }
        ]
      },
      orderBy: { key: 'asc' }
    });
  },

  async getSettingByKey(key: string) {
    return await prisma.systemSetting.findUnique({
      where: { key }
    });
  },

  async updateSettingsByCategory(category: string, settingsData: Record<string, any>) {
    const updates = [];
    
    for (const [settingKey, value] of Object.entries(settingsData)) {
      const fullKey = `${category}.${settingKey}`;
      const type = typeof value === 'number' ? 'number' : 
                  typeof value === 'boolean' ? 'boolean' :
                  Array.isArray(value) || typeof value === 'object' ? 'json' : 'string';
      
      const stringValue = type === 'json' ? JSON.stringify(value) : value.toString();
      
      const update = prisma.systemSetting.upsert({
        where: { key: fullKey },
        update: {
          value: stringValue,
          type,
          category,
          updatedAt: new Date()
        },
        create: {
          key: fullKey,
          value: stringValue,
          type,
          category
        }
      });
      
      updates.push(update);
    }
    
    return await Promise.all(updates);
  },

  async updateSettingByKey(key: string, value: string, type: string = 'string') {
    return await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        type,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        type,
        category: key.includes('.') ? key.split('.')[0] : 'general'
      }
    });
  },

  async createSetting(key: string, value: string, type: string = 'string', category?: string) {
    const settingCategory = category || (key.includes('.') ? key.split('.')[0] : 'general');
    
    return await prisma.systemSetting.create({
      data: {
        key,
        value,
        type,
        category: settingCategory
      }
    });
  },

  async deleteSetting(key: string) {
    return await prisma.systemSetting.delete({
      where: { key }
    });
  }
};
