import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
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
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create additional users
  const cashierPassword = await bcrypt.hash('cashier123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);

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
    },
  });

  console.log('✅ Created additional users');

  // Create default categories
  const categories = [
    { name: 'Food', description: 'Food items and snacks' },
    { name: 'Beverages', description: 'Drinks and beverages' },
    { name: 'Snacks', description: 'Snacks and confectionery' },
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
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

  console.log('✅ Created default categories');

  // Create suppliers
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
  ];

  const createdSuppliers = [];
  for (const supplier of suppliers) {
    const sup = await prisma.supplier.create({
      data: supplier,
    });
    createdSuppliers.push(sup);
  }

  console.log('✅ Created suppliers');

  // Create products
  const products = [
    {
      name: 'Coffee',
      description: 'Premium roasted coffee',
      sku: 'COFFEE001',
      barcode: '1234567890123',
      price: 3.50,
      cost: 1.75,
      taxRate: 8.0,
      minStock: 20,
      reorderPoint: 10,
      categoryId: createdCategories.find(c => c.name === 'Beverages')?.id,
      supplierId: createdSuppliers[1]?.id,
    },
    {
      name: 'Sandwich',
      description: 'Fresh deli sandwich',
      sku: 'SAND001',
      barcode: '1234567890124',
      price: 8.99,
      cost: 4.50,
      taxRate: 8.0,
      minStock: 15,
      reorderPoint: 8,
      categoryId: createdCategories.find(c => c.name === 'Food')?.id,
      supplierId: createdSuppliers[0]?.id,
    },
    {
      name: 'Soda',
      description: 'Refreshing carbonated drink',
      sku: 'SODA001',
      barcode: '1234567890125',
      price: 2.25,
      cost: 1.00,
      taxRate: 8.0,
      minStock: 50,
      reorderPoint: 25,
      categoryId: createdCategories.find(c => c.name === 'Beverages')?.id,
      supplierId: createdSuppliers[1]?.id,
    },
    {
      name: 'Chips',
      description: 'Crispy potato chips',
      sku: 'CHIPS001',
      barcode: '1234567890126',
      price: 1.99,
      cost: 0.80,
      taxRate: 8.0,
      minStock: 30,
      reorderPoint: 15,
      categoryId: createdCategories.find(c => c.name === 'Snacks')?.id,
      supplierId: createdSuppliers[2]?.id,
    },
    {
      name: 'Water',
      description: 'Pure bottled water',
      sku: 'WATER001',
      barcode: '1234567890127',
      price: 1.50,
      cost: 0.50,
      taxRate: 0.0,
      minStock: 100,
      reorderPoint: 50,
      categoryId: createdCategories.find(c => c.name === 'Beverages')?.id,
      supplierId: createdSuppliers[1]?.id,
    },
    {
      name: 'Candy',
      description: 'Sweet candy bar',
      sku: 'CANDY001',
      barcode: '1234567890128',
      price: 0.99,
      cost: 0.40,
      taxRate: 8.0,
      minStock: 40,
      reorderPoint: 20,
      categoryId: createdCategories.find(c => c.name === 'Snacks')?.id,
      supplierId: createdSuppliers[2]?.id,
    },
    {
      name: 'Pizza Slice',
      description: 'Hot pizza slice',
      sku: 'PIZZA001',
      barcode: '1234567890129',
      price: 4.50,
      cost: 2.25,
      taxRate: 8.0,
      minStock: 10,
      reorderPoint: 5,
      categoryId: createdCategories.find(c => c.name === 'Food')?.id,
      supplierId: createdSuppliers[0]?.id,
    },
    {
      name: 'Energy Drink',
      description: 'High caffeine energy drink',
      sku: 'ENERGY001',
      barcode: '1234567890130',
      price: 3.25,
      cost: 1.50,
      taxRate: 8.0,
      minStock: 25,
      reorderPoint: 12,
      categoryId: createdCategories.find(c => c.name === 'Beverages')?.id,
      supplierId: createdSuppliers[1]?.id,
    },
    {
      name: 'Donut',
      description: 'Fresh glazed donut',
      sku: 'DONUT001',
      barcode: '1234567890131',
      price: 2.50,
      cost: 1.00,
      taxRate: 8.0,
      minStock: 20,
      reorderPoint: 10,
      categoryId: createdCategories.find(c => c.name === 'Food')?.id,
      supplierId: createdSuppliers[0]?.id,
    },
    {
      name: 'Ice Cream',
      description: 'Premium ice cream',
      sku: 'ICE001',
      barcode: '1234567890132',
      price: 4.99,
      cost: 2.50,
      taxRate: 8.0,
      minStock: 15,
      reorderPoint: 8,
      categoryId: createdCategories.find(c => c.name === 'Food')?.id,
      supplierId: createdSuppliers[0]?.id,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const prod = await prisma.product.create({
      data: product,
    });
    createdProducts.push(prod);
  }

  console.log('✅ Created products');

  // Create inventory items
  for (const product of createdProducts) {
    const randomStock = Math.floor(Math.random() * 100) + 20; // 20-120 items
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        quantity: randomStock,
        reservedQty: Math.floor(Math.random() * 5), // 0-5 reserved
        location: 'Main Store',
        lastUpdated: new Date(),
      },
    });
  }

  console.log('✅ Created inventory items');

  // Create customers
  const customers = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@email.com',
      phone: '+1-555-200-2001',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      loyaltyPoints: 150,
      totalSpent: 245.67,
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob.smith@email.com',
      phone: '+1-555-200-2002',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      loyaltyPoints: 89,
      totalSpent: 178.43,
    },
    {
      firstName: 'Carol',
      lastName: 'Davis',
      email: 'carol.davis@email.com',
      phone: '+1-555-200-2003',
      address: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      loyaltyPoints: 234,
      totalSpent: 456.78,
    },
    {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@email.com',
      phone: '+1-555-200-2004',
      address: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      loyaltyPoints: 67,
      totalSpent: 123.45,
    },
    {
      firstName: 'Emma',
      lastName: 'Brown',
      email: 'emma.brown@email.com',
      phone: '+1-555-200-2005',
      address: '654 Maple Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      loyaltyPoints: 312,
      totalSpent: 678.90,
    },
    {
      firstName: 'Frank',
      lastName: 'Miller',
      email: 'frank.miller@email.com',
      phone: '+1-555-200-2006',
      address: '987 Cedar Ln',
      city: 'Philadelphia',
      state: 'PA',
      zipCode: '19101',
      loyaltyPoints: 45,
      totalSpent: 89.12,
    },
    {
      firstName: 'Grace',
      lastName: 'Taylor',
      email: 'grace.taylor@email.com',
      phone: '+1-555-200-2007',
      address: '147 Birch St',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78201',
      loyaltyPoints: 198,
      totalSpent: 345.67,
    },
    {
      firstName: 'Henry',
      lastName: 'Anderson',
      email: 'henry.anderson@email.com',
      phone: '+1-555-200-2008',
      address: '258 Spruce Ave',
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      loyaltyPoints: 123,
      totalSpent: 234.56,
    },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    const cust = await prisma.customer.create({
      data: customer,
    });
    createdCustomers.push(cust);
  }

  console.log('✅ Created customers');

  // Create sample sales
  const saleCount = await prisma.sale.count();
  for (let i = 0; i < 20; i++) {
    const randomCustomer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const randomUser = Math.random() > 0.5 ? adminUser : cashierUser;
    const saleDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    // Generate random items for sale
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
    const saleItems = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
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
    
    const taxAmount = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + taxAmount;
    
    const sale = await prisma.sale.create({
      data: {
        saleNumber: `SALE-${String(saleCount + i + 1).padStart(6, '0')}`,
        customerId: Math.random() > 0.3 ? randomCustomer.id : null, // 70% chance of having customer
        userId: randomUser.id,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: saleDate,
        updatedAt: saleDate,
        items: {
          create: saleItems,
        },
      },
    });
    
    // Create payment
    await prisma.payment.create({
      data: {
        saleId: sale.id,
        amount: totalAmount,
        method: Math.random() > 0.5 ? 'CASH' : 'CREDIT_CARD',
        status: 'PAID',
        createdAt: saleDate,
        updatedAt: saleDate,
      },
    });
    
    // Update customer total spent if customer exists
    if (sale.customerId) {
      await prisma.customer.update({
        where: { id: sale.customerId },
        data: {
          totalSpent: {
            increment: totalAmount,
          },
        },
      });
    }
  }

  console.log('✅ Created sample sales');

  // Create system settings
  const settings = [
    { key: 'business_name', value: 'POS System Store', category: 'business' },
    { key: 'default_tax_rate', value: '0.08', category: 'business' },
    { key: 'currency', value: 'USD', category: 'business' },
    { key: 'receipt_footer', value: 'Thank you for your business!', category: 'receipt' },
    { key: 'low_stock_threshold', value: '10', category: 'inventory' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Created system settings');

  console.log('🎉 Database seed completed successfully!');
  console.log('📊 Sample data created:');
  console.log(`   - ${createdProducts.length} products`);
  console.log(`   - ${createdCustomers.length} customers`);
  console.log(`   - ${createdProducts.length} inventory items`);
  console.log(`   - 20 sample sales with payments`);
  console.log(`   - 3 suppliers`);
  console.log(`   - 3 users (admin, manager, cashier)`);
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
