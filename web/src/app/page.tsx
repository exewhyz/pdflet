'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { listJobs, getProject, type Job, type ProjectInfo } from '@/lib/api';

const statusClasses: Record<string, string> = {
  completed: 'text-success bg-success-soft',
  processing: 'text-info bg-info-soft',
  pending: 'text-warning bg-warning-soft',
  failed: 'text-error bg-error-soft',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClasses[status] || ''}`}
    >
      {status}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [jobsData, projectData] = await Promise.all([
      listJobs(1, 50).catch(() => ({ jobs: [] as Job[] })),
      getProject().catch(() => null),
    ]);
    setJobs(jobsData.jobs);
    setProject(projectData);
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const handler = () => { setLoading(true); fetchData().finally(() => setLoading(false)); };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [fetchData]);

  /* Auto-refresh while jobs are processing */
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === 'pending' || j.status === 'processing',
    );
    if (!hasActive) return;
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [jobs, fetchData]);

  const totalPdfs = jobs.filter((j) => j.status === 'completed').length;
  const templates = new Set(jobs.map((j) => j.templateSlug)).size;
  const avgAts = (() => {
    const scored = jobs.filter((j) => j.atsScore?.total);
    if (scored.length === 0) return 0;
    return Math.round(
      scored.reduce((sum, j) => sum + (j.atsScore?.total || 0), 0) / scored.length,
    );
  })();

  const usageCount = project?.usageCount ?? 0;
  const usageLimit = project?.usageLimits?.maxPdfsPerMonth ?? 100;
  const usagePercent = Math.round((usageCount / usageLimit) * 100);
  const planLabel = project ? (project.plan === 'free' ? 'Free Plan' : project.plan.charAt(0).toUpperCase() + project.plan.slice(1) + ' Plan') : 'Free Plan';

  const stats = [
    { label: 'PDFs Generated', value: totalPdfs, icon: '⬡', color: '#6366f1' },
    { label: 'Templates Used', value: templates, icon: '❖', color: '#a855f7' },
    { label: 'Avg ATS Score', value: avgAts || '—', icon: '◈', color: '#22c55e' },
    { label: 'Total Jobs', value: jobs.length, icon: '⟐', color: '#f59e0b' },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {project ? `${project.name} — Overview` : 'Overview of your PDF generation activity'}
          </p>
        </div>
        {project && (
          <div className="flex items-center gap-2.5 bg-bg-card border border-border-default rounded-[10px] px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-text-secondary font-medium">{planLabel}</span>
            <span className="text-[11px] text-text-muted">
              {usageCount}/{usageLimit} PDFs
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-9">
        {stats.map((stat, i) => (
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
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="text-[26px] font-bold text-text-primary tracking-tight">
                {loading ? '—' : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Usage Bar (only if project loaded) */}
      {project && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-9 bg-bg-card border border-border-default rounded-[14px] p-5"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-text-primary">Monthly Usage</span>
            <span className="text-xs text-text-tertiary">{usageCount} / {usageLimit} PDFs</span>
          </div>
          <div className="h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mb-9"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Jobs</h2>
          <Link
            href="/jobs"
            className="text-[13px] text-accent font-medium hover:text-accent-hover transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="bg-bg-card border border-border-default rounded-[14px] overflow-x-auto">
          <div className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr] min-w-[600px] px-5 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-bg-tertiary border-b border-border-default">
            <span>Job ID</span>
            <span>Template</span>
            <span>Status</span>
            <span>ATS Score</span>
            <span>Time</span>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              No jobs yet. Generate a PDF to get started!
            </div>
          ) : (
            recentJobs.map((job) => {
              const jobId = (job.jobId || job._id) as string;
              return (
                <div
                  key={jobId}
                  className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr] min-w-[600px] px-5 py-3.5 text-[13px] text-text-secondary items-center border-b border-border-default last:border-b-0 hover:bg-bg-card-hover transition-colors"
                >
                  <span className="font-mono text-xs text-text-tertiary">
                    {jobId.length > 10 ? `${jobId.slice(0, 10)}..` : jobId}
                  </span>
                  <span>{job.templateSlug}</span>
                  <StatusBadge status={job.status} />
                  <span>
                    {job.atsScore?.total ? (
                      <span className="font-bold text-success text-sm">{job.atsScore.total}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </span>
                  <span className="text-text-tertiary text-xs">{timeAgo(job.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              href: '/generate',
              icon: '⬡',
              label: 'Generate PDF',
              desc: 'Create a resume PDF from your data',
            },
            {
              href: '/templates',
              icon: '❖',
              label: 'Browse Templates',
              desc: 'Explore and manage resume templates',
            },
            {
              href: '/settings',
              icon: '⚙',
              label: 'Settings',
              desc: 'Manage API keys and organisation',
            },
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
