import type { Types } from 'mongoose';
import Analytics from '../models/Analytics.js';
import type { AnalyticsEvent } from '../models/Analytics.js';
import logger from '../utils/logger.js';

export interface TrackEventParams {
  event: AnalyticsEvent;
  projectId: Types.ObjectId | string;
  jobId?: Types.ObjectId | string | null;
  templateSlug?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Log an analytics event (fire-and-forget safe).
 */
export async function trackEvent({
  event,
  projectId,
  jobId,
  templateSlug,
  meta,
}: TrackEventParams): Promise<void> {
  try {
    await Analytics.create({ event, projectId, jobId, templateSlug, meta });
    logger.debug('Analytics event tracked', { event, projectId });
  } catch (err) {
    logger.error('Analytics tracking failed', { event, error: (err as Error).message });
  }
}

export interface QueryEventsFilter {
  event?: AnalyticsEvent;
  from?: Date;
  to?: Date;
  limit?: number;
}

/**
 * Query analytics for a project.
 */
export async function queryEvents(
  projectId: Types.ObjectId | string,
  { event, from, to, limit = 100 }: QueryEventsFilter = {},
) {
  const query: Record<string, unknown> = { projectId };
  if (event) query.event = event;

  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = from;
    if (to) createdAt.$lte = to;
    query.createdAt = createdAt;
  }

  return Analytics.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}
