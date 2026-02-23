'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const MOCK_API_KEYS = [
  { id: '1', key: 'pk_a1b2c3d4e5f6g7h8i9j0kl', label: 'Production', isActive: true, createdAt: 'Jan 15, 2025' },
  { id: '2', key: 'pk_z9y8x7w6v5u4t3s2r1q0pl', label: 'Development', isActive: true, createdAt: 'Feb 1, 2025' },
];

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhook');
  const [copied, setCopied] = useState<string | null>(null);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-tertiary mt-1">Manage your project configuration, API keys, and webhooks</p>
      </div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mb-9"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="text-[13px] font-semibold text-accent bg-accent-soft border border-accent/20 px-[18px] py-2 rounded-[10px] cursor-pointer font-sans hover:bg-accent hover:text-white transition-all"
          >
            + Create Key
          </motion.button>
        </div>
        <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
          {MOCK_API_KEYS.map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="flex items-center justify-between px-5 py-[18px] border-b border-border-default last:border-b-0 gap-5 max-md:flex-col max-md:items-start max-md:gap-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-[140px]">
                <span className="text-sm font-semibold text-text-primary">{k.label}</span>
                <span className="text-[11px] text-text-muted">Created {k.createdAt}</span>
              </div>
              <div className="flex-1 flex items-center gap-2.5">
                <code className="font-mono text-xs text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-[6px] tracking-wide">
                  {k.key.slice(0, 12)}{'•'.repeat(12)}
                </code>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyKey(k.key)}
                  className="text-xs font-semibold text-accent bg-accent-soft border-none px-3.5 py-[5px] rounded-[6px] cursor-pointer font-sans hover:bg-accent hover:text-white transition-all"
                >
                  {copied === k.key ? '✓ Copied' : 'Copy'}
                </motion.button>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${k.isActive ? 'text-success bg-success-soft' : 'text-error bg-error-soft'}`}>
                {k.isActive ? 'Active' : 'Revoked'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Webhook */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="mb-9"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-2">Webhook</h2>
        <p className="text-[13px] text-text-tertiary mb-4 leading-relaxed">
          Receive a POST request when a PDF generation completes.
          Payload includes <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs text-accent">jobId</code>,{' '}
          <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs text-accent">pdfUrl</code>, and{' '}
          <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs text-accent">atsScore</code>.
        </p>
        <div className="flex gap-2.5 max-md:flex-col">
          <input
            type="url"
            placeholder="https://your-app.com/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 px-3.5 py-[11px] bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-[11px] bg-accent text-white text-[13px] font-semibold font-sans border-none rounded-[10px] cursor-pointer hover:bg-accent-hover transition-all"
          >
            Save
          </motion.button>
        </div>
      </motion.div>

      {/* Plan & Usage */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="mb-9"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">Plan & Usage</h2>
        <div className="bg-bg-card border border-border-default rounded-[14px] p-6 flex items-center gap-7 max-md:flex-col max-md:items-stretch">
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="text-base font-bold text-text-primary">Free Plan</span>
            <span className="text-xs text-text-tertiary">100 PDFs / month</span>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '42%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
              />
            </div>
            <span className="text-xs text-text-tertiary">42 / 100 used</span>
          </div>
          <motion.button
            whileHover={{ y: -1, boxShadow: '0 0 40px var(--color-accent-glow)' }}
            whileTap={{ scale: 0.98 }}
            className="px-[22px] py-2.5 bg-gradient-to-br from-accent to-purple-500 text-white text-[13px] font-semibold font-sans border-none rounded-[10px] cursor-pointer whitespace-nowrap shadow-glow transition-all"
          >
            Upgrade Plan →
          </motion.button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-error mb-4">Danger Zone</h2>
        <div className="bg-bg-card border border-error/20 rounded-[14px] px-6 py-5 flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">Delete Project</p>
            <p className="text-xs text-text-tertiary mt-0.5">Permanently delete this project and all its data.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 bg-error-soft text-error text-[13px] font-semibold font-sans border border-error/20 rounded-[10px] cursor-pointer hover:bg-error hover:text-white transition-all"
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
