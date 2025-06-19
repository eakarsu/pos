import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Set the DATABASE_URL to test database for the entire application during tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_system_test?schema=public';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export async function setupTestDatabase() {
  // Ensure database schema exists by pushing the schema
  try {
    await testPrisma.$executeRaw`SELECT 1`;
  } catch (error) {
    console.log('Database connection failed, this is expected for first run');
  }

  // Clean database - delete in order to respect foreign key constraints
  try {
    await testPrisma.refreshToken.deleteMany();
    await testPrisma.payment.deleteMany();
    await testPrisma.saleItem.deleteMany();
    await testPrisma.sale.deleteMany();
    await testPrisma.loyaltyTransaction.deleteMany();
    await testPrisma.inventoryMovement.deleteMany();
    await testPrisma.inventoryItem.deleteMany();
    await testPrisma.product.deleteMany();
    await testPrisma.customer.deleteMany();
    await testPrisma.supplier.deleteMany();
    await testPrisma.category.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.systemSetting.deleteMany();
  } catch (error) {
    // If tables don't exist, that's fine - they'll be created by Prisma
    console.log('Note: Some tables may not exist yet, which is normal for first run');
  }

  // Create test users
  const hashedPassword = await bcrypt.hash('test123', 12);
  
  const adminUser = await testPrisma.user.create({
    data: {
      email: 'admin@test.com',
      username: 'admin',
      firstName: 'Test',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      employeeId: 'TEST001',
      phone: '+1-555-000-0001',
      hireDate: new Date(),
    }
  });

  const cashierUser = await testPrisma.user.create({
    data: {
      email: 'cashier@test.com',
      username: 'cashier',
      firstName: 'Test',
      lastName: 'Cashier',
      password: hashedPassword,
      role: 'CASHIER',
      employeeId: 'TEST002',
      phone: '+1-555-000-0002',
      hireDate: new Date(),
    }
  });

  // Create test categories
  const foodCategory = await testPrisma.category.create({
    data: {
      name: 'Food',
      description: 'Food items'
    }
  });

  const beverageCategory = await testPrisma.category.create({
    data: {
      name: 'Beverages',
      description: 'Drink items'
    }
  });

  // Create test supplier
  const supplier = await testPrisma.supplier.create({
    data: {
      name: 'Test Supplier',
      contactName: 'John Doe',
      email: 'supplier@test.com',
      phone: '+1-555-000-0003',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    }
  });

  // Create test products
  const product1 = await testPrisma.product.create({
    data: {
      name: 'Test Coffee',
      description: 'Test coffee product',
      sku: 'TEST001',
      barcode: '1111111111111',
      price: 3.50,
      cost: 1.75,
      taxRate: 8.0,
      minStock: 10,
      reorderPoint: 5,
      categoryId: beverageCategory.id,
      supplierId: supplier.id
    }
  });

  const product2 = await testPrisma.product.create({
    data: {
      name: 'Test Sandwich',
      description: 'Test sandwich product',
      sku: 'TEST002',
      barcode: '2222222222222',
      price: 8.99,
      cost: 4.50,
      taxRate: 8.0,
      minStock: 5,
      reorderPoint: 3,
      categoryId: foodCategory.id,
      supplierId: supplier.id
    }
  });

  // Create inventory items
  await testPrisma.inventoryItem.create({
    data: {
      productId: product1.id,
      quantity: 50,
      reservedQty: 0,
      location: 'Test Store',
      lastUpdated: new Date()
    }
  });

  await testPrisma.inventoryItem.create({
    data: {
      productId: product2.id,
      quantity: 25,
      reservedQty: 0,
      location: 'Test Store',
      lastUpdated: new Date()
    }
  });

  // Create test customer
  const customer = await testPrisma.customer.create({
    data: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      phone: '+1-555-000-0004',
      address: '456 Test Ave',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      loyaltyPoints: 100,
      totalSpent: 0
    }
  });

  return {
    adminUser,
    cashierUser,
    foodCategory,
    beverageCategory,
    supplier,
    product1,
    product2,
    customer
  };
}

export async function cleanupTestDatabase() {
  try {
    await testPrisma.refreshToken.deleteMany();
    await testPrisma.payment.deleteMany();
    await testPrisma.saleItem.deleteMany();
    await testPrisma.sale.deleteMany();
    await testPrisma.loyaltyTransaction.deleteMany();
    await testPrisma.inventoryMovement.deleteMany();
    await testPrisma.inventoryItem.deleteMany();
    await testPrisma.product.deleteMany();
    await testPrisma.customer.deleteMany();
    await testPrisma.supplier.deleteMany();
    await testPrisma.category.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.systemSetting.deleteMany();
  } catch (error) {
    // Ignore cleanup errors
    console.log('Cleanup completed with some expected errors');
  }
  await testPrisma.$disconnect();
}
