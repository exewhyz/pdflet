import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Template from '../models/Template.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

interface DefaultTemplate {
  name: string;
  slug: string;
  description: string;
  fileName: string;
  isPublic: boolean;
  category: string;
  tags: string[];
}

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Default Resume',
    slug: 'default-resume',
    description: 'Clean, ATS-optimized single-column resume template.',
    fileName: 'default-resume.hbs',
    isPublic: true,
    category: 'professional',
    tags: ['ats', 'clean', 'professional'],
  },
  {
    name: 'Modern Resume',
    slug: 'modern-resume',
    description: 'Two-column modern resume with sidebar for skills and contact.',
    fileName: 'modern-resume.hbs',
    isPublic: true,
    category: 'creative',
    tags: ['modern', 'two-column', 'creative'],
  },
];

/**
 * Seed default templates into the database (idempotent).
 */
export async function seedDefaultTemplates(): Promise<void> {
  for (const tpl of DEFAULT_TEMPLATES) {
    const exists = await Template.findOne({ slug: tpl.slug });
    if (exists) continue;

    const htmlPath = path.join(TEMPLATES_DIR, tpl.fileName);
    if (!fs.existsSync(htmlPath)) {
      logger.warn(`Template file not found: ${htmlPath}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');

    await Template.create({
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      html,
      isPublic: tpl.isPublic,
      category: tpl.category,
      tags: tpl.tags,
      projectId: null,
    });

    logger.info(`Seeded template: ${tpl.slug}`);
  }
}
