import 'dotenv/config';

interface SmtpConfig {
  host: string | undefined;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  from: string;
}

interface CloudinaryConfig {
  cloudName: string | undefined;
  apiKey: string | undefined;
  apiSecret: string | undefined;
}

interface InngestConfig {
  eventKey: string | undefined;
  signingKey: string | undefined;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProd: boolean;
  mongoUri: string;
  cloudinary: CloudinaryConfig;
  inngest: InngestConfig;
  smtp: SmtpConfig;
  appUrl: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT ?? '4000',10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',

  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/pdf-template',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  inngest: {
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? 'Resume SaaS <noreply@example.com>',
  },

  appUrl: process.env.APP_URL ?? 'http://localhost:4000',
};

export default config;
