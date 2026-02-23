import type { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AuthenticatedRequest } from '../../middleware/apiKeyAuth.js';
import Job from '../../models/Job.js';
import { inngest } from '../../inngest/client.js';
import { findTemplate } from '../../services/templateService.js';
import logger from '../../utils/logger.js';

/**
 * POST /v1/generate/:templateSlug
 */
export async function generateOne(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const templateSlug = req.params.templateSlug as string;
    const { resumeData, notifyEmail } = req.body as {
      resumeData?: Record<string, unknown>;
      notifyEmail?: string;
    };

    if (!resumeData || typeof resumeData !== 'object') {
      res.status(400).json({ error: '`resumeData` (object) is required in request body.' });
      return;
    }

    await findTemplate(templateSlug!, req.projectId);

    const job = await Job.create({
      projectId: req.projectId,
      templateSlug,
      resumeData,
      notifyEmail: notifyEmail ?? null,
      status: 'pending',
    });

    await inngest.send({
      name: 'pdf/generate',
      data: {
        jobId: job._id.toString(),
        projectId: req.projectId.toString(),
        templateSlug,
        resumeData,
      },
    });

    logger.info('Generate request accepted', { jobId: job._id });

    res.status(202).json({
      message: 'PDF generation started',
      jobId: job._id,
      status: job.status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/bulk-generate/:templateSlug
 */
export async function bulkGenerate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const templateSlug = req.params.templateSlug as string;
    const { items } = req.body as {
      items?: Array<{ resumeData: Record<string, unknown>; notifyEmail?: string }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: '`items` (array of { resumeData }) is required.' });
      return;
    }

    const maxBulk = req.project.usageLimits?.maxBulkSize ?? 10;
    if (items.length > maxBulk) {
      res.status(400).json({
        error: `Bulk limit is ${maxBulk} items. You sent ${items.length}.`,
      });
      return;
    }

    await findTemplate(templateSlug!, req.projectId);

    const bulkJobId = uuidv4();

    await inngest.send({
      name: 'pdf/bulk-generate',
      data: {
        bulkJobId,
        projectId: req.projectId.toString(),
        templateSlug,
        items: items.map((item) => ({
          resumeData: item.resumeData,
          notifyEmail: item.notifyEmail ?? null,
        })),
      },
    });

    logger.info('Bulk generate request accepted', { bulkJobId, count: items.length });

    res.status(202).json({
      message: 'Bulk PDF generation started',
      bulkJobId,
      count: items.length,
    });
  } catch (err) {
    next(err);
  }
}
