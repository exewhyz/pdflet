# @exwhyzed/pdflet

Official SDK for the **ResumeForge** PDF Generation API. Generate resumes, check ATS scores, and manage templates — production-ready with retries, timeouts, and TypeScript support.

[![npm](https://img.shields.io/npm/v/@exwhyzed/pdflet)](https://www.npmjs.com/package/@exwhyzed/pdflet)
[![license](https://img.shields.io/npm/l/@exwhyzed/pdflet)](./LICENSE)

## Installation

```bash
npm install @exwhyzed/pdflet
```

## Quick Start

```ts
import { createClient } from '@exwhyzed/pdflet';

const client = createClient({
  apiKey: 'pk_your_api_key_here',
  baseUrl: 'https://api.resumeforge.dev',
});

// Generate a resume PDF
const { jobId } = await client.generatePDF('default-resume', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555-0123',
  skills: ['TypeScript', 'React', 'Node.js'],
  experience: [{
    title: 'Senior Engineer',
    company: 'Acme Corp',
    startDate: '2021-01',
    endDate: null,
    bullets: ['Led team of 5 engineers'],
  }],
});

// Wait for completion (polls automatically)
const job = await client.waitForJob(jobId);
console.log(job.pdfUrl);   // → https://res.cloudinary.com/.../resume.pdf
console.log(job.atsScore); // → { total: 82, breakdown: { ... } }
```

## Configuration

```ts
const client = createClient({
  // Required
  apiKey: 'pk_abc123...',

  // Optional
  baseUrl: 'http://localhost:4000',  // API URL (default)
  timeout: 30_000,                   // Request timeout in ms (default: 30s)
  debug: true,                       // Enable console logging

  // Retry configuration (default: enabled)
  retry: {
    maxRetries: 3,                   // Number of retries (default: 3)
    baseDelay: 1000,                 // Base delay in ms (default: 1s)
    maxDelay: 30_000,                // Max delay cap (default: 30s)
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },

  // Or disable retries entirely
  // retry: false,

  // Custom logger
  logger: (level, message, meta) => {
    myLogger[level](message, meta);
  },

  // Custom fetch (for Node < 18)
  // fetch: customFetch,
});
```

## API Reference

### `client.generatePDF(templateSlug, resumeData, options?)`

Generate a single resume PDF.

```ts
const { jobId, status } = await client.generatePDF('default-resume', {
  name: 'John Doe',
  email: 'john@example.com',
}, { notifyEmail: 'notify@example.com' });
```

### `client.waitForJob(jobId, options?)`

Poll a job until `completed` or `failed`.

```ts
const job = await client.waitForJob(jobId, {
  interval: 2000,   // poll every 2s (default)
  timeout: 120_000, // give up after 2min (default)
  onPoll: (job, elapsed) => {
    console.log(`${job.status} — ${elapsed}ms elapsed`);
  },
});
```

### `client.getJob(jobId)`

Get current job status without polling.

```ts
const job = await client.getJob('abc123');
// job.status → 'pending' | 'processing' | 'completed' | 'failed'
```

### `client.bulkGenerate(templateSlug, items)`

Generate multiple PDFs in one request.

```ts
const { bulkJobId, count } = await client.bulkGenerate('default-resume', [
  { resumeData: { name: 'Alice' } },
  { resumeData: { name: 'Bob' }, notifyEmail: 'bob@example.com' },
]);
```

### `client.getBulkJobs(bulkJobId)`

Check bulk job progress.

```ts
const bulk = await client.getBulkJobs(bulkJobId);
console.log(bulk.summary); // { total: 10, completed: 8, failed: 0, pending: 2 }
```

### `client.listTemplates(params?)`

Browse available templates.

```ts
const { templates } = await client.listTemplates({ page: 1, limit: 20, category: 'professional' });
```

### `client.createTemplate(input)`

Create a custom template.

```ts
await client.createTemplate({
  name: 'My Resume',
  slug: 'my-resume',
  html: '<h1>{{name}}</h1>',
  css: 'h1 { color: navy; }',
});
```

## Error Handling

The SDK provides typed error classes for precise error handling:

```ts
import { createClient, PdfletError, TimeoutError, RateLimitError, ValidationError } from '@exwhyzed/pdflet';

try {
  await client.generatePDF('', {});
} catch (err) {
  if (err instanceof ValidationError) {
    // Client-side validation failed (e.g. missing templateSlug)
    console.error(err.message);
  } else if (err instanceof RateLimitError) {
    // 429 — retry after err.retryAfter seconds
    console.error(`Rate limited. Retry in ${err.retryAfter}s`);
  } else if (err instanceof TimeoutError) {
    // Request or polling timed out
    console.error(`Timed out: ${err.message}`);
  } else if (err instanceof PdfletError) {
    // Any other API error
    console.error(err.status, err.message, err.body);
  }
}
```

| Error Class | Code | When |
|-------------|------|------|
| `PdfletError` | `PDFLET_ERROR` | Base class for all API errors |
| `TimeoutError` | `PDFLET_TIMEOUT` | Request or polling timeout |
| `RateLimitError` | `PDFLET_RATE_LIMIT` | HTTP 429 rate limiting |
| `ValidationError` | `PDFLET_VALIDATION` | Client-side input validation |

## Production Features

- ✅ **Retry with exponential backoff** — configurable retries with jitter
- ✅ **Request timeouts** — via `AbortController` (default: 30s)
- ✅ **Rate-limit awareness** — respects `Retry-After` header
- ✅ **Input validation** — catches errors before making network calls
- ✅ **Debug logging** — opt-in via `debug: true` or custom `logger`
- ✅ **Typed errors** — `PdfletError`, `TimeoutError`, `RateLimitError`, `ValidationError`
- ✅ **Dual CJS/ESM** — works everywhere
- ✅ **Full TypeScript** — complete type declarations
- ✅ **Zero dependencies** — only uses native `fetch`
- ✅ **Tree-shakeable** — `sideEffects: false`

## Requirements

- **Node.js 18+** (uses native `fetch` and `AbortController`)
- Or pass a custom `fetch` for older runtimes

## License

[MIT](./LICENSE)
