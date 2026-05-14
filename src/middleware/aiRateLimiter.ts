import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

/**
 * AI rate limiter — 20 requests per hour, keyed by authenticated user ID
 * (falls back to IP if no user is present).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const u = (req as AuthRequest).user;
    if (u && u.id) return `user:${u.id}`;
    return `ip:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded:', {
      user: (req as AuthRequest).user?.id,
      ip: req.ip,
      url: req.url,
    });
    res.status(429).json({
      success: false,
      message: 'Too many AI requests. Limit is 20 per hour. Please try again later.',
    });
  },
  message: {
    success: false,
    message: 'Too many AI requests. Limit is 20 per hour. Please try again later.',
  },
});
