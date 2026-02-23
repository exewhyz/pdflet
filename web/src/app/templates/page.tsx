'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

const TEMPLATES = [
  {
    name: 'Default Resume',
    slug: 'default-resume',
    description: 'Clean, ATS-optimized single-column resume template. Professional and easy to read.',
    category: 'professional',
    tags: ['ats', 'clean', 'professional'],
  },
  {
    name: 'Modern Resume',
    slug: 'modern-resume',
    description: 'Two-column modern resume with sidebar for skills and contact information.',
    category: 'creative',
    tags: ['modern', 'two-column', 'creative'],
  },
];

const catColors: Record<string, string> = {
  professional: '#6366f1',
  creative: '#a855f7',
  academic: '#3b82f6',
  technical: '#22c55e',
  minimal: '#6b7280',
};

export default function TemplatesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-7">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Templates Marketplace</h1>
        <p className="text-sm text-text-tertiary mt-1">Browse and manage ATS-optimized resume templates</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
        {TEMPLATES.map((tpl, i) => {
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
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px)',
                  }}
                />
                <div className="flex flex-col items-center gap-2 z-10">
                  <span className="text-[32px] opacity-50">❖</span>
                  <span className="text-xs text-text-muted font-medium">{tpl.name}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-semibold text-text-primary">{tpl.name}</h3>
                  <span
                    className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize"
                    style={{ color, background: `${color}15`, borderColor: `${color}30` }}
                  >
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[13px] text-text-tertiary leading-snug mb-3">{tpl.description}</p>
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {tpl.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">{t}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3.5 border-t border-border-default">
                  <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Public
                  </span>
                  <Link href={`/generate?template=${tpl.slug}`} className="text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors">
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
          className="bg-bg-card border-2 border-dashed border-border-default rounded-[14px] flex flex-col items-center justify-center gap-2 min-h-[320px] cursor-pointer transition-all hover:border-accent hover:bg-accent-soft group"
        >
          <span className="text-4xl text-text-muted group-hover:text-accent transition-colors">+</span>
          <span className="text-[15px] font-semibold text-text-secondary">Create Template</span>
          <span className="text-xs text-text-muted">Upload custom HTML template</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
