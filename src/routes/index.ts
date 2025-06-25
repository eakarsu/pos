import { Router } from 'express';
import { config } from '../config/environment';

// Import route modules
import authRoutes from './auth';
import productRoutes from './products';
import salesRoutes from './sales';
import customerRoutes from './customers';
import inventoryRoutes from './inventory';
import reportRoutes from './reports';
import categoryRoutes from './categories';
import dashboardRoutes from './dashboard';
import settingsRoutes from './settings';
import systemRoutes from './system';
import contactRoutes from './contact';

const router = Router();

// API version prefix
const API_PREFIX = `/v${config.apiVersion}`;

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
  });
});

// API info route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS System API',
    version: config.apiVersion,
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      sales: '/api/v1/sales',
      customers: '/api/v1/customers',
      inventory: '/api/v1/inventory',
      reports: '/api/v1/reports',
      categories: '/api/v1/categories',
      dashboard: '/api/v1/dashboard',
      settings: '/api/v1/settings',
      system: '/api/v1/system',
    },
  });
});

// Route modules
router.use(`/api/v1/auth`, authRoutes);
router.use(`/api/v1/products`, productRoutes);
router.use(`/api/v1/sales`, salesRoutes);
router.use(`/api/v1/customers`, customerRoutes);
router.use(`/api/v1/inventory`, inventoryRoutes);
router.use(`/api/v1/reports`, reportRoutes);
router.use(`/api/v1/categories`, categoryRoutes);
router.use(`/api/v1/dashboard`, dashboardRoutes);
router.use(`/api/v1/settings`, settingsRoutes);
router.use(`/api/v1/system`, systemRoutes);

export default router;
