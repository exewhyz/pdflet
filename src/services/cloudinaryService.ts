import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ── Configure Cloudinary ───────────────────────────────
const cloudinaryEnabled =
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret &&
  config.cloudinary.apiKey !== 'your_api_key';

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

// ── Local storage fallback directory ───────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_PDF_DIR = join(__dirname, '..', '..', 'storage', 'pdfs');

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Save PDF buffer to local filesystem.
 */
async function saveLocally(
  buffer: Buffer,
  { projectId, jobId }: { projectId: string; jobId: string },
): Promise<UploadResult> {
  const dir = join(LOCAL_PDF_DIR, projectId);
  await mkdir(dir, { recursive: true });
  const filename = `resume_${jobId}.pdf`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);
  const url = `${config.appUrl}/storage/pdfs/${projectId}/${filename}`;
  logger.info('PDF saved locally', { filepath, url });
  return { url, publicId: `local/${projectId}/${filename}` };
}

/**
 * Upload a PDF buffer to Cloudinary, falling back to local storage on failure.
 */
export async function uploadPDF(
  buffer: Buffer,
  { projectId, jobId }: { projectId: string; jobId: string },
): Promise<UploadResult> {
  // Always save locally first so we have a guaranteed copy
  const localResult = await saveLocally(buffer, { projectId, jobId });
  const localPath = join(LOCAL_PDF_DIR, projectId, `resume_${jobId}.pdf`);

  // Skip Cloudinary if not configured
  if (!cloudinaryEnabled) {
    logger.info('Cloudinary not configured — using local PDF');
    return localResult;
  }

  const folder = `pdf-template/${projectId}`;
  const publicId = `${folder}/resume_${jobId}`;

  try {
    const cloudResult = await new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          format: 'pdf',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary PDF upload failed', { error: error.message });
            return reject(error);
          }
          logger.info('PDF uploaded to Cloudinary', { publicId: result?.public_id });
          resolve({ url: result!.secure_url, publicId: result!.public_id });
        },
      );

      stream.end(buffer);
    });

    // Cloudinary succeeded — delete local copy
    await unlink(localPath).catch(() => {});
    logger.info('Local PDF deleted after Cloudinary upload', { localPath });
    return cloudResult;
  } catch (err) {
    logger.warn('Cloudinary upload failed — keeping local PDF', {
      error: (err as Error).message,
    });
    return localResult;
  }
}

/**
 * Upload a template preview image to Cloudinary.
 */
export async function uploadPreviewImage(
  imageBuffer: Buffer,
  { slug }: { slug: string },
): Promise<UploadResult> {
  const publicId = `pdf-template/previews/${slug}`;

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: true,
        transformation: [
          { width: 600, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary preview upload failed', { error: error.message });
          return reject(error);
        }
        logger.info('Preview image uploaded', { publicId: result?.public_id });
        resolve({ url: result!.secure_url, publicId: result!.public_id });
      },
    );

    stream.end(imageBuffer);
  });
}

/**
 * Delete a resource from Cloudinary.
 */
export async function deleteResource(
  publicId: string,
  resourceType: 'raw' | 'image' = 'raw',
): Promise<void> {
  if (!cloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info('Cloudinary resource deleted', { publicId });
  } catch (err) {
    logger.error('Cloudinary delete failed', { publicId, error: (err as Error).message });
  }
}
