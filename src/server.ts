import mongoose from 'mongoose';
import config from './config/index.js';
import app from './app.js';
import logger from './utils/logger.js';
import { closeBrowser } from './services/pdfService.js';
import { seedDefaultTemplates } from './seeds/templates.js';

async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected', {
      uri: config.mongoUri.replace(/\/\/.*@/, '//<credentials>@'),
    });

    await seedDefaultTemplates();

    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`, { env: config.nodeEnv });
    });
  } catch (err) {
    logger.error('Failed to start server', {
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — shutting down gracefully`);
  await closeBrowser();
  await mongoose.disconnect();
  logger.info('Cleanup complete');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
