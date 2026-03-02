'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { listJobs, getJob, type Job } from '@/lib/api';

const statusClasses: Record<string, string> = {
  completed: 'text-success bg-success-soft',
  processing: 'text-info bg-info-soft',
  pending: 'text-warning bg-warning-soft',
  failed: 'text-error bg-error-soft',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClasses[status] || ''}`}
    >
      {status}
    </span>
  );
}

function AtsBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? 'var(--color-success)'
      : score >= 60
        ? 'var(--color-warning)'
        : 'var(--color-error)';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
        <span>{label}</span>
        <span style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setError(null);
    try {
      const data = await listJobs();
      setJobs(data.jobs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const handler = () => { setLoading(true); setSelectedId(null); fetchJobs(); };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [fetchJobs]);

  /* Fetch job detail when selected or when list refreshes */
  useEffect(() => {
    if (!selectedId) {
      setSelectedJob(null);
      return;
    }
    const id = selectedId;
    getJob(id)
      .then((j) => {
        if (id === selectedId) setSelectedJob(j);
      })
      .catch(() => {});
  }, [selectedId, jobs]);

  /* Auto-refresh processing jobs */
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === 'pending' || j.status === 'processing',
    );
    if (!hasActive) return;
    const timer = setInterval(fetchJobs, 5000);
    return () => clearInterval(timer);
  }, [jobs, fetchJobs]);

  const summary = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Jobs</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Track PDF generation jobs and view results
          </p>
        </div>
        {jobs.length > 0 && (
          <div className="flex gap-4 sm:gap-5">
            {[
              { v: summary.total, l: 'Total', c: '' },
              { v: summary.completed, l: 'Completed', c: 'text-success' },
              { v: summary.failed, l: 'Failed', c: 'text-error' },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <span className={`block text-[22px] font-bold text-text-primary ${s.c}`}>
                  {s.v}
                </span>
                <span className="text-[11px] text-text-muted uppercase tracking-wide">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-error-soft border border-error/20 rounded-[10px] text-error text-[13px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-bg-card border border-border-default rounded-[14px] p-12 flex justify-center">
          <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-3">
          <span className="text-[40px] opacity-40">⟐</span>
          <p className="text-text-secondary text-sm">
            No jobs yet. Generate a PDF to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
          {/* List */}
          <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
            {jobs.map((j, i) => {
              const jobId = (j.jobId || j._id) as string;
              return (
                <motion.div
                  key={jobId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  onClick={() => setSelectedId(jobId)}
                  className={`flex justify-between items-center px-5 py-4 border-b border-border-default last:border-b-0 cursor-pointer transition-colors
                    ${selectedId === jobId ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-bg-card-hover'}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[13px] font-semibold text-text-primary">
                      {jobId.length > 12 ? `${jobId.slice(0, 12)}…` : jobId}
                    </span>
                    <span className="text-xs text-text-tertiary">{j.templateSlug}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={j.status} />
                    <span className="text-[11px] text-text-muted">{timeAgo(j.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:sticky lg:top-8 bg-bg-card border border-border-default rounded-[14px] min-h-[300px] lg:min-h-[400px]">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={(selectedJob.jobId || selectedJob._id) as string}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="p-5 sm:p-6"
                >
                  <h3 className="text-base font-bold font-mono text-text-primary mb-5 pb-3.5 border-b border-border-default truncate">
                    {(selectedJob.jobId || selectedJob._id) as string}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { l: 'Status', v: <StatusBadge status={selectedJob.status} /> },
                      {
                        l: 'Template',
                        v: (
                          <span className="text-[13px] text-text-secondary">
                            {selectedJob.templateSlug}
                          </span>
                        ),
                      },
                      {
                        l: 'Created',
                        v: (
                          <span className="text-[13px] text-text-secondary">
                            {timeAgo(selectedJob.createdAt)}
                          </span>
                        ),
                      },
                      {
                        l: 'PDF',
                        v: selectedJob.pdfUrl ? (
                          <a
                            href={selectedJob.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] text-accent font-semibold hover:text-accent-hover"
                          >
                            Download ↓
                          </a>
                        ) : (
                          <span className="text-xs text-text-muted">Not available</span>
                        ),
                      },
                    ].map((d) => (
                      <div key={d.l} className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                          {d.l}
                        </span>
                        {d.v}
                      </div>
                    ))}
                  </div>

                  {selectedJob.error && (
                    <div className="mb-4 p-3 bg-error-soft border border-error/20 rounded-[8px] text-error text-[12px]">
                      {selectedJob.error}
                    </div>
                  )}

                  {selectedJob.atsScore && (
                    <div className="pt-5 border-t border-border-default">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-text-primary">ATS Score</span>
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="text-[32px] font-extrabold text-success tracking-tight"
                        >
                          {selectedJob.atsScore.total}
                        </motion.span>
                      </div>
                      <AtsBar score={selectedJob.atsScore.breakdown.skills} label="Skills" />
                      <AtsBar
                        score={selectedJob.atsScore.breakdown.experience}
                        label="Experience"
                      />
                      <AtsBar score={selectedJob.atsScore.breakdown.summary} label="Summary" />
                      <AtsBar
                        score={selectedJob.atsScore.breakdown.structure}
                        label="Structure"
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-3"
                >
                  <span className="text-[40px] opacity-40">⟐</span>
                  <p>Select a job to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
