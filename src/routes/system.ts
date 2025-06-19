import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { systemController } from '../controllers/systemController';

const router = Router();

// All system routes require authentication and admin role
router.use(authenticateToken);

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.use(requireAdmin);

// System management routes
router.post('/backup', systemController.backupDatabase);
router.get('/backup/:filename', systemController.downloadBackup);
router.post('/export', systemController.exportData);
router.get('/export/:filename', systemController.downloadExport);
router.get('/logs', systemController.getSystemLogs);
router.post('/clear-cache', systemController.clearCache);
router.get('/info', systemController.getSystemInfo);

export default router;
