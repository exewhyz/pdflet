'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_JOBS = [
  { id: 'job_8f3a2c1e', template: 'default-resume', status: 'completed', ats: { total: 88, breakdown: { skills: 85, experience: 90, summary: 80, structure: 100 } }, pdfUrl: '#', createdAt: '2 min ago' },
  { id: 'job_1b7cd4f2', template: 'modern-resume', status: 'completed', ats: { total: 76, breakdown: { skills: 70, experience: 80, summary: 60, structure: 88 } }, pdfUrl: '#', createdAt: '5 min ago' },
  { id: 'job_4e2d9a3b', template: 'default-resume', status: 'processing', ats: null, pdfUrl: null, createdAt: '8 min ago' },
  { id: 'job_9a5fe7c4', template: 'modern-resume', status: 'completed', ats: { total: 91, breakdown: { skills: 100, experience: 85, summary: 80, structure: 100 } }, pdfUrl: '#', createdAt: '12 min ago' },
  { id: 'job_2c8e1d5a', template: 'default-resume', status: 'failed', ats: null, pdfUrl: null, createdAt: '15 min ago' },
  { id: 'job_7f6b3e9d', template: 'default-resume', status: 'pending', ats: null, pdfUrl: null, createdAt: '18 min ago' },
];

const statusClasses: Record<string, string> = {
  completed: 'text-success bg-success-soft',
  processing: 'text-info bg-info-soft',
  pending: 'text-warning bg-warning-soft',
  failed: 'text-error bg-error-soft',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClasses[status] || ''}`}>
      {status}
    </span>
  );
}

function AtsBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-error)';
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

export default function JobsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const job = MOCK_JOBS.find((j) => j.id === selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Jobs</h1>
          <p className="text-sm text-text-tertiary mt-1">Track PDF generation jobs and view results</p>
        </div>
        <div className="flex gap-5">
          {[
            { v: MOCK_JOBS.length, l: 'Total', c: '' },
            { v: MOCK_JOBS.filter((j) => j.status === 'completed').length, l: 'Completed', c: 'text-success' },
            { v: MOCK_JOBS.filter((j) => j.status === 'failed').length, l: 'Failed', c: 'text-error' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <span className={`block text-[22px] font-bold text-text-primary ${s.c}`}>{s.v}</span>
              <span className="text-[11px] text-text-muted uppercase tracking-wide">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-5 items-start max-lg:grid-cols-1">
        {/* List */}
        <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
          {MOCK_JOBS.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => setSelected(j.id)}
              className={`flex justify-between items-center px-5 py-4 border-b border-border-default last:border-b-0 cursor-pointer transition-colors
                ${selected === j.id ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-bg-card-hover'}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[13px] font-semibold text-text-primary">{j.id}</span>
                <span className="text-xs text-text-tertiary">{j.template}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={j.status} />
                <span className="text-[11px] text-text-muted">{j.createdAt}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail */}
        <div className="sticky top-8 bg-bg-card border border-border-default rounded-[14px] min-h-[400px]">
          <AnimatePresence mode="wait">
            {job ? (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <h3 className="text-base font-bold font-mono text-text-primary mb-5 pb-3.5 border-b border-border-default">{job.id}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { l: 'Status', v: <StatusBadge status={job.status} /> },
                    { l: 'Template', v: <span className="text-[13px] text-text-secondary">{job.template}</span> },
                    { l: 'Created', v: <span className="text-[13px] text-text-secondary">{job.createdAt}</span> },
                    { l: 'PDF', v: job.pdfUrl ? <a href={job.pdfUrl} className="text-[13px] text-accent font-semibold hover:text-accent-hover">Download ↓</a> : <span className="text-xs text-text-muted">Not available</span> },
                  ].map((d) => (
                    <div key={d.l} className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{d.l}</span>
                      {d.v}
                    </div>
                  ))}
                </div>

                {job.ats && (
                  <div className="pt-5 border-t border-border-default">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-text-primary">ATS Score</span>
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="text-[32px] font-extrabold text-success tracking-tight"
                      >
                        {job.ats.total}
                      </motion.span>
                    </div>
                    <AtsBar score={job.ats.breakdown.skills} label="Skills" />
                    <AtsBar score={job.ats.breakdown.experience} label="Experience" />
                    <AtsBar score={job.ats.breakdown.summary} label="Summary" />
                    <AtsBar score={job.ats.breakdown.structure} label="Structure" />
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
    </motion.div>
  );
}
