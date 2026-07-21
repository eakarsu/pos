import { Router } from 'express';
import dynamicPricingRouter from './ai/dynamicPricing';
import loyaltyRouter from './ai/loyalty';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/aiRateLimiter';

/**
 * Bundled router for Custom Feature Suggestions (batch 11):
 *   POST /v1/ai/dynamic-pricing
 *   POST /v1/ai/loyalty/tier
 *   POST /v1/ai/loyalty/auto-discount
 * Financial and location operations intentionally use the durable operations router.
 */
const router = Router();

router.use('/v1/ai/dynamic-pricing', authenticate, aiRateLimiter, dynamicPricingRouter);
router.use('/v1/ai/loyalty', authenticate, aiRateLimiter, loyaltyRouter);

export default router;
