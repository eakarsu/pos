import { Router } from 'express';
import dynamicPricingRouter from './ai/dynamicPricing';
import loyaltyRouter from './ai/loyalty';
import paymentsRouter from './payments';
import multiLocationRouter from './multiLocation';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/aiRateLimiter';

/**
 * Bundled router for Custom Feature Suggestions (batch 11):
 *   POST /v1/ai/dynamic-pricing
 *   POST /v1/ai/loyalty/tier
 *   POST /v1/ai/loyalty/auto-discount
 *   POST /v1/payments/intent | /confirm | /receipt
 *   POST /v1/multi-location/...
 */
const router = Router();

router.use('/v1/ai/dynamic-pricing', authenticate, aiRateLimiter, dynamicPricingRouter);
router.use('/v1/ai/loyalty', authenticate, aiRateLimiter, loyaltyRouter);
router.use('/v1/payments', paymentsRouter);
router.use('/v1/multi-location', multiLocationRouter);

export default router;
