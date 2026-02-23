import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/apiKeyAuth.js';
import Template from '../../models/Template.js';
import { listPublicTemplates } from '../../services/templateService.js';
import { uploadPreviewImage } from '../../services/cloudinaryService.js';
import logger from '../../utils/logger.js';

/**
 * GET /v1/marketplace/templates
 */
export async function marketplace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const category = (req.query.category as string) || undefined;

    const result = await listPublicTemplates({ page, limit, category });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/templates
 */
export async function createTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, slug, description, html, css, isPublic, category, tags } = req.body as {
      name?: string;
      slug?: string;
      description?: string;
      html?: string;
      css?: string;
      isPublic?: boolean;
      category?: string;
      tags?: string[];
    };

    if (!name || !slug || !html) {
      res.status(400).json({ error: '`name`, `slug`, and `html` are required.' });
      return;
    }

    const existing = await Template.findOne({ slug });
    if (existing) {
      res.status(409).json({ error: `Template slug "${slug}" already exists.` });
      return;
    }

    const template = await Template.create({
      name,
      slug,
      description: description ?? '',
      html,
      css: css ?? '',
      isPublic: isPublic ?? false,
      projectId: req.projectId,
      category: category ?? 'professional',
      tags: tags ?? [],
    });

    logger.info('Template created', { slug, projectId: req.projectId });
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/templates/upload-preview
 */
export async function uploadPreview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slug = req.query.slug as string;
    if (!slug) {
      res.status(400).json({ error: '`slug` query parameter is required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Image file is required (field name: `image`).' });
      return;
    }

    const template = await Template.findOne({
      slug,
      $or: [{ projectId: req.projectId }, { isPublic: true }],
    });

    if (!template) {
      res.status(404).json({ error: `Template "${slug}" not found.` });
      return;
    }

    const result = await uploadPreviewImage(req.file.buffer, { slug });
    template.previewImageUrl = result.url;
    await template.save();

    logger.info('Template preview uploaded', { slug, url: result.url });
    res.json({ slug, previewImageUrl: result.url });
  } catch (err) {
    next(err);
  }
}
