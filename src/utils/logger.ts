/**
 * Structured logger utility.
 * Outputs JSON in production, pretty text in development.
 */
const isProd = process.env.NODE_ENV === 'production';

interface LogMeta {
  [key: string]: unknown;
}

function formatMessage(level: string, message: string, meta: LogMeta = {}): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (isProd) {
    return JSON.stringify(entry);
  }

  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `[${entry.timestamp}] ${level.toUpperCase()} ${message}${metaStr}`;
}

const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(formatMessage('info', message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(formatMessage('error', message, meta));
  },
  debug(message: string, meta?: LogMeta): void {
    if (!isProd) console.debug(formatMessage('debug', message, meta));
  },
};

export default logger;
