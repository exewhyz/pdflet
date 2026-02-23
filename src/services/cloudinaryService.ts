import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ── Configure Cloudinary ───────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a PDF buffer to Cloudinary.
 */
export async function uploadPDF(
  buffer: Buffer,
  { projectId, jobId }: { projectId: string; jobId: string },
): Promise<UploadResult> {
  const folder = `pdf-template/${projectId}`;
  const publicId = `${folder}/resume_${jobId}`;

  return new Promise<UploadResult>((resolve, reject) => {
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
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info('Cloudinary resource deleted', { publicId });
  } catch (err) {
    logger.error('Cloudinary delete failed', { publicId, error: (err as Error).message });
  }
}
