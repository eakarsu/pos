import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { settingsController } from '../controllers/settingsController';

const router = Router();

// All settings routes require authentication
router.use(authenticateToken);

// Get all settings
router.get('/', settingsController.getAllSettings);

// Get settings by category
router.get('/:category', settingsController.getSettingsByCategory);

// Get single setting by key
router.get('/key/:key', settingsController.getSettingByKey);

// Update settings by category
router.put('/:category', settingsController.updateSettingsByCategory);

// Update single setting by key
router.put('/key/:key', settingsController.updateSettingByKey);

// Create new setting
router.post('/', settingsController.createSetting);

// Delete setting
router.delete('/key/:key', settingsController.deleteSetting);

export default router;
