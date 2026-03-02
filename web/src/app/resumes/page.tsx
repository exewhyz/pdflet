'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { listJobs, type Job } from '@/lib/api';

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

function AtsRing({ score }: { score: number }) {
  const color =
    score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-error)';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle
          cx="20" cy="20" r="18"
          fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3"
        />
        <motion.circle
          cx="20" cy="20" r="18"
          fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export default function ResumesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Filters */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [filterAts, setFilterAts] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ats-high' | 'ats-low'>('newest');

  /* Debounce search */
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchResumes = useCallback(async () => {
    setError(null);
    try {
      const data = await listJobs(1, 100);
      setJobs(data.jobs.filter((j) => j.status === 'completed' && j.pdfUrl));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
    const handler = () => { setLoading(true); fetchResumes(); };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [fetchResumes]);

  /* Derived data */
  const templateSlugs = Array.from(new Set(jobs.map((j) => j.templateSlug))).sort();

  const searchLower = debouncedSearch.toLowerCase().trim();

  const filteredJobs = jobs
    .filter((j) => {
      if (!searchLower) return true;
      const id = (j.jobId || j._id || '') as string;
      return id.toLowerCase().includes(searchLower) || j.templateSlug.toLowerCase().includes(searchLower);
    })
    .filter((j) => filterTemplate === 'all' || j.templateSlug === filterTemplate)
    .filter((j) => {
      const score = j.atsScore?.total ?? 0;
      if (filterAts === '80+') return score >= 80;
      if (filterAts === '60-79') return score >= 60 && score < 80;
      if (filterAts === '<60') return score < 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'ats-high') return (b.atsScore?.total ?? 0) - (a.atsScore?.total ?? 0);
      if (sortBy === 'ats-low') return (a.atsScore?.total ?? 0) - (b.atsScore?.total ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const selectClass =
    'px-3 py-2 bg-bg-secondary border border-border-default rounded-[10px] text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all cursor-pointer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Resumes</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Your generated resume PDFs — download or share
          </p>
        </div>
        {jobs.length > 0 && (
          <div className="flex items-center gap-2 bg-bg-card border border-border-default rounded-[10px] px-4 py-2.5">
            <span className="text-[22px] font-bold text-text-primary">{filteredJobs.length}</span>
            <span className="text-[11px] text-text-muted uppercase tracking-wide">
              of {jobs.length} Resume{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      {!loading && jobs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3.5 bg-bg-card border border-border-default rounded-[12px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or template…"
            className={`${selectClass} min-w-[200px]`}
          />

          <span className="w-px h-6 bg-border-default" />

          <select value={filterTemplate} onChange={(e) => setFilterTemplate(e.target.value)} className={selectClass}>
            <option value="all">All Templates</option>
            {templateSlugs.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={filterAts} onChange={(e) => setFilterAts(e.target.value)} className={selectClass}>
            <option value="all">Any ATS Score</option>
            <option value="80+">80+ (High)</option>
            <option value="60-79">60–79 (Medium)</option>
            <option value="<60">&lt;60 (Low)</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={selectClass}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="ats-high">ATS Score ↓</option>
            <option value="ats-low">ATS Score ↑</option>
          </select>

          {(filterTemplate !== 'all' || filterAts !== 'all' || search) && (
            <button
              onClick={() => { setFilterTemplate('all'); setFilterAts('all'); setSearch(''); }}
              className="text-[12px] text-accent hover:text-accent-hover font-medium ml-auto transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

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
          <span className="text-[40px] opacity-40">📄</span>
          <p className="text-text-secondary text-sm">
            No resumes yet. Generate a PDF to see it here!
          </p>
          <a
            href="/generate"
            className="text-[13px] text-accent font-semibold hover:text-accent-hover transition-colors"
          >
            Generate PDF →
          </a>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-3">
          <span className="text-[40px] opacity-40">🔍</span>
          <p className="text-text-secondary text-sm">No resumes match your filters</p>
          <button
            onClick={() => { setFilterTemplate('all'); setFilterAts('all'); setSearch(''); }}
            className="text-[13px] text-accent font-semibold hover:text-accent-hover transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredJobs.map((job, i) => {
              const jobId = (job.jobId || job._id) as string;
              return (
                <motion.div
                  key={jobId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden transition-all hover:border-border-light hover:bg-bg-card-hover hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                >
                  {/* PDF Preview */}
                  <a
                    href={job.pdfUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative h-[200px] bg-white border-b border-border-default overflow-hidden cursor-pointer group"
                  >
                    <iframe
                      src={`${job.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      title="PDF preview"
                      className="w-full h-[500px] pointer-events-none scale-[0.6] origin-top-left"
                      style={{ width: '167%' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-transparent group-hover:bg-accent/5 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-semibold text-accent bg-bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border-default">
                        Open PDF ↗
                      </span>
                    </div>
                  </a>

                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-border-default flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] font-semibold text-text-primary truncate">
                        {jobId.length > 14 ? `${jobId.slice(0, 14)}…` : jobId}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">{job.templateSlug}</p>
                    </div>
                    {job.atsScore?.total && <AtsRing score={job.atsScore.total} />}
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4">
                    {job.atsScore?.breakdown && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        {Object.entries(job.atsScore.breakdown).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-[11px] text-text-muted capitalize">{key}</span>
                            <span
                              className="text-[11px] font-semibold"
                              style={{
                                color:
                                  val >= 80
                                    ? 'var(--color-success)'
                                    : val >= 60
                                      ? 'var(--color-warning)'
                                      : 'var(--color-error)',
                              }}
                            >
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-border-default">
                      <span className="text-[11px] text-text-muted">{timeAgo(job.createdAt)}</span>
                      <a
                        href={job.pdfUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors"
                      >
                        Download PDF ↓
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
