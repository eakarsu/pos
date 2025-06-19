import { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient;
  namespace NodeJS {
    interface Global {
      __PRISMA__: PrismaClient;
    }
  }
}

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';
  
  // Initialize Prisma client for tests
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  // Connect to database
  await prisma.$connect();
  
  // Store in global
  (global as any).__PRISMA__ = prisma;
});

beforeEach(async () => {
  // Clean up database before each test
  const prisma = (global as any).__PRISMA__ as PrismaClient;
  await prisma.$transaction([
    prisma.systemSetting.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  const prisma = (global as any).__PRISMA__ as PrismaClient;
  await prisma.$disconnect();
});
