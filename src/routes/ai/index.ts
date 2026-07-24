import { Router } from 'express';
import insightsRouter from './insights';
import inventoryRouter from './inventory';
import customersRouter from './customers';
import copilotRouter from './copilot';
import reorderRouter from './reorder';
import elasticityRouter from './elasticity';
import fraudRouter from './fraud';
import resultsRouter from './results';
import upsellRouter from './upsell';
import operationsReviewRouter from './operationsReview';
import { authenticateToken } from '../../middleware/auth';
import { aiRateLimiter } from '../../middleware/aiRateLimiter';

const router = Router();

// Apply auth then per-user AI rate limiter (20/hr) to all AI endpoints.
router.use(authenticateToken);
router.use(aiRateLimiter);

router.use('/insights', insightsRouter);
router.use('/inventory', inventoryRouter);
router.use('/customers', customersRouter);
router.use('/copilot', copilotRouter);
router.use('/reorder', reorderRouter);
router.use('/elasticity', elasticityRouter);
router.use('/fraud', fraudRouter);
router.use('/results', resultsRouter);
router.use('/upsell', upsellRouter);
router.use('/operations-review', operationsReviewRouter);

export default router;
