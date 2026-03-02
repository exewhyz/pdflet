'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getTemplates, createTemplateApi, type Template } from '@/lib/api';

const catColors: Record<string, string> = {
  professional: '#6366f1',
  creative: '#a855f7',
  academic: '#3b82f6',
  technical: '#22c55e',
  minimal: '#6b7280',
};

const categories = ['professional', 'creative', 'academic', 'technical', 'minimal'];

function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden animate-pulse">
      <div className="h-[180px] bg-bg-tertiary" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-bg-tertiary rounded" />
        <div className="h-3 w-full bg-bg-tertiary rounded" />
        <div className="h-3 w-4/5 bg-bg-tertiary rounded" />
      </div>
    </div>
  );
}

/* ── Create Template Modal ─────────────────────────── */

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateTemplateModal({ open, onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('professional');
  const [tags, setTags] = useState('');
  const [html, setHtml] = useState('<div class="resume">\n  <!-- Your template HTML here -->\n</div>');
  const [css, setCss] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    );
  }, [name]);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !slug.trim() || !html.trim()) {
      setError('Name, slug, and HTML are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createTemplateApi({
        name: name.trim(),
        slug: slug.trim(),
        html,
        css: css || undefined,
        description: description.trim() || undefined,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPublic,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bg-card border border-border-default rounded-[16px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-border-default">
            <h2 className="text-lg font-bold text-text-primary">Create Template</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-error-soft border border-error/20 rounded-[8px] text-error text-[13px]">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive Resume"
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="executive-resume"
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[14px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the template"
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>

            {/* Category + Tags row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all capitalize"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ats, clean, modern"
                  className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>

            {/* HTML */}
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                HTML Template *
              </label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={8}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all resize-y"
              />
            </div>

            {/* CSS */}
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                CSS (optional)
              </label>
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                rows={4}
                placeholder="body { font-family: sans-serif; }"
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-default rounded-[10px] text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all resize-y"
              />
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-border-default bg-bg-secondary accent-accent"
              />
              <span className="text-[13px] text-text-secondary">Make publicly available in marketplace</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-default">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-text-secondary bg-bg-tertiary rounded-[10px] hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !html.trim()}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-accent rounded-[10px] hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Template'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Templates Page ────────────────────────────────── */

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTemplates = useCallback(() => {
    getTemplates(1, 50)
      .then((r) => setTemplates(r.templates))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTemplates();
    const handler = () => { setLoading(true); fetchTemplates(); };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [fetchTemplates]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-7">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
          Templates Marketplace
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Browse and manage ATS-optimized resume templates
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-warning-soft border border-warning/20 rounded-[10px] text-warning text-[13px]">
          ⚠ Could not fetch templates from API — showing fallback. ({error})
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {(templates.length > 0
              ? templates
              : ([
                  {
                    _id: '1',
                    name: 'Default Resume',
                    slug: 'default-resume',
                    description:
                      'Clean, ATS-optimized single-column resume template. Professional and easy to read.',
                    category: 'professional',
                    tags: ['ats', 'clean', 'professional'],
                    isPublic: true,
                  },
                  {
                    _id: '2',
                    name: 'Modern Resume',
                    slug: 'modern-resume',
                    description:
                      'Two-column modern resume with sidebar for skills and contact information.',
                    category: 'creative',
                    tags: ['modern', 'two-column', 'creative'],
                    isPublic: true,
                  },
                ] as Template[])
            ).map((tpl, i) => {
              const color = catColors[tpl.category] || '#6b7280';
              return (
                <motion.div
                  key={tpl.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden transition-all hover:border-border-light hover:shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
                >
                  {/* Preview */}
                  <div className="h-[180px] bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center border-b border-border-default relative overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px)',
                      }}
                    />
                    {tpl.previewImageUrl ? (
                      <img
                        src={tpl.previewImageUrl}
                        alt={tpl.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <span className="text-[32px] opacity-50">❖</span>
                        <span className="text-xs text-text-muted font-medium">{tpl.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold text-text-primary">{tpl.name}</h3>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize"
                        style={{
                          color,
                          background: `${color}15`,
                          borderColor: `${color}30`,
                        }}
                      >
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[13px] text-text-tertiary leading-snug mb-3">
                      {tpl.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {tpl.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3.5 border-t border-border-default">
                      <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        {tpl.isPublic ? 'Public' : 'Private'}
                      </span>
                      <Link
                        href={`/generate?template=${tpl.slug}`}
                        className="text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors"
                      >
                        Use Template →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Add Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              whileHover={{ y: -4 }}
              onClick={() => setShowCreate(true)}
              className="bg-bg-card border-2 border-dashed border-border-default rounded-[14px] flex flex-col items-center justify-center gap-2 min-h-[320px] cursor-pointer transition-all hover:border-accent hover:bg-accent-soft group"
            >
              <span className="text-4xl text-text-muted group-hover:text-accent transition-colors">
                +
              </span>
              <span className="text-[15px] font-semibold text-text-secondary">Create Template</span>
              <span className="text-xs text-text-muted">Upload custom HTML template</span>
            </motion.div>
          </>
        )}
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTemplates}
      />
    </motion.div>
  );
}
