# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-03-02

### Added
- `createClient()` factory with full configuration options
- `generatePDF()` — single PDF generation
- `bulkGenerate()` — batch PDF generation
- `getJob()` — check job status
- `waitForJob()` — poll until completion with `onPoll` callback
- `getBulkJobs()` — bulk job status and results
- `listTemplates()` — browse marketplace templates
- `createTemplate()` — create custom templates
- Automatic retry with exponential backoff and jitter
- Request timeouts via `AbortController`
- Rate-limit awareness (429 + `Retry-After` header)
- Input validation on all public methods
- Debug logging (opt-in via `debug: true` or custom `logger`)
- Typed error classes: `PdfletError`, `TimeoutError`, `RateLimitError`, `ValidationError`
- Dual CJS/ESM output with full TypeScript declarations
- Zero runtime dependencies
