import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/apiKeyAuth.js';
import Job from '../../models/Job.js';

/**
 * GET /v1/job/:id
 */
export async function getJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      projectId: req.projectId,
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    res.json({
      jobId: job._id,
      status: job.status,
      pdfUrl: job.pdfUrl,
      atsScore: job.atsScore,
      templateSlug: job.templateSlug,
      bulkJobId: job.bulkJobId,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/jobs/bulk/:bulkJobId
 */
export async function getBulkJobs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobs = await Job.find({
      bulkJobId: req.params.bulkJobId,
      projectId: req.projectId,
    })
      .select('status pdfUrl atsScore templateSlug error createdAt updatedAt')
      .lean();

    const summary = {
      total: jobs.length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      pending: jobs.filter((j) => j.status === 'pending' || j.status === 'processing').length,
    };

    res.json({ bulkJobId: req.params.bulkJobId, summary, jobs });
  } catch (err) {
    next(err);
  }
}
