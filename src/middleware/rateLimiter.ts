import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Rate limiter keyed by API key (or IP as fallback).
 * Limits each key to 60 requests per minute by default.
 */
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req: Request): string {
    return (req.headers['x-api-key'] as string) || req.ip || 'unknown';
  },
  handler(_req: Request, res: Response): void {
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
    });
  },
});

export default rateLimiter;
