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

// Apply auth to every endpoint. Reading a saved report does not consume a
// generation allowance; history loads several feature collections at once.
router.use(authenticateToken);
router.use((req, res, next) => req.method === 'GET' ? next() : aiRateLimiter(req, res, next));

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
