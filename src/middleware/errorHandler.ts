import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Centralised Express error handler.
 * Must be registered AFTER all routes.
 */
export default function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.statusCode ?? err.status ?? 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  logger.error('Unhandled error', {
    status,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(status).json({ error: message });
}
