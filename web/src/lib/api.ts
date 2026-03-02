const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

function getActiveApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rf_active_api_key') || DEFAULT_API_KEY;
  }
  return DEFAULT_API_KEY;
}

function headers(apiKey?: string): HeadersInit {
  const key = apiKey || getActiveApiKey();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (key) h['x-api-key'] = key;
  return h;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

/* ── Generate ──────────────────────────────────────── */

export interface GenerateResult {
  message: string;
  jobId: string;
  status: string;
}

export function generatePdf(
  templateSlug: string,
  resumeData: Record<string, unknown>,
  notifyEmail?: string,
  apiKey?: string,
) {
  return request<GenerateResult>(`/v1/generate/${templateSlug}`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ resumeData, notifyEmail: notifyEmail || undefined }),
  });
}

/* ── Jobs ──────────────────────────────────────────── */

export interface AtsBreakdown {
  skills: number;
  experience: number;
  summary: number;
  structure: number;
}

export interface AtsScore {
  total: number;
  breakdown: AtsBreakdown;
}

export interface Job {
  jobId: string;
  _id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl: string | null;
  atsScore: AtsScore | null;
  templateSlug: string;
  bulkJobId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export function getJob(jobId: string, apiKey?: string) {
  return request<Job>(`/v1/job/${jobId}`, { headers: headers(apiKey) });
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export function listJobs(page = 1, limit = 20, apiKey?: string) {
  return request<JobListResponse>(`/v1/jobs?page=${page}&limit=${limit}`, {
    headers: headers(apiKey),
  });
}

/* ── Templates ─────────────────────────────────────── */

export interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  previewImageUrl?: string;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}

export function getTemplates(page = 1, limit = 20, category?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) params.set('category', category);
  return request<TemplateListResponse>(`/v1/marketplace/templates?${params}`);
}

export interface CreateTemplatePayload {
  name: string;
  slug: string;
  html: string;
  description?: string;
  css?: string;
  isPublic?: boolean;
  category?: string;
  tags?: string[];
}

export function createTemplateApi(payload: CreateTemplatePayload, apiKey?: string) {
  return request<Template>('/v1/templates', {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(payload),
  });
}

/* ── Project / Organisation ───────────────────────── */

export interface ProjectApiKey {
  id: string;
  label: string;
  key: string; // masked on list, full on create
  isActive: boolean;
  createdAt: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  usageCount: number;
  usageLimits: {
    maxPdfsPerMonth: number;
    maxBulkSize: number;
  };
  webhookUrl: string | null;
  apiKeys: ProjectApiKey[];
  stats: {
    totalJobs: number;
    completedJobs: number;
  };
  createdAt: string;
}

/** GET /v1/project — authenticated (requires API key) */
export function getProject(apiKey?: string) {
  return request<ProjectInfo>('/v1/project', { headers: headers(apiKey) });
}

/** PUT /v1/project — update authenticated project */
export function updateProject(data: { name?: string; webhookUrl?: string }, apiKey?: string) {
  return request<{ id: string; name: string; webhookUrl: string | null }>(
    '/v1/project',
    { method: 'PUT', headers: headers(apiKey), body: JSON.stringify(data) },
  );
}

/** DELETE /v1/project — soft-delete authenticated project */
export function deleteProjectApi(apiKey?: string) {
  return request<{ message: string }>('/v1/project', {
    method: 'DELETE',
    headers: headers(apiKey),
  });
}

/* ── Projects (admin / list) ──────────────────────── */

export interface ProjectListItem {
  id: string;
  name: string;
  plan: string;
  usageCount: number;
  usageLimits: { maxPdfsPerMonth: number; maxBulkSize: number };
  webhookUrl: string | null;
  apiKeyCount: number;
  apiKey: string | null; // full key for switching
  apiKeyMasked: string | null; // masked key for display
  stats: { totalJobs: number; completedJobs: number };
  createdAt: string;
}

/** GET /v1/projects — list all projects (no API key required) */
export function listProjects() {
  return request<{ projects: ProjectListItem[]; total: number }>('/v1/projects', {
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface CreateProjectResult {
  id: string;
  name: string;
  plan: string;
  apiKey: { id: string; key: string; label: string };
  createdAt: string;
}

/** POST /v1/projects — create a new project (no API key required) */
export function createProjectApi(name: string, plan?: string) {
  return request<CreateProjectResult>('/v1/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, plan }),
  });
}

/* ── Active project helpers ───────────────────────── */

export function setActiveApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rf_active_api_key', key);
    window.dispatchEvent(new Event('rf_project_changed'));
  }
}

export function clearActiveApiKey() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('rf_active_api_key');
    window.dispatchEvent(new Event('rf_project_changed'));
  }
}

/**
 * Ensures an API key is set in localStorage.
 * On first visit, auto-selects the first available project's API key.
 * Returns true if a key was already set or successfully auto-selected.
 */
export async function ensureActiveApiKey(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const existing = localStorage.getItem('rf_active_api_key') || DEFAULT_API_KEY;
  if (existing) {
    if (!localStorage.getItem('rf_active_api_key') && DEFAULT_API_KEY) {
      localStorage.setItem('rf_active_api_key', DEFAULT_API_KEY);
    }
    return true;
  }

  try {
    const { projects } = await listProjects();
    const firstKey = projects?.[0]?.apiKey;
    if (firstKey) {
      setActiveApiKey(firstKey);
      return true;
    }
  } catch {
    // If listing fails, we can't auto-select
  }

  return false;
}

