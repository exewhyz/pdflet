import Handlebars from 'handlebars';
import type { Types } from 'mongoose';
import Template, { type ITemplate } from '../models/Template.js';
import logger from '../utils/logger.js';

// ─── Handlebars helpers ────────────────────────────────

Handlebars.registerHelper(
  'each_with_index',
  function (context: unknown[], options: Handlebars.HelperOptions) {
    let out = '';
    for (let i = 0; i < context.length; i++) {
      out += options.fn(context[i], { data: { index: i } });
    }
    return out;
  },
);

Handlebars.registerHelper('date_format', function (dateStr: string | null | undefined) {
  if (!dateStr) return 'Present';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
});

Handlebars.registerHelper(
  'if_eq',
  function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  },
);

Handlebars.registerHelper('join', function (arr: unknown[], sep: string) {
  if (!Array.isArray(arr)) return '';
  return arr.join(typeof sep === 'string' ? sep : ', ');
});

// ─── Service functions ─────────────────────────────────

export interface TemplateListResult {
  templates: ITemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Look up a Template by slug, respecting project scope.
 */
export async function findTemplate(slug: string, projectId: Types.ObjectId): Promise<ITemplate> {
  const template = await Template.findOne({
    slug,
    $or: [{ isPublic: true }, { projectId }],
  });

  if (!template) {
    const err = new Error(`Template "${slug}" not found`) as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return template;
}

/**
 * Compile and render a Handlebars template with resume data.
 */
export function renderTemplate(template: ITemplate, data: Record<string, unknown>): string {
  try {
    let fullHtml = template.html;
    if (template.css) {
      fullHtml = `<style>${template.css}</style>\n${fullHtml}`;
    }

    const compiled = Handlebars.compile(fullHtml, { strict: false });
    return compiled(data);
  } catch (err) {
    logger.error('Template rendering failed', {
      slug: template.slug,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * List public templates for the marketplace.
 */
export async function listPublicTemplates(
  options: { page?: number; limit?: number; category?: string } = {},
): Promise<TemplateListResult> {
  const { page = 1, limit = 20, category } = options;

  const filter: Record<string, unknown> = { isPublic: true };
  if (category) filter.category = category;

  const [templates, total] = await Promise.all([
    Template.find(filter)
      .select('-html -css')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Template.countDocuments(filter),
  ]);

  return {
    templates: templates as unknown as ITemplate[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
