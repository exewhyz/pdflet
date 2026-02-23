import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { serve } from 'inngest/express';
import { inngest } from './inngest/client.js';
import { allFunctions } from './inngest/functions.js';
import rateLimiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import generateRoutes from './api/routes/generateRoutes.js';
import jobRoutes from './api/routes/jobRoutes.js';
import templateRoutes from './api/routes/templateRoutes.js';

const app = express();

// ── Global middleware ─────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(rateLimiter);

// ── Health check ──────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Inngest serve endpoint ────────────────────────────
app.use('/api/inngest', serve({ client: inngest, functions: allFunctions }));

// ── API v1 routes ─────────────────────────────────────
app.use('/v1', generateRoutes);
app.use('/v1', jobRoutes);
app.use('/v1', templateRoutes);

// ── Error handler (must be last) ──────────────────────
app.use(errorHandler);

export default app;
