import { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient;
}

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_system_test?schema=public';
  
  // Initialize Prisma client for tests
  global.__PRISMA__ = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
});

beforeEach(async () => {
  // Clean up database before each test
  await global.__PRISMA__.$transaction([
    global.__PRISMA__.systemSetting.deleteMany(),
    global.__PRISMA__.payment.deleteMany(),
    global.__PRISMA__.saleItem.deleteMany(),
    global.__PRISMA__.sale.deleteMany(),
    global.__PRISMA__.inventoryItem.deleteMany(),
    global.__PRISMA__.product.deleteMany(),
    global.__PRISMA__.category.deleteMany(),
    global.__PRISMA__.supplier.deleteMany(),
    global.__PRISMA__.customer.deleteMany(),
    global.__PRISMA__.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await global.__PRISMA__.$disconnect();
});
