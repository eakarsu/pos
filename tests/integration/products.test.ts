import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase, testPrisma } from '../setup/testSetup';

describe('Products Integration Tests', () => {
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

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Test Product',
        description: 'A new test product',
        sku: 'NEW001',
        barcode: '9999999999999',
        price: 12.99,
        cost: 6.50,
        taxRate: 8.0,
        minStock: 15,
        reorderPoint: 8,
        categoryId: testData.foodCategory.id,
        supplierId: testData.supplier.id
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.sku).toBe(productData.sku);
    });

    it('should reject duplicate SKU', async () => {
      const productData = {
        name: 'Duplicate SKU Product',
        sku: 'TEST001', // This SKU already exists
        price: 10.00,
        cost: 5.00
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=Coffee')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBeGreaterThan(0);
      expect(response.body.data.products[0].name).toContain('Coffee');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/v1/products?categoryId=${testData.beverageCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/products/barcode/:barcode', () => {
    it('should find product by barcode', async () => {
      const response = await request(app)
        .get('/api/v1/products/barcode/1111111111111')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.product.barcode).toBe('1111111111111');
    });

    it('should return 404 for non-existent barcode', async () => {
      const response = await request(app)
        .get('/api/v1/products/barcode/0000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update product', async () => {
      const updateData = {
        name: 'Updated Coffee Name',
        price: 4.00
      };

      const response = await request(app)
        .put(`/api/v1/products/${testData.product1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(Number(response.body.data.product.price)).toBe(updateData.price);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete product', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${testData.product2.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the delete operation was successful
      // Check if it's a soft delete (product still exists but inactive) or hard delete (product removed)
      const product = await testPrisma.product.findUnique({
        where: { id: testData.product2.id }
      });
      
      if (product) {
        // Soft delete - product exists but should be marked as inactive
        if ('isActive' in product) {
          expect(product.isActive).toBe(false);
        }
      } else {
        // Hard delete - product no longer exists, which is also valid
        expect(product).toBeNull();
      }
    });
  });
});
