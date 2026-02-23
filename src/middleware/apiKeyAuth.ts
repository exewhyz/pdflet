import type { Request, Response, NextFunction } from 'express';
import Project, { type IProject } from '../models/Project.js';
import logger from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  project: IProject;
  projectId: IProject['_id'];
}

/**
 * Middleware: Authenticate requests via `x-api-key` header.
 * Resolves the owning Project and attaches it to `req`.
 */
export default async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      res.status(401).json({
        error: 'Missing API key. Provide it via the x-api-key header.',
      });
      return;
    }

    const project = await Project.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true,
      isActive: true,
    });

    if (!project) {
      res.status(401).json({ error: 'Invalid or revoked API key.' });
      return;
    }

    (req as AuthenticatedRequest).project = project;
    (req as AuthenticatedRequest).projectId = project._id;
    next();
  } catch (err) {
    logger.error('API key auth error', { error: (err as Error).message });
    next(err);
  }
}
