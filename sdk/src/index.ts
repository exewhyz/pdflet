/**
 * @exwhyzed/pdflet — Production-grade SDK for the ResumeForge PDF Generation API
 *
 * @example
 * ```ts
 * import { createClient } from '@exwhyzed/pdflet';
 *
 * const client = createClient({
 *   apiKey: 'pk_abc123...',
 *   baseUrl: 'https://api.yourservice.com',
 * });
 *
 * const { jobId } = await client.generatePDF('default-resume', resumeData);
 * const job = await client.waitForJob(jobId);
 * console.log(job.pdfUrl, job.atsScore);
 * ```
 *
 * @packageDocumentation
 */

// ─── Error Classes ────────────────────────────────────

/**
 * Base error class for all SDK errors.
 */
export class PdfletError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly code: string;

  constructor(message: string, status: number, body: unknown, code = 'PDFLET_ERROR') {
    super(message);
    this.name = 'PdfletError';
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

/**
 * Thrown when a request times out.
 */
export class TimeoutError extends PdfletError {
  constructor(message: string, timeoutMs: number) {
    super(message, 408, { timeoutMs }, 'PDFLET_TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when the API rate limit is exceeded.
 */
export class RateLimitError extends PdfletError {
  /** Seconds to wait before retrying. */
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, body: unknown) {
    super(message, 429, body, 'PDFLET_RATE_LIMIT');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when input validation fails (client-side).
 */
export class ValidationError extends PdfletError {
  constructor(message: string) {
    super(message, 400, null, 'PDFLET_VALIDATION');
    this.name = 'ValidationError';
  }
}

// ─── Types ────────────────────────────────────────────

export interface RetryConfig {
  /** Max number of retries. Default: `3` */
  maxRetries?: number;
  /** Base delay in ms (exponentially increased). Default: `1000` */
  baseDelay?: number;
  /** Max delay cap in ms. Default: `30000` */
  maxDelay?: number;
  /** HTTP status codes to retry on. Default: `[408, 429, 500, 502, 503, 504]` */
  retryableStatuses?: number[];
}

export interface ClientConfig {
  /** Your project API key (starts with `pk_`) */
  apiKey: string;
  /** API base URL. Default: `http://localhost:4000` */
  baseUrl?: string;
  /** Request timeout in ms. Default: `30000` (30s) */
  timeout?: number;
  /** Custom fetch implementation (for Node < 18 polyfills). */
  fetch?: typeof globalThis.fetch;
  /** Retry configuration. Set to `false` to disable retries. */
  retry?: RetryConfig | false;
  /** Enable debug logging to console. Default: `false` */
  debug?: boolean;
  /** Custom logger function. Overrides `debug` flag. */
  logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>,
  ) => void;
}

export interface GenerateResult {
  message: string;
  jobId: string;
  status: string;
}

export interface BulkGenerateResult {
  message: string;
  bulkJobId: string;
  count: number;
}

export interface BulkItem {
  resumeData: Record<string, unknown>;
  notifyEmail?: string;
}

export interface AtsBreakdown {
  skills: number | null;
  experience: number | null;
  summary: number | null;
  structure: number | null;
}

export interface AtsScore {
  total: number | null;
  breakdown: AtsBreakdown;
}

export interface JobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl: string | null;
  atsScore: AtsScore | null;
  templateSlug: string;
  bulkJobId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BulkJobsResult {
  bulkJobId: string;
  summary: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  jobs: JobResult[];
}

export interface TemplateInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isPublic: boolean;
  category: string;
  tags: string[];
  previewImageUrl: string | null;
}

export interface TemplateListResult {
  templates: TemplateInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTemplateInput {
  name: string;
  slug: string;
  html: string;
  css?: string;
  description?: string;
  isPublic?: boolean;
  category?: string;
  tags?: string[];
}

export interface WaitOptions {
  /** Polling interval in ms. Default: `2000` */
  interval?: number;
  /** Max wait time in ms. Default: `120000` (2 minutes) */
  timeout?: number;
  /** Called after each poll with the current job state. */
  onPoll?: (job: JobResult, elapsedMs: number) => void;
}

export interface ListTemplatesParams {
  page?: number;
  limit?: number;
  category?: string;
}

// ─── Client Interface ─────────────────────────────────

export interface PdfletClient {
  /** Generate a single PDF from a template and resume data. */
  generatePDF(
    templateSlug: string,
    resumeData: Record<string, unknown>,
    options?: { notifyEmail?: string },
  ): Promise<GenerateResult>;

  /** Generate multiple PDFs in a single batch. */
  bulkGenerate(templateSlug: string, items: BulkItem[]): Promise<BulkGenerateResult>;

  /** Get the current status of a job. */
  getJob(jobId: string): Promise<JobResult>;

  /** Poll a job until it reaches `completed` or `failed` status. */
  waitForJob(jobId: string, options?: WaitOptions): Promise<JobResult>;

  /** Get bulk job status and individual job results. */
  getBulkJobs(bulkJobId: string): Promise<BulkJobsResult>;

  /** List available templates from the marketplace. */
  listTemplates(params?: ListTemplatesParams): Promise<TemplateListResult>;

  /** Create a new template. */
  createTemplate(template: CreateTemplateInput): Promise<Record<string, unknown>>;
}

// ─── Internal Helpers ─────────────────────────────────

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

type LogFn = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  meta?: Record<string, unknown>,
) => void;

function createLogger(config: ClientConfig): LogFn {
  if (config.logger) return config.logger;
  if (!config.debug) return () => {};
  return (level, message, meta) => {
    const prefix = `[pdflet:${level}]`;
    if (meta) {
      console.log(prefix, message, JSON.stringify(meta, null, 2));
    } else {
      console.log(prefix, message);
    }
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addJitter(delay: number): number {
  return delay + Math.random() * delay * 0.2;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new ValidationError(message);
}

// ─── Client Factory ───────────────────────────────────

/**
 * Create a production-ready Pdflet API client.
 *
 * @param config — Client configuration
 * @returns A fully-typed API client instance
 *
 * @example
 * ```ts
 * const client = createClient({
 *   apiKey: 'pk_abc123...',
 *   baseUrl: 'https://api.resumeforge.dev',
 *   timeout: 15_000,
 *   retry: { maxRetries: 3 },
 *   debug: true,
 * });
 * ```
 */
export function createClient(config: ClientConfig): PdfletClient {
  // ── Validate config ──
  assert(!!config, 'Config object is required');
  assert(typeof config.apiKey === 'string' && config.apiKey.length > 0, 'apiKey is required');

  const { apiKey, baseUrl = 'http://localhost:4000', timeout = 30_000 } = config;

  const fetchFn = config.fetch ?? globalThis.fetch;
  assert(
    typeof fetchFn === 'function',
    'fetch is not available. Use Node >= 18 or pass a custom fetch.',
  );

  const retryConfig: Required<RetryConfig> | false =
    config.retry === false ? false : { ...DEFAULT_RETRY, ...(config.retry ?? {}) };

  const log = createLogger(config);

  log('info', 'Client initialized', {
    baseUrl,
    timeout,
    retry: retryConfig !== false,
    maxRetries: retryConfig !== false ? retryConfig.maxRetries : 0,
  });

  // ── Core request with retry + timeout ──

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const maxAttempts = retryConfig !== false ? retryConfig.maxRetries + 1 : 1;
    let lastError: PdfletError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isRetry = attempt > 1;

      if (isRetry) {
        const delay =
          retryConfig !== false
            ? Math.min(retryConfig.baseDelay * Math.pow(2, attempt - 2), retryConfig.maxDelay)
            : 0;
        const jitteredDelay = Math.round(addJitter(delay));

        log('warn', `Retry ${attempt - 1}/${retryConfig !== false ? retryConfig.maxRetries : 0}`, {
          method,
          path,
          delayMs: jitteredDelay,
          lastStatus: lastError?.status,
        });

        await sleep(jitteredDelay);
      }

      try {
        log('debug', `${method} ${path}`, { attempt, body: body ? '...' : undefined });

        // Build fetch with timeout via AbortController
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        let res: Response;
        try {
          res = await fetchFn(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            throw new TimeoutError(
              `Request timed out after ${timeout}ms: ${method} ${path}`,
              timeout,
            );
          }
          throw err;
        } finally {
          clearTimeout(timer);
        }

        // Handle rate limiting
        if (res.status === 429) {
          const retryAfterHeader = res.headers.get('retry-after');
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
          const errorBody = await res.json().catch(() => ({}));

          const rateLimitErr = new RateLimitError(
            `Rate limit exceeded. Retry after ${retryAfter}s`,
            retryAfter,
            errorBody,
          );

          // If retries are enabled and we haven't exhausted attempts, retry with rate-limit delay
          if (retryConfig !== false && attempt < maxAttempts) {
            lastError = rateLimitErr;
            await sleep(retryAfter * 1000);
            continue;
          }

          throw rateLimitErr;
        }

        const data = (await res.json()) as T & { error?: string };

        if (!res.ok) {
          const error = new PdfletError(data.error ?? `HTTP ${res.status}`, res.status, data);

          // Retry on retryable status codes
          if (
            retryConfig !== false &&
            retryConfig.retryableStatuses.includes(res.status) &&
            attempt < maxAttempts
          ) {
            lastError = error;
            continue;
          }

          throw error;
        }

        log('debug', `${method} ${path} → ${res.status}`, { attempt });
        return data;
      } catch (err) {
        // Don't retry on validation, timeout, or client errors
        if (err instanceof ValidationError || err instanceof TimeoutError) {
          throw err;
        }

        // Network errors — retry if possible
        if (!(err instanceof PdfletError) && retryConfig !== false && attempt < maxAttempts) {
          lastError = new PdfletError(
            (err as Error).message || 'Network error',
            0,
            null,
            'PDFLET_NETWORK',
          );
          continue;
        }

        throw err;
      }
    }

    // Should never reach here, but just in case
    throw lastError ?? new PdfletError('Request failed after all retries', 0, null);
  }

  // ── Public API ──

  return {
    async generatePDF(templateSlug, resumeData, options = {}) {
      assert(
        typeof templateSlug === 'string' && templateSlug.length > 0,
        'templateSlug is required',
      );
      assert(
        typeof resumeData === 'object' && resumeData !== null,
        'resumeData must be a non-null object',
      );

      log('info', `Generating PDF with template "${templateSlug}"`);
      return request<GenerateResult>('POST', `/v1/generate/${encodeURIComponent(templateSlug)}`, {
        resumeData,
        notifyEmail: options.notifyEmail,
      });
    },

    async bulkGenerate(templateSlug, items) {
      assert(
        typeof templateSlug === 'string' && templateSlug.length > 0,
        'templateSlug is required',
      );
      assert(Array.isArray(items) && items.length > 0, 'items must be a non-empty array');

      log('info', `Bulk generating ${items.length} PDFs with template "${templateSlug}"`);
      return request<BulkGenerateResult>(
        'POST',
        `/v1/bulk-generate/${encodeURIComponent(templateSlug)}`,
        { items },
      );
    },

    async getJob(jobId) {
      assert(typeof jobId === 'string' && jobId.length > 0, 'jobId is required');
      return request<JobResult>('GET', `/v1/job/${encodeURIComponent(jobId)}`);
    },

    async waitForJob(jobId, options = {}) {
      assert(typeof jobId === 'string' && jobId.length > 0, 'jobId is required');

      const { interval = 2000, timeout: waitTimeout = 120_000, onPoll } = options;
      const start = Date.now();

      log('info', `Waiting for job ${jobId}`, { interval, timeout: waitTimeout });

      let pollCount = 0;
      while (true) {
        const elapsed = Date.now() - start;
        const job = await this.getJob(jobId);
        pollCount++;

        if (onPoll) onPoll(job, elapsed);

        log('debug', `Poll #${pollCount}: ${job.status}`, { elapsed, jobId });

        if (job.status === 'completed' || job.status === 'failed') {
          log('info', `Job ${jobId} finished: ${job.status}`, { elapsed, pollCount });
          return job;
        }

        if (elapsed >= waitTimeout) {
          throw new TimeoutError(
            `Job ${jobId} timed out after ${waitTimeout}ms (status: ${job.status}, polls: ${pollCount})`,
            waitTimeout,
          );
        }

        await sleep(interval);
      }
    },

    async getBulkJobs(bulkJobId) {
      assert(typeof bulkJobId === 'string' && bulkJobId.length > 0, 'bulkJobId is required');
      return request<BulkJobsResult>('GET', `/v1/jobs/bulk/${encodeURIComponent(bulkJobId)}`);
    },

    async listTemplates({ page, limit, category } = {}) {
      const qs = new URLSearchParams();
      if (page != null) qs.set('page', String(page));
      if (limit != null) qs.set('limit', String(limit));
      if (category) qs.set('category', category);
      const query = qs.toString() ? `?${qs}` : '';
      return request<TemplateListResult>('GET', `/v1/marketplace/templates${query}`);
    },

    async createTemplate(template) {
      assert(typeof template === 'object' && template !== null, 'template is required');
      assert(
        typeof template.name === 'string' && template.name.length > 0,
        'template.name is required',
      );
      assert(
        typeof template.slug === 'string' && template.slug.length > 0,
        'template.slug is required',
      );
      assert(
        typeof template.html === 'string' && template.html.length > 0,
        'template.html is required',
      );

      log('info', `Creating template "${template.slug}"`);
      return request<Record<string, unknown>>('POST', '/v1/templates', template);
    },
  };
}

export default createClient;
