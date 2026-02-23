import { inngest } from './client.js';
import Job from '../models/Job.js';
import Project from '../models/Project.js';
import { findTemplate, renderTemplate } from '../services/templateService.js';
import { generatePDF } from '../services/pdfService.js';
import { uploadPDF } from '../services/cloudinaryService.js';
import { computeAtsScore } from '../services/atsService.js';
import { deliverWebhook } from '../services/webhookService.js';
import { sendPdfEmail } from '../services/emailService.js';
import { trackEvent } from '../services/analyticsService.js';
import logger from '../utils/logger.js';

// ─── Type definitions for event data ────────────────────

interface GenerateEventData {
  jobId: string;
  projectId: string;
  templateSlug: string;
  resumeData: Record<string, unknown>;
}

interface BulkGenerateItem {
  resumeData: Record<string, unknown>;
  notifyEmail?: string | null;
}

interface BulkGenerateEventData {
  bulkJobId: string;
  projectId: string;
  templateSlug: string;
  items: BulkGenerateItem[];
}

interface PdfGeneratedEventData {
  jobId: string;
  projectId: string;
  pdfUrl: string;
  atsScore: { total: number; breakdown: Record<string, number> };
  templateSlug: string;
}

interface SendEmailEventData {
  to: string;
  pdfUrl: string;
  name?: string | null;
  projectId: string;
  jobId: string;
}

// ─────────────────────────────────────────────────────────
// 1. pdf/generate — Single PDF generation pipeline
// ─────────────────────────────────────────────────────────
export const generatePdfFn = inngest.createFunction(
  {
    id: 'pdf-generate',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'pdf/generate' },
  async ({ event, step }) => {
    const { jobId, projectId, templateSlug, resumeData } = event.data as GenerateEventData;

    await step.run('mark-processing', async () => {
      await Job.findByIdAndUpdate(jobId, { status: 'processing' });
      logger.info('Job processing started', { jobId });
    });

    const html = await step.run('render-template', async () => {
      const template = await findTemplate(templateSlug, projectId as never);
      return renderTemplate(template, resumeData);
    });

    const pdfBase64 = await step.run('generate-pdf', async () => {
      const buffer = await generatePDF(html);
      return Buffer.from(buffer).toString('base64');
    });

    const uploadResult = await step.run('upload-cloudinary', async () => {
      const buffer = Buffer.from(pdfBase64, 'base64');
      return uploadPDF(buffer, { projectId, jobId });
    });

    const atsScore = await step.run('compute-ats-score', async () => {
      return computeAtsScore(resumeData as never);
    });

    await step.run('mark-completed', async () => {
      await Job.findByIdAndUpdate(jobId, {
        status: 'completed',
        pdfUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
        atsScore,
      });
      await Project.findByIdAndUpdate(projectId, { $inc: { usageCount: 1 } });
      logger.info('Job completed', { jobId, pdfUrl: uploadResult.url });
    });

    await step.sendEvent('fire-pdf-generated', {
      name: 'pdf/generated',
      data: { jobId, projectId, pdfUrl: uploadResult.url, atsScore, templateSlug },
    });

    return { jobId, pdfUrl: uploadResult.url, atsScore };
  },
);

// ─────────────────────────────────────────────────────────
// 2. pdf/bulk-generate — Fan-out individual generate events
// ─────────────────────────────────────────────────────────
export const bulkGenerateFn = inngest.createFunction(
  {
    id: 'pdf-bulk-generate',
    retries: 2,
  },
  { event: 'pdf/bulk-generate' },
  async ({ event, step }) => {
    const { bulkJobId, projectId, templateSlug, items } = event.data as BulkGenerateEventData;

    const events = await step.run('create-jobs', async () => {
      const jobs = await Job.insertMany(
        items.map((item) => ({
          projectId,
          templateSlug,
          resumeData: item.resumeData,
          notifyEmail: item.notifyEmail ?? null,
          bulkJobId,
          status: 'pending' as const,
        })),
      );

      await trackEvent({
        event: 'bulk_job_started',
        projectId,
        meta: { bulkJobId, count: items.length },
      });

      return jobs.map((job) => ({
        name: 'pdf/generate' as const,
        data: {
          jobId: job._id.toString(),
          projectId,
          templateSlug,
          resumeData: job.resumeData,
        },
      }));
    });

    await step.sendEvent('fan-out-generate', events);
    logger.info('Bulk generation fanned out', { bulkJobId, count: items.length });
    return { bulkJobId, count: items.length };
  },
);

// ─────────────────────────────────────────────────────────
// 3. pdf/generated — Post-generation: webhook + analytics
// ─────────────────────────────────────────────────────────
export const onPdfGeneratedFn = inngest.createFunction(
  {
    id: 'pdf-on-generated',
    retries: 2,
  },
  { event: 'pdf/generated' },
  async ({ event, step }) => {
    const { jobId, projectId, pdfUrl, atsScore, templateSlug } =
      event.data as PdfGeneratedEventData;

    await step.run('deliver-webhook', async () => {
      const project = await Project.findById(projectId).lean();
      if (project?.webhookUrl) {
        await deliverWebhook(project.webhookUrl, {
          jobId,
          pdfUrl,
          atsScore: atsScore as never,
        });
        await trackEvent({ event: 'webhook_sent', projectId, jobId });
      }
    });

    await step.run('track-analytics', async () => {
      await trackEvent({
        event: 'pdf_generated',
        projectId,
        jobId,
        templateSlug,
        meta: { atsScore },
      });
      await trackEvent({ event: 'template_used', projectId, templateSlug });
      if (atsScore?.total != null) {
        await trackEvent({ event: 'ats_score_computed', projectId, jobId, meta: atsScore });
      }
    });

    const job = await step.run('check-email', async () => {
      return Job.findById(jobId)
        .select('notifyEmail resumeData')
        .lean<{ notifyEmail?: string; resumeData?: Record<string, unknown> }>();
    });

    if (job?.notifyEmail) {
      await step.sendEvent('trigger-email', {
        name: 'send-email',
        data: {
          to: job.notifyEmail,
          pdfUrl,
          name: (job.resumeData as Record<string, unknown> | undefined)?.name ?? null,
          projectId,
          jobId,
        },
      });
    }
  },
);

// ─────────────────────────────────────────────────────────
// 4. send-email — Event-driven email delivery
// ─────────────────────────────────────────────────────────
export const sendEmailFn = inngest.createFunction(
  {
    id: 'send-email',
    retries: 3,
    concurrency: { limit: 5 },
  },
  { event: 'send-email' },
  async ({ event, step }) => {
    const { to, pdfUrl, name, projectId, jobId } = event.data as SendEmailEventData;

    await step.run('send', async () => {
      await sendPdfEmail({ to, pdfUrl, name });
      await trackEvent({ event: 'email_sent', projectId, jobId, meta: { to } });
      logger.info('Email event completed', { to, jobId });
    });
  },
);

// ── Export all functions for Inngest serve ──────────────
export const allFunctions = [generatePdfFn, bulkGenerateFn, onPdfGeneratedFn, sendEmailFn];
