import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase, testPrisma } from '../setup/testSetup';

describe('Sales Integration Tests', () => {
  let testData: any;
  let authToken: string;

  beforeEach(async () => {
    testData = await setupTestDatabase();
    
    // Get auth token for each test
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'test123'
      });
    
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/sales', () => {
    it('should create a complete sale with inventory updates', async () => {
      const saleData = {
        customerId: testData.customer.id,
        userId: testData.adminUser.id,
        items: [
          {
            productId: testData.product1.id,
            quantity: 2,
            unitPrice: 3.50,
            taxRate: 8.0
          },
          {
            productId: testData.product2.id,
            quantity: 1,
            unitPrice: 8.99,
            taxRate: 8.0
          }
        ],
        payments: [
          {
            amount: 17.27, // Total with tax
            method: 'CASH'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sale.saleNumber).toMatch(/^SALE-/);
      expect(response.body.data.sale.items).toHaveLength(2);

      // Verify inventory was updated
      const inventory1 = await testPrisma.inventoryItem.findFirst({
        where: { productId: testData.product1.id }
      });
      const inventory2 = await testPrisma.inventoryItem.findFirst({
        where: { productId: testData.product2.id }
      });

      expect(inventory1?.quantity).toBe(48); // 50 - 2
      expect(inventory2?.quantity).toBe(24); // 25 - 1

      // Verify inventory movements were created
      const movements = await testPrisma.inventoryMovement.findMany({
        where: { type: 'OUT' }
      });
      expect(movements).toHaveLength(2);

      // Verify payment was created
      const payment = await testPrisma.payment.findFirst({
        where: { saleId: response.body.data.sale.id }
      });
      expect(payment).toBeTruthy();
      expect(payment?.method).toBe('CASH');
      expect(Number(payment?.amount)).toBe(17.27);
    });

    it('should create sale without customer', async () => {
      const saleData = {
        userId: testData.adminUser.id,
        items: [
          {
            productId: testData.product1.id,
            quantity: 1,
            unitPrice: 3.50,
            taxRate: 8.0
          }
        ],
        payments: [
          {
            amount: 3.78, // 3.50 + 8% tax
            method: 'CREDIT_CARD'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sale.customerId).toBeNull();
    });
  });

  describe('GET /api/v1/sales', () => {
    it('should get all sales with filters', async () => {
      const response = await request(app)
        .get('/api/v1/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sales.length).toBeGreaterThan(0);
    });

    it('should filter sales by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/sales?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
