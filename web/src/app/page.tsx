'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

const STATS = [
  { label: 'PDFs Generated', value: '1,247', change: '+12%', icon: '⬡', color: '#6366f1' },
  { label: 'Templates Used', value: '8', change: '+2', icon: '❖', color: '#a855f7' },
  { label: 'Avg ATS Score', value: '82', change: '+5pts', icon: '◈', color: '#22c55e' },
  { label: 'API Calls Today', value: '342', change: '+18%', icon: '⟐', color: '#f59e0b' },
];

const RECENT_JOBS = [
  { id: 'job_8f3a..', template: 'default-resume', status: 'completed', ats: 88, time: '2 min ago' },
  { id: 'job_1b7c..', template: 'modern-resume', status: 'completed', ats: 76, time: '5 min ago' },
  { id: 'job_4e2d..', template: 'default-resume', status: 'processing', ats: null, time: '8 min ago' },
  { id: 'job_9a5f..', template: 'modern-resume', status: 'completed', ats: 91, time: '12 min ago' },
  { id: 'job_2c8e..', template: 'default-resume', status: 'failed', ats: null, time: '15 min ago' },
];

const statusClasses: Record<string, string> = {
  completed: 'text-success bg-success-soft',
  processing: 'text-info bg-info-soft',
  pending: 'text-warning bg-warning-soft',
  failed: 'text-error bg-error-soft',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClasses[status] || ''}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-tertiary mt-1">Overview of your PDF generation activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-9 max-lg:grid-cols-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="bg-bg-card border border-border-default rounded-[14px] p-5 flex items-start gap-3.5 relative overflow-hidden transition-all duration-250 hover:border-border-light hover:bg-bg-card-hover hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
          >
            <div
              className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl shrink-0"
              style={{ background: `${stat.color}18`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-[26px] font-bold text-text-primary tracking-tight">{stat.value}</p>
            </div>
            <span className="absolute top-4 right-4 text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
              {stat.change}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mb-9"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Jobs</h2>
          <Link href="/jobs" className="text-[13px] text-accent font-medium hover:text-accent-hover transition-colors">
            View all →
          </Link>
        </div>
        <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr] px-5 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-bg-tertiary border-b border-border-default">
            <span>Job ID</span><span>Template</span><span>Status</span><span>ATS Score</span><span>Time</span>
          </div>
          {RECENT_JOBS.map((job) => (
            <div key={job.id} className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr] px-5 py-3.5 text-[13px] text-text-secondary items-center border-b border-border-default last:border-b-0 hover:bg-bg-card-hover transition-colors">
              <span className="font-mono text-xs text-text-tertiary">{job.id}</span>
              <span>{job.template}</span>
              <StatusBadge status={job.status} />
              <span>{job.ats !== null ? <span className="font-bold text-success text-sm">{job.ats}</span> : <span className="text-text-muted">—</span>}</span>
              <span className="text-text-tertiary text-xs">{job.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          {[
            { href: '/generate', icon: '⬡', label: 'Generate PDF', desc: 'Create a resume PDF from JSON data' },
            { href: '/templates', icon: '❖', label: 'Browse Templates', desc: 'Explore and manage resume templates' },
            { href: '/settings', icon: '⚙', label: 'API Keys', desc: 'Manage your project API keys' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-bg-card border border-border-default rounded-[14px] p-6 flex flex-col gap-2 transition-all duration-250 hover:border-accent hover:bg-accent-soft hover:-translate-y-0.5 hover:shadow-glow cursor-pointer"
            >
              <span className="text-[26px] mb-1">{action.icon}</span>
              <span className="text-[15px] font-semibold text-text-primary">{action.label}</span>
              <span className="text-xs text-text-tertiary">{action.desc}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
