import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../setup/testSetup';

describe('Categories Integration Tests', () => {
  let testData: any;
  let authToken: string;

  beforeEach(async () => {
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

  describe('POST /api/v1/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic items'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.data.category.name).toBe(categoryData.name);
    });

    it('should reject duplicate category name', async () => {
      const categoryData = {
        name: 'Food' // This name already exists
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should update category', async () => {
      const updateData = {
        name: 'Updated Food Category',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testData.foodCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.category.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should soft delete category', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testData.beverageCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
});
