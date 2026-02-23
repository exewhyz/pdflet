import puppeteer, { type Browser } from 'puppeteer';
import logger from '../utils/logger.js';

/**
 * PDF Service — Singleton Puppeteer browser for performance.
 */

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  logger.info('Launching Puppeteer browser instance');

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
    protocolTimeout: 60_000,
  });

  browserInstance.on('disconnected', () => {
    logger.warn('Browser disconnected — will relaunch on next request');
    browserInstance = null;
  });

  return browserInstance;
}

const GLOBAL_PDF_CSS = `
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }
  table, figure, ul, ol, dl {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  p {
    orphans: 3;
    widows: 3;
  }
  @page {
    margin: 0.5in;
  }
  body {
    font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #222;
    -webkit-font-smoothing: antialiased;
  }
  img {
    max-width: 100%;
    height: auto;
    display: inline-block;
  }
`;

export interface PdfOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  customCss?: string;
}

/**
 * Generate a PDF buffer from raw HTML.
 */
export async function generatePDF(html: string, options: PdfOptions = {}): Promise<Buffer> {
  const { format = 'A4', landscape = false, customCss = '' } = options;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      req.continue();
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30_000,
    });

    await page.addStyleTag({ content: GLOBAL_PDF_CSS + '\n' + customCss });
    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      omitBackground: false,
      timeout: 60_000,
    });

    logger.info('PDF generated', { sizeKB: Math.round(pdfBuffer.length / 1024) });
    return Buffer.from(pdfBuffer);
  } catch (err) {
    logger.error('PDF generation failed', { error: (err as Error).message });
    throw err;
  } finally {
    await page.close();
  }
}

/**
 * Gracefully shut down the browser (call on process exit).
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Browser instance closed');
  }
}
