import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_DISPOSABLE_SEED !== 'YES') {
    throw new Error('Seeding is disabled; set ALLOW_DISPOSABLE_SEED=YES only for a disposable database');
  }
  const seedPassword = process.env.SEED_USER_PASSWORD || '';
  if (seedPassword.length < 16) {
    throw new Error('SEED_USER_PASSWORD must contain at least 16 characters');
  }
  console.log('🌱 Starting database seed...');

  // Create users (5 total)
  const hashedPassword = await bcrypt.hash(seedPassword, 12);
  const cashierPassword = hashedPassword;
  const managerPassword = hashedPassword;

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      email: 'admin@pos.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      employeeId: 'EMP001',
      phone: '+1-555-123-4567',
      hireDate: new Date(),
      emailVerified: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@pos.com' },
    update: {},
    create: {
      email: 'cashier@pos.com',
      username: 'cashier',
      firstName: 'John',
      lastName: 'Doe',
      password: cashierPassword,
      role: 'CASHIER',
      employeeId: 'EMP002',
      phone: '+1-555-123-4568',
      hireDate: new Date(),
      emailVerified: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@pos.com' },
    update: {},
    create: {
      email: 'manager@pos.com',
      username: 'manager',
      firstName: 'Jane',
      lastName: 'Smith',
      password: managerPassword,
      role: 'MANAGER',
      employeeId: 'EMP003',
      phone: '+1-555-123-4569',
      hireDate: new Date(),
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier2@pos.com' },
    update: {},
    create: {
      email: 'cashier2@pos.com',
      username: 'cashier2',
      firstName: 'Maria',
      lastName: 'Garcia',
      password: cashierPassword,
      role: 'CASHIER',
      employeeId: 'EMP004',
      phone: '+1-555-123-4570',
      hireDate: new Date(),
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@pos.com' },
    update: {},
    create: {
      email: 'customer@pos.com',
      username: 'customeruser',
      firstName: 'Robert',
      lastName: 'Lee',
      password: cashierPassword,
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  console.log('✅ Created 5 users');

  // Create categories (8 total)
  const categories = [
    { name: 'Food', description: 'Food items and snacks' },
    { name: 'Beverages', description: 'Drinks and beverages' },
    { name: 'Snacks', description: 'Snacks and confectionery' },
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Health & Beauty', description: 'Health and beauty products' },
    { name: 'Household', description: 'Household supplies and cleaning' },
    { name: 'Dairy', description: 'Dairy and refrigerated products' },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const cat = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    createdCategories.push(cat);
  }

  console.log('✅ Created 8 categories');

  // Create suppliers (5 total)
  const suppliers = [
    {
      name: 'Fresh Foods Inc.',
      contactName: 'Mike Johnson',
      email: 'mike@freshfoods.com',
      phone: '+1-555-100-1001',
      address: '123 Food Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    {
      name: 'Beverage Distributors',
      contactName: 'Sarah Wilson',
      email: 'sarah@beverages.com',
      phone: '+1-555-100-1002',
      address: '456 Drink Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
    },
    {
      name: 'Snack Supply Co.',
      contactName: 'Tom Brown',
      email: 'tom@snacksupply.com',
      phone: '+1-555-100-1003',
      address: '789 Snack Blvd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
    },
    {
      name: 'Tech Supplies Inc.',
      contactName: 'Lisa Chen',
      email: 'lisa@techsupplies.com',
      phone: '+1-555-100-1004',
      address: '321 Tech Park',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95101',
    },
    {
      name: 'Health & Beauty Wholesale',
      contactName: 'Amanda White',
      email: 'amanda@hbwholesale.com',
      phone: '+1-555-100-1005',
      address: '654 Wellness Way',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
    },
  ];

  const createdSuppliers = [];
  for (const supplier of suppliers) {
    const sup = await prisma.supplier.create({
      data: supplier,
    });
    createdSuppliers.push(sup);
  }

  console.log('✅ Created 5 suppliers');

  // Create products (16 total)
  const getCatId = (name: string) => createdCategories.find(c => c.name === name)?.id;
  const products = [
    { name: 'Coffee', description: 'Premium roasted coffee', sku: 'COFFEE001', barcode: '1234567890123', price: 3.50, cost: 1.75, taxRate: 8.0, minStock: 20, reorderPoint: 10, categoryId: getCatId('Beverages'), supplierId: createdSuppliers[1]?.id },
    { name: 'Sandwich', description: 'Fresh deli sandwich', sku: 'SAND001', barcode: '1234567890124', price: 8.99, cost: 4.50, taxRate: 8.0, minStock: 15, reorderPoint: 8, categoryId: getCatId('Food'), supplierId: createdSuppliers[0]?.id },
    { name: 'Soda', description: 'Refreshing carbonated drink', sku: 'SODA001', barcode: '1234567890125', price: 2.25, cost: 1.00, taxRate: 8.0, minStock: 50, reorderPoint: 25, categoryId: getCatId('Beverages'), supplierId: createdSuppliers[1]?.id },
    { name: 'Chips', description: 'Crispy potato chips', sku: 'CHIPS001', barcode: '1234567890126', price: 1.99, cost: 0.80, taxRate: 8.0, minStock: 30, reorderPoint: 15, categoryId: getCatId('Snacks'), supplierId: createdSuppliers[2]?.id },
    { name: 'Water', description: 'Pure bottled water', sku: 'WATER001', barcode: '1234567890127', price: 1.50, cost: 0.50, taxRate: 0.0, minStock: 100, reorderPoint: 50, categoryId: getCatId('Beverages'), supplierId: createdSuppliers[1]?.id },
    { name: 'Candy', description: 'Sweet candy bar', sku: 'CANDY001', barcode: '1234567890128', price: 0.99, cost: 0.40, taxRate: 8.0, minStock: 40, reorderPoint: 20, categoryId: getCatId('Snacks'), supplierId: createdSuppliers[2]?.id },
    { name: 'Pizza Slice', description: 'Hot pizza slice', sku: 'PIZZA001', barcode: '1234567890129', price: 4.50, cost: 2.25, taxRate: 8.0, minStock: 10, reorderPoint: 5, categoryId: getCatId('Food'), supplierId: createdSuppliers[0]?.id },
    { name: 'Energy Drink', description: 'High caffeine energy drink', sku: 'ENERGY001', barcode: '1234567890130', price: 3.25, cost: 1.50, taxRate: 8.0, minStock: 25, reorderPoint: 12, categoryId: getCatId('Beverages'), supplierId: createdSuppliers[1]?.id },
    { name: 'Donut', description: 'Fresh glazed donut', sku: 'DONUT001', barcode: '1234567890131', price: 2.50, cost: 1.00, taxRate: 8.0, minStock: 20, reorderPoint: 10, categoryId: getCatId('Food'), supplierId: createdSuppliers[0]?.id },
    { name: 'Ice Cream', description: 'Premium ice cream', sku: 'ICE001', barcode: '1234567890132', price: 4.99, cost: 2.50, taxRate: 8.0, minStock: 15, reorderPoint: 8, categoryId: getCatId('Dairy'), supplierId: createdSuppliers[0]?.id },
    { name: 'Milk', description: 'Fresh whole milk 1 gallon', sku: 'MILK001', barcode: '1234567890133', price: 4.29, cost: 2.50, taxRate: 0.0, minStock: 30, reorderPoint: 15, categoryId: getCatId('Dairy'), supplierId: createdSuppliers[0]?.id },
    { name: 'Shampoo', description: 'Daily care shampoo 12oz', sku: 'SHAMP001', barcode: '1234567890134', price: 6.99, cost: 3.00, taxRate: 8.0, minStock: 20, reorderPoint: 10, categoryId: getCatId('Health & Beauty'), supplierId: createdSuppliers[4]?.id },
    { name: 'Toothpaste', description: 'Fluoride toothpaste 6oz', sku: 'TOOTH001', barcode: '1234567890135', price: 3.49, cost: 1.50, taxRate: 8.0, minStock: 25, reorderPoint: 12, categoryId: getCatId('Health & Beauty'), supplierId: createdSuppliers[4]?.id },
    { name: 'Paper Towels', description: 'Paper towels 2-pack', sku: 'PAPER001', barcode: '1234567890136', price: 5.99, cost: 2.80, taxRate: 8.0, minStock: 20, reorderPoint: 10, categoryId: getCatId('Household'), supplierId: createdSuppliers[2]?.id },
    { name: 'Yogurt', description: 'Greek yogurt 32oz', sku: 'YOGURT001', barcode: '1234567890137', price: 5.49, cost: 2.75, taxRate: 0.0, minStock: 20, reorderPoint: 10, categoryId: getCatId('Dairy'), supplierId: createdSuppliers[0]?.id },
    { name: 'Orange Juice', description: 'Fresh squeezed OJ 64oz', sku: 'OJ001', barcode: '1234567890138', price: 6.49, cost: 3.25, taxRate: 0.0, minStock: 15, reorderPoint: 8, categoryId: getCatId('Beverages'), supplierId: createdSuppliers[1]?.id },
  ];

  const createdProducts = [];
  for (const product of products) {
    const prod = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    createdProducts.push(prod);
  }

  console.log('✅ Created 16 products');

  // Create inventory items (16 total, one per product)
  for (const product of createdProducts) {
    const randomStock = Math.floor(Math.random() * 100) + 20;
    // Check if inventory item already exists
    const existing = await prisma.inventoryItem.findFirst({
      where: { productId: product.id, variantId: null, batchNumber: null }
    });
    if (!existing) {
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          quantity: randomStock,
          reservedQty: Math.floor(Math.random() * 5),
          location: 'Main Store',
          lastUpdated: new Date(),
        },
      });
    }
  }

  console.log('✅ Created 16 inventory items');

  // Create customers (16 total)
  const customers = [
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@email.com', phone: '+1-555-200-2001', address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', loyaltyPoints: 150, totalSpent: 245.67 },
    { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@email.com', phone: '+1-555-200-2002', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001', loyaltyPoints: 89, totalSpent: 178.43 },
    { firstName: 'Carol', lastName: 'Davis', email: 'carol.davis@email.com', phone: '+1-555-200-2003', address: '789 Pine Rd', city: 'Chicago', state: 'IL', zipCode: '60601', loyaltyPoints: 234, totalSpent: 456.78 },
    { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@email.com', phone: '+1-555-200-2004', address: '321 Elm St', city: 'Houston', state: 'TX', zipCode: '77001', loyaltyPoints: 67, totalSpent: 123.45 },
    { firstName: 'Emma', lastName: 'Brown', email: 'emma.brown@email.com', phone: '+1-555-200-2005', address: '654 Maple Dr', city: 'Phoenix', state: 'AZ', zipCode: '85001', loyaltyPoints: 312, totalSpent: 678.90 },
    { firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@email.com', phone: '+1-555-200-2006', address: '987 Cedar Ln', city: 'Philadelphia', state: 'PA', zipCode: '19101', loyaltyPoints: 45, totalSpent: 89.12 },
    { firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@email.com', phone: '+1-555-200-2007', address: '147 Birch St', city: 'San Antonio', state: 'TX', zipCode: '78201', loyaltyPoints: 198, totalSpent: 345.67 },
    { firstName: 'Henry', lastName: 'Anderson', email: 'henry.anderson@email.com', phone: '+1-555-200-2008', address: '258 Spruce Ave', city: 'San Diego', state: 'CA', zipCode: '92101', loyaltyPoints: 123, totalSpent: 234.56 },
    { firstName: 'Isabella', lastName: 'Martinez', email: 'isabella.martinez@email.com', phone: '+1-555-200-2009', address: '369 Walnut Ct', city: 'Dallas', state: 'TX', zipCode: '75201', loyaltyPoints: 275, totalSpent: 512.34 },
    { firstName: 'James', lastName: 'Thomas', email: 'james.thomas@email.com', phone: '+1-555-200-2010', address: '481 Cherry Ln', city: 'San Jose', state: 'CA', zipCode: '95101', loyaltyPoints: 56, totalSpent: 98.76 },
    { firstName: 'Karen', lastName: 'Jackson', email: 'karen.jackson@email.com', phone: '+1-555-200-2011', address: '592 Ash Blvd', city: 'Austin', state: 'TX', zipCode: '73301', loyaltyPoints: 401, totalSpent: 789.01 },
    { firstName: 'Leo', lastName: 'White', email: 'leo.white@email.com', phone: '+1-555-200-2012', address: '703 Poplar Way', city: 'Jacksonville', state: 'FL', zipCode: '32099', loyaltyPoints: 167, totalSpent: 301.45 },
    { firstName: 'Mia', lastName: 'Harris', email: 'mia.harris@email.com', phone: '+1-555-200-2013', address: '814 Willow Rd', city: 'Columbus', state: 'OH', zipCode: '43004', loyaltyPoints: 89, totalSpent: 145.67 },
    { firstName: 'Nathan', lastName: 'Clark', email: 'nathan.clark@email.com', phone: '+1-555-200-2014', address: '925 Hickory Dr', city: 'Charlotte', state: 'NC', zipCode: '28201', loyaltyPoints: 334, totalSpent: 623.89 },
    { firstName: 'Olivia', lastName: 'Lewis', email: 'olivia.lewis@email.com', phone: '+1-555-200-2015', address: '136 Sycamore St', city: 'Indianapolis', state: 'IN', zipCode: '46201', loyaltyPoints: 210, totalSpent: 387.54 },
    { firstName: 'Peter', lastName: 'Robinson', email: 'peter.robinson@email.com', phone: '+1-555-200-2016', address: '247 Magnolia Ave', city: 'Denver', state: 'CO', zipCode: '80201', loyaltyPoints: 78, totalSpent: 156.32 },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    // Check if customer exists by email
    const existing = await prisma.customer.findUnique({ where: { email: customer.email } });
    if (existing) {
      createdCustomers.push(existing);
    } else {
      const cust = await prisma.customer.create({ data: customer });
      createdCustomers.push(cust);
    }
  }

  console.log('✅ Created 16 customers');

  // Create 30 sample sales
  const saleCount = await prisma.sale.count();
  for (let i = 0; i < 30; i++) {
    const randomCustomer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const randomUser = [adminUser, cashierUser, managerUser][Math.floor(Math.random() * 3)];
    const saleDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    const numItems = Math.floor(Math.random() * 4) + 1;
    const saleItems = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Number(randomProduct.price);
      const totalPrice = quantity * unitPrice;

      saleItems.push({
        productId: randomProduct.id,
        quantity,
        unitPrice,
        discount: 0,
        taxRate: Number(randomProduct.taxRate),
        totalPrice,
      });

      subtotal += totalPrice;
    }

    const taxAmount = subtotal * 0.08;
    const totalAmount = subtotal + taxAmount;

    const sale = await prisma.sale.create({
      data: {
        saleNumber: `SALE-${String(saleCount + i + 1).padStart(6, '0')}`,
        customerId: Math.random() > 0.3 ? randomCustomer.id : null,
        userId: randomUser.id,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: saleDate,
        updatedAt: saleDate,
        items: { create: saleItems },
      },
    });

    await prisma.payment.create({
      data: {
        saleId: sale.id,
        amount: totalAmount,
        method: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD'][Math.floor(Math.random() * 3)],
        status: 'PAID',
        createdAt: saleDate,
        updatedAt: saleDate,
      },
    });

    if (sale.customerId) {
      await prisma.customer.update({
        where: { id: sale.customerId },
        data: { totalSpent: { increment: totalAmount } },
      });
    }
  }

  console.log('✅ Created 30 sample sales');

  // Create system settings
  const allSettings = [
    { key: 'business_name', value: 'POS System Store', category: 'business' },
    { key: 'default_tax_rate', value: '0.08', category: 'business' },
    { key: 'currency', value: 'USD', category: 'business' },
    { key: 'receipt_footer', value: 'Thank you for your business!', category: 'receipt' },
    { key: 'low_stock_threshold', value: '10', category: 'inventory' },
    { key: 'store.name', value: 'POS System Store', category: 'store' },
    { key: 'store.address', value: '123 Main Street', category: 'store' },
    { key: 'store.city', value: 'Anytown', category: 'store' },
    { key: 'store.state', value: 'CA', category: 'store' },
    { key: 'store.zipCode', value: '12345', category: 'store' },
    { key: 'store.phone', value: '(555) 123-4567', category: 'store' },
    { key: 'store.email', value: 'store@example.com', category: 'store' },
    { key: 'store.website', value: 'www.mystore.com', category: 'store' },
    { key: 'store.taxRate', value: '8.25', type: 'number', category: 'store' },
    { key: 'store.currency', value: 'USD', category: 'store' },
    { key: 'store.timezone', value: 'America/Los_Angeles', category: 'store' },
    { key: 'pos.autoPrint', value: 'true', type: 'boolean', category: 'pos' },
    { key: 'pos.emailReceipts', value: 'false', type: 'boolean', category: 'pos' },
    { key: 'pos.printerName', value: 'Default Printer', category: 'pos' },
    { key: 'pos.receiptFooter', value: 'Thank you for your business!', category: 'pos' },
    { key: 'pos.barcodeScanner', value: 'true', type: 'boolean', category: 'pos' },
    { key: 'pos.cashDrawer', value: 'true', type: 'boolean', category: 'pos' },
    { key: 'pos.paymentMethods', value: '["Cash","Credit Card","Debit Card"]', type: 'json', category: 'pos' },
    { key: 'pos.lowStockThreshold', value: '10', type: 'number', category: 'pos' },
  ];

  for (const setting of allSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type || 'string',
        category: setting.category,
      },
    });
  }

  console.log('✅ Created system settings');

  console.log('🎉 Database seed completed successfully!');
  console.log('📊 Sample data created:');
  console.log(`   - 16 products`);
  console.log(`   - 16 customers`);
  console.log(`   - 16 inventory items`);
  console.log(`   - 30 sample sales with payments`);
  console.log(`   - 5 suppliers`);
  console.log(`   - 5 users (admin, manager, 2 cashiers, customer)`);
  console.log(`   - 8 categories`);
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
