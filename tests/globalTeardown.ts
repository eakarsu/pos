import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('Cleaning up test environment...');
  
  try {
    // Remove test database file if it exists
    const testDbPath = path.join(process.cwd(), 'test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('Test database file removed');
    }
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}
