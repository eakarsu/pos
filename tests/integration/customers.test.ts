import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase, testPrisma } from '../setup/testSetup';

describe('Customers Integration Tests', () => {
  let testData: any;
  let authToken: string;

  beforeAll(async () => {
    testData = await setupTestDatabase();
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'test123'
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toBeDefined();
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1-555-123-4567',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.data.customer.firstName).toBe(customerData.firstName);
      expect(response.body.data.customer.email).toBe(customerData.email);
    });

    it('should reject duplicate email', async () => {
      const customerData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'customer@test.com' // This email already exists
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should get all customers with search', async () => {
      const response = await request(app)
        .get('/api/v1/customers?search=Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.customers.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/customers/:id/loyalty', () => {
    it('should add loyalty points', async () => {
      const loyaltyData = {
        points: 50,
        description: 'Test loyalty points'
      };

      const response = await request(app)
        .post(`/api/v1/customers/${testData.customer.id}/loyalty`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(loyaltyData);

      expect(response.status).toBe(200);

      // Verify points were added
      const customer = await testPrisma.customer.findUnique({
        where: { id: testData.customer.id }
      });
      expect(customer?.loyaltyPoints).toBe(150); // 100 initial + 50 added
    });

    it('should deduct loyalty points', async () => {
      const loyaltyData = {
        points: -25,
        description: 'Points redemption'
      };

      const response = await request(app)
        .post(`/api/v1/customers/${testData.customer.id}/loyalty`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(loyaltyData);

      expect(response.status).toBe(200);
    });
  });
});
