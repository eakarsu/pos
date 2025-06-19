import { Router } from 'express';
import { config } from '../config/environment';

// Import route modules
import authRoutes from './auth';
import productRoutes from './products';
import salesRoutes from './sales';
import customerRoutes from './customers';
import inventoryRoutes from './inventory';
import reportRoutes from './reports';

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
      auth: `/api${API_PREFIX}/auth`,
      products: `/api${API_PREFIX}/products`,
      sales: `/api${API_PREFIX}/sales`,
      customers: `/api${API_PREFIX}/customers`,
      inventory: `/api${API_PREFIX}/inventory`,
      reports: `/api${API_PREFIX}/reports`,
    },
  });
});

// Route modules
router.use(`/api${API_PREFIX}/auth`, authRoutes);
router.use(`/api${API_PREFIX}/products`, productRoutes);
router.use(`/api${API_PREFIX}/sales`, salesRoutes);
router.use(`/api${API_PREFIX}/customers`, customerRoutes);
router.use(`/api${API_PREFIX}/inventory`, inventoryRoutes);
router.use(`/api${API_PREFIX}/reports`, reportRoutes);

export default router;
