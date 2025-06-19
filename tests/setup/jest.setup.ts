import { testPrisma } from './testSetup';

// Global test setup
beforeAll(async () => {
  // Ensure test database connection
  await testPrisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await testPrisma.$disconnect();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
