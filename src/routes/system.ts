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
const retiredArtifactEndpoint = (_req: any, res: any) => res.status(410).json({
  success: false,
  code: 'REPOSITORY_ARTIFACT_WORKFLOW_RETIRED',
  message: 'In-process backup/export artifacts are disabled. Use the operator-controlled PostgreSQL backup and audit-export runbooks.',
});

router.post('/backup', retiredArtifactEndpoint);
router.get('/backup/:filename', retiredArtifactEndpoint);
router.post('/export', retiredArtifactEndpoint);
router.get('/export/:filename', retiredArtifactEndpoint);
router.get('/logs', systemController.getSystemLogs);
router.post('/clear-cache', systemController.clearCache);
router.get('/info', systemController.getSystemInfo);

export default router;
