import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

function getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
}

export interface SendPdfEmailParams {
  to: string;
  pdfUrl: string;
  name?: string | null;
}

/**
 * Send an email with a link to the generated PDF.
 */
export async function sendPdfEmail({ to, pdfUrl, name }: SendPdfEmailParams): Promise<void> {
  if (!to) {
    logger.debug('No email recipient — skipping');
    return;
  }

  const mail = getTransporter();
  const displayName = name ?? 'there';

  const info = await mail.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Your Resume PDF is Ready 🎉',
    text: `Hi ${displayName},\n\nYour resume PDF has been generated successfully.\n\nDownload it here: ${pdfUrl}\n\nBest regards,\nResume SaaS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2>Hi ${displayName},</h2>
        <p>Your resume PDF has been generated successfully.</p>
        <p style="margin: 24px 0;">
          <a href="${pdfUrl}"
             style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Download PDF
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">Best regards,<br/>Resume SaaS</p>
      </div>
    `,
  });

  logger.info('Email sent', { to, messageId: info.messageId });
}
