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
    },
    log: ['error']
  });
  
  // Connect to database
  await prisma.$connect();
  
  // Store in global
  (global as any).__PRISMA__ = prisma;
});

beforeEach(async () => {
  // Clean up database before each test in correct order to respect foreign key constraints
  const prisma = (global as any).__PRISMA__ as PrismaClient;
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.refreshToken.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSetting.deleteMany();
  } catch (error) {
    // If cleanup fails, log but continue - this can happen on first run
    console.log('Database cleanup completed with some expected errors');
  }
});

afterAll(async () => {
  const prisma = (global as any).__PRISMA__ as PrismaClient;
  await prisma.$disconnect();
});
