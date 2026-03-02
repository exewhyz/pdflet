# ResumeForge

A production-ready **multi-tenant PDF resume generation SaaS** with ATS scoring, async job processing, a Next.js dashboard, and a published TypeScript SDK.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│  Express API │────▶│   MongoDB    │
│  Dashboard   │     │  (Port 4000) │     │              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │   Inngest    │
                     │ (Async Jobs) │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Puppeteer │ │Cloudinary│ │  Email   │
        │(PDF Gen) │ │(Storage) │ │ (SMTP)  │
        └──────────┘ └──────────┘ └──────────┘
```

## Features

- **Multi-tenant** — project-based isolation with API keys
- **PDF Generation** — Handlebars templates → Puppeteer → PDF
- **ATS Scoring** — automated resume quality scoring (skills, experience, summary, structure)
- **Async Processing** — Inngest-powered background jobs with status tracking
- **Bulk Generation** — batch generate hundreds of PDFs in one request
- **Resilient Storage** — Cloudinary with automatic local fallback
- **Email Notifications** — SMTP notifications when PDFs are ready
- **Webhooks** — POST notifications on job completion
- **Dashboard** — full Next.js admin UI with org switching, filtering, search
- **SDK** — published TypeScript SDK (`@exwhyzed/pdflet`) with retries, timeouts, and typed errors
- **Docker-ready** — multi-stage Dockerfile included

## Quick Start

### Prerequisites

- **Node.js 20+**
- **MongoDB** (local or Atlas)
- **Inngest CLI** (for async job processing)

### 1. Clone & Install

```bash
git clone https://github.com/exwhyzed/pdf-template.git
cd pdf-template
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/pdf-template
PORT=4000

# Optional — Cloudinary (falls back to local storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional — Email notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password

# Optional — Inngest
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

### 3. Start Services

```bash
# Terminal 1 — Backend API
npm run dev

# Terminal 2 — Inngest Dev Server
npx inngest-cli@latest dev -u http://localhost:4000/api/inngest

# Terminal 3 — Frontend Dashboard
cd web && npm install && npm run dev
```

The API runs at **http://localhost:4000** and the dashboard at **http://localhost:3000**.

> On first start, a default project and API key are auto-seeded and written to `.dashboard-key` and `web/.env.local`.

## Project Structure

```
pdf-template/
├── src/                    # Backend (Express + TypeScript)
│   ├── api/
│   │   ├── controllers/    # Route handlers
│   │   └── routes/         # API route definitions
│   ├── config/             # DB connection config
│   ├── inngest/            # Async job functions (PDF gen, ATS scoring)
│   ├── middleware/          # API key auth, error handler, rate limiter
│   ├── models/             # Mongoose schemas (Project, Job, Template, User, Analytics)
│   ├── seeds/              # Auto-seed default project on startup
│   ├── services/           # Business logic (PDF, storage, email, ATS)
│   ├── templates/          # Handlebars resume templates (.hbs)
│   └── server.ts           # Entry point
├── web/                    # Frontend (Next.js 15 + Tailwind)
│   └── src/
│       ├── app/            # Pages: Dashboard, Jobs, Resumes, Templates, Generate, Settings
│       ├── components/     # Sidebar, layout
│       └── lib/            # API client
├── sdk/                    # Published npm SDK (@exwhyzed/pdflet)
│   ├── src/index.ts        # SDK source
│   ├── package.json
│   └── README.md
├── Dockerfile              # Multi-stage production build
└── .env.example
```

## API Reference

All endpoints are prefixed with `/v1`. Authenticated routes require the `x-api-key` header.

### PDF Generation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/v1/generate/:templateSlug` | ✅ | Generate a single PDF |
| `POST` | `/v1/bulk-generate/:templateSlug` | ✅ | Bulk generate PDFs |

**Generate PDF:**
```bash
curl -X POST http://localhost:4000/v1/generate/default-resume \
  -H "Content-Type: application/json" \
  -H "x-api-key: pk_your_key" \
  -d '{
    "resumeData": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "skills": ["TypeScript", "React"]
    }
  }'
```

### Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/v1/jobs` | ✅ | List all jobs (paginated) |
| `GET` | `/v1/job/:jobId` | ✅ | Get job status, PDF URL, ATS score |
| `GET` | `/v1/jobs/bulk/:bulkJobId` | ✅ | Get bulk job progress |

### Templates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/v1/marketplace/templates` | ❌ | List public templates |
| `POST` | `/v1/templates` | ✅ | Create a template |

### Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/v1/projects` | ❌ | List all projects |
| `POST` | `/v1/projects` | ❌ | Create a new project |
| `GET` | `/v1/project` | ✅ | Get current project details |
| `PUT` | `/v1/project` | ✅ | Update project settings |
| `DELETE` | `/v1/project` | ✅ | Soft-delete project |

## SDK

Install the official TypeScript SDK:

```bash
npm install @exwhyzed/pdflet
```

```ts
import { createClient } from '@exwhyzed/pdflet';

const client = createClient({
  apiKey: 'pk_your_key',
  baseUrl: 'https://api.resumeforge.dev',
  retry: { maxRetries: 3 },
  debug: true,
});

const { jobId } = await client.generatePDF('default-resume', {
  name: 'Jane Doe',
  skills: ['TypeScript', 'React'],
});

const job = await client.waitForJob(jobId);
console.log(job.pdfUrl, job.atsScore);
```

**SDK Features:** retry with exponential backoff, request timeouts, rate-limit awareness, input validation, debug logging, typed errors (`PdfletError`, `TimeoutError`, `RateLimitError`, `ValidationError`).

See [`sdk/README.md`](sdk/README.md) for full documentation.

## Dashboard

The Next.js dashboard provides:

- **Dashboard** — overview with job stats, recent activity, project info
- **Jobs** — real-time job list with status badges, ATS score breakdown, auto-refresh
- **Resumes** — completed PDFs with embedded previews, search, filtering by template/ATS score
- **Templates** — browse, create, and manage Handlebars resume templates
- **Generate** — interactive PDF generation form with template selection
- **Settings** — organization management, API keys, webhook config, usage/billing
- **Org Switcher** — switch between organizations directly from the sidebar

## Templates

Resume templates use [Handlebars](https://handlebarsjs.com/) syntax. Built-in templates:

| Template | Slug | Description |
|----------|------|-------------|
| Default Resume | `default-resume` | Clean, professional single-column layout |
| Modern Resume | `modern-resume` | Two-column modern design with sidebar |

Create custom templates via the API or dashboard with HTML + CSS + Handlebars variables.

## Webhooks

Configure a webhook URL in project settings to receive POST notifications when PDFs complete:

```json
{
  "jobId": "abc123",
  "status": "completed",
  "pdfUrl": "https://res.cloudinary.com/.../resume.pdf",
  "atsScore": { "total": 82, "breakdown": { "skills": 90, "experience": 75, "summary": 80, "structure": 85 } }
}
```

## Deployment

### Docker

```bash
docker build -t resumeforge .
docker run -p 4000:4000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/pdf-template \
  -e NODE_ENV=production \
  resumeforge
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `PORT` | ❌ | `4000` | API server port |
| `NODE_ENV` | ❌ | `development` | Environment |
| `CLOUDINARY_CLOUD_NAME` | ❌ | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ❌ | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ | — | Cloudinary API secret |
| `INNGEST_EVENT_KEY` | ❌ | — | Inngest event key |
| `INNGEST_SIGNING_KEY` | ❌ | — | Inngest signing key |
| `SMTP_HOST` | ❌ | — | SMTP server host |
| `SMTP_PORT` | ❌ | `587` | SMTP port |
| `SMTP_USER` | ❌ | — | SMTP username |
| `SMTP_PASS` | ❌ | — | SMTP password |
| `EMAIL_FROM` | ❌ | — | From address for emails |
| `APP_URL` | ❌ | `http://localhost:4000` | Public app URL |

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Type-check without emitting |

### Frontend (`web/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

### SDK (`sdk/`)

| Command | Description |
|---------|-------------|
| `npm run build` | Build CJS + ESM + types via tsup |
| `npm run typecheck` | Type-check SDK source |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express, TypeScript, Mongoose |
| **PDF Engine** | Puppeteer + Handlebars |
| **Job Queue** | Inngest |
| **Database** | MongoDB |
| **File Storage** | Cloudinary (with local fallback) |
| **Frontend** | Next.js 15, Tailwind CSS v4, Framer Motion |
| **SDK** | TypeScript, tsup (CJS/ESM dual output) |
| **Containerization** | Docker (multi-stage) |

## License

[MIT](LICENSE)
