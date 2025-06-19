import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Setting up test database...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';
  
  try {
    // Reset and setup test database
    execSync('npx prisma db push --force-reset', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}
