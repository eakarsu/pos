import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase, testPrisma } from '../setup/testSetup';

describe('Full POS Workflow Integration Tests', () => {
  let testData: any;
  let authToken: string;

  beforeEach(async () => {
    testData = await setupTestDatabase();
    
    // Get auth token
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

  describe('Complete POS Workflow', () => {
    it('should complete a full customer purchase workflow', async () => {
      // Step 1: Create a new customer
      const customerData = {
        firstName: 'Workflow',
        lastName: 'Customer',
        email: 'workflow@test.com',
        phone: '+1-555-000-0010'
      };

      const customerResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      expect(customerResponse.status).toBe(201);
      const customerId = customerResponse.body.data.customer.id;

      // Step 2: Check product availability
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(productsResponse.status).toBe(200);
      const products = productsResponse.body.data.products;
      expect(products.length).toBeGreaterThan(0);

      // Step 3: Check inventory levels
      const inventoryResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(inventoryResponse.status).toBe(200);
      const inventoryItems = inventoryResponse.body.data.inventoryItems;

      // Step 4: Create a sale with multiple items
      const saleData = {
        customerId: customerId,
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
            method: 'CREDIT_CARD'
          }
        ]
      };

      const saleResponse = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(saleResponse.status).toBe(201);
      const sale = saleResponse.body.data.sale;

      // Step 5: Verify inventory was updated
      const updatedInventoryResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      const updatedInventory = updatedInventoryResponse.body.data.inventoryItems;
      const product1Inventory = updatedInventory.find((item: any) => 
        item.product.id === testData.product1.id
      );
      const product2Inventory = updatedInventory.find((item: any) => 
        item.product.id === testData.product2.id
      );

      expect(product1Inventory.quantity).toBe(48); // 50 - 2
      expect(product2Inventory.quantity).toBe(24); // 25 - 1

      // Step 6: Verify customer's purchase history
      const customerDetailsResponse = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(customerDetailsResponse.status).toBe(200);
      const customerDetails = customerDetailsResponse.body.data.customer;
      expect(customerDetails.sales.length).toBe(1);
      expect(customerDetails.sales[0].id).toBe(sale.id);

      // Step 7: Add loyalty points for the purchase
      const loyaltyData = {
        points: 17, // 1 point per dollar spent
        description: 'Purchase reward',
        referenceId: sale.id
      };

      const loyaltyResponse = await request(app)
        .post(`/api/v1/customers/${customerId}/loyalty`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(loyaltyData);

      expect(loyaltyResponse.status).toBe(200);

      // Step 8: Generate sales report to verify transaction
      const reportsResponse = await request(app)
        .get('/api/v1/reports/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(reportsResponse.status).toBe(200);
      const salesReport = reportsResponse.body.data;
      expect(salesReport.summary.totalTransactions).toBeGreaterThan(0);
      expect(salesReport.summary.totalSales).toBeGreaterThan(0);

      // Step 9: Verify payment was processed
      const saleDetailsResponse = await request(app)
        .get(`/api/v1/sales/${sale.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(saleDetailsResponse.status).toBe(200);
      const saleDetails = saleDetailsResponse.body.data.sale;
      expect(saleDetails.payments.length).toBe(1);
      expect(saleDetails.payments[0].method).toBe('CREDIT_CARD');
      expect(Number(saleDetails.payments[0].amount)).toBe(17.27);
    });

    it('should handle low stock alert workflow', async () => {
      // Reduce inventory to trigger low stock alert
      const adjustmentData = {
        productId: testData.product1.id,
        quantity: -45, // Reduce from ~48 to ~3 (below reorderPoint of 5)
        reason: 'Test low stock scenario'
      };

      const adjustmentResponse = await request(app)
        .post('/api/v1/inventory/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData);

      expect(adjustmentResponse.status).toBe(201);

      // Check low stock alerts
      const alertsResponse = await request(app)
        .get('/api/v1/inventory/alerts/low-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertsResponse.status).toBe(200);
      const lowStockItems = alertsResponse.body.data.lowStockItems;
      
      const lowStockProduct = lowStockItems.find((item: any) => 
        item.product.id === testData.product1.id
      );
      expect(lowStockProduct).toBeTruthy();

      // Generate inventory report to see low stock summary
      const inventoryReportResponse = await request(app)
        .get('/api/v1/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(inventoryReportResponse.status).toBe(200);
      const inventoryReport = inventoryReportResponse.body.data;
      expect(inventoryReport.summary.lowStockCount).toBeGreaterThan(0);
    });
  });
});
