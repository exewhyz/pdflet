import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface WebhookPayload {
  jobId: string;
  pdfUrl: string;
  atsScore: {
    total: number;
    breakdown: {
      skills: number;
      experience: number;
      summary: number;
      structure: number;
    };
  };
}

/**
 * Deliver a webhook POST to the project's configured webhook URL.
 * Retries up to MAX_RETRIES times with exponential back-off.
 */
export async function deliverWebhook(webhookUrl: string, payload: WebhookPayload): Promise<void> {
  if (!webhookUrl) {
    logger.debug('No webhook URL configured — skipping delivery');
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        logger.info('Webhook delivered', { url: webhookUrl, status: res.status });
        return;
      }

      logger.warn('Webhook non-OK response', { url: webhookUrl, status: res.status, attempt });
    } catch (err) {
      logger.warn('Webhook delivery attempt failed', {
        url: webhookUrl,
        attempt,
        error: (err as Error).message,
      });
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }

  logger.error('Webhook delivery exhausted all retries', { url: webhookUrl, payload });
}
