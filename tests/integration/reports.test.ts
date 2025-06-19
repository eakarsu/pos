import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../setup/testSetup';

describe('Reports Integration Tests', () => {
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
    
    authToken = loginResponse.body.data.accessToken;

    // Create some test sales for reporting
    await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: testData.customer.id,
        userId: testData.adminUser.id,
        items: [
          {
            productId: testData.product1.id,
            quantity: 3,
            unitPrice: 3.50,
            taxRate: 8.0
          }
        ],
        payments: [
          {
            amount: 11.34,
            method: 'CASH'
          }
        ]
      });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/v1/reports/sales', () => {
    it('should get sales report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalSales).toBeGreaterThan(0);
      expect(response.body.data.summary.totalTransactions).toBeGreaterThan(0);
      expect(response.body.data.salesByDate).toBeDefined();
    });

    it('should filter sales report by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/reports/sales?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalSales).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/reports/inventory', () => {
    it('should get inventory report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalItems).toBeGreaterThan(0);
      expect(response.body.data.summary.totalValue).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/reports/customers', () => {
    it('should get customer report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalCustomers).toBeGreaterThan(0);
    });
  });
});
