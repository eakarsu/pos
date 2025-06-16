import { PrismaClient, UserRole } from '@prisma/client';
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
      role: UserRole.ADMIN,
      employeeId: 'EMP001',
      phone: '+1-555-123-4567',
      hireDate: new Date(),
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create default categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Food & Beverages', description: 'Food items and drinks' },
    { name: 'Books', description: 'Books and educational materials' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Created default categories');

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
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
