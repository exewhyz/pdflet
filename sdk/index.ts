/**
 * PDF Template SaaS — JavaScript/TypeScript SDK
 *
 * Usage:
 *   import { createClient } from '@pdf-template/sdk';
 *   const client = createClient({ apiKey: 'pk_abc123...', baseUrl: 'https://api.yourservice.com' });
 *   const { jobId } = await client.generatePDF('default-resume', resumeData);
 */

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
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

export interface JobResult {
  jobId: string;
  status: string;
  pdfUrl: string | null;
  atsScore: {
    total: number | null;
    breakdown: {
      skills: number | null;
      experience: number | null;
      summary: number | null;
      structure: number | null;
    };
  };
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

export interface TemplateListResult {
  templates: Array<{
    _id: string;
    name: string;
    slug: string;
    description: string;
    isPublic: boolean;
    category: string;
    tags: string[];
    previewImageUrl: string | null;
  }>;
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

export interface PdfTemplateClient {
  generatePDF(
    templateSlug: string,
    resumeData: Record<string, unknown>,
    options?: { notifyEmail?: string },
  ): Promise<GenerateResult>;

  bulkGenerate(templateSlug: string, items: BulkItem[]): Promise<BulkGenerateResult>;

  getJob(jobId: string): Promise<JobResult>;

  getBulkJobs(bulkJobId: string): Promise<BulkJobsResult>;

  listTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<TemplateListResult>;

  createTemplate(template: CreateTemplateInput): Promise<Record<string, unknown>>;
}

/**
 * Create an API client instance.
 */
export function createClient({ apiKey, baseUrl = 'http://localhost:4000' }: ClientConfig): PdfTemplateClient {
  if (!apiKey) throw new Error('apiKey is required');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await res.json()) as T & { error?: string };

    if (!res.ok) {
      const err = new Error(data.error ?? `HTTP ${res.status}`) as Error & {
        status: number;
        body: unknown;
      };
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data;
  }

  return {
    async generatePDF(templateSlug, resumeData, options = {}) {
      return request<GenerateResult>('POST', `/v1/generate/${templateSlug}`, {
        resumeData,
        notifyEmail: options.notifyEmail,
      });
    },

    async bulkGenerate(templateSlug, items) {
      return request<BulkGenerateResult>('POST', `/v1/bulk-generate/${templateSlug}`, { items });
    },

    async getJob(jobId) {
      return request<JobResult>('GET', `/v1/job/${jobId}`);
    },

    async getBulkJobs(bulkJobId) {
      return request<BulkJobsResult>('GET', `/v1/jobs/bulk/${bulkJobId}`);
    },

    async listTemplates({ page, limit, category } = {}) {
      const qs = new URLSearchParams();
      if (page) qs.set('page', String(page));
      if (limit) qs.set('limit', String(limit));
      if (category) qs.set('category', category);
      const query = qs.toString() ? `?${qs}` : '';
      return request<TemplateListResult>('GET', `/v1/marketplace/templates${query}`);
    },

    async createTemplate(template) {
      return request<Record<string, unknown>>('POST', '/v1/templates', template);
    },
  };
}

export default createClient;
