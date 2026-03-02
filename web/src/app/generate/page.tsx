'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { generatePdf, getTemplates, type Template } from '@/lib/api';

/* ── Types ──────────────────────────────────────────── */

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface Education {
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ResumeForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

const EMPTY_EXPERIENCE: Experience = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [''],
};

const EMPTY_EDUCATION: Education = {
  degree: '',
  institution: '',
  startDate: '',
  endDate: '',
  gpa: '',
};

const DEFAULT_FORM: ResumeForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  skills: [],
  experience: [{ ...EMPTY_EXPERIENCE, bullets: [''] }],
  education: [{ ...EMPTY_EDUCATION }],
};

/* ── Skill Tag Input ───────────────────────────────── */

function SkillInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !skills.includes(v)) {
      onChange([...skills, v]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
        <AnimatePresence>
          {skills.map((s) => (
            <motion.span
              key={s}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent-soft px-2.5 py-1 rounded-full"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(skills.filter((x) => x !== s))}
                className="text-accent/60 hover:text-accent text-sm leading-none ml-0.5"
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder="Type a skill and press Enter"
        className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] placeholder:text-text-muted"
      />
    </div>
  );
}

/* ── Section Header ────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4 mt-7 first:mt-0">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

/* ── Input Field ───────────────────────────────────── */

const inputClass =
  'w-full px-3.5 py-2.5 bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] placeholder:text-text-muted';

/* ── Main Page ─────────────────────────────────────── */

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" /></div>}>
      <GeneratePageInner />
    </Suspense>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<ResumeForm>(DEFAULT_FORM);
  const [template, setTemplate] = useState(searchParams.get('template') || 'default-resume');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [result, setResult] = useState<{ jobId?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    getTemplates(1, 50)
      .then((r) => setTemplates(r.templates))
      .catch(() => {});
  }, []);

  const handleTemplateChange = (slug: string) => {
    setTemplate(slug);
    router.replace(`/generate?template=${encodeURIComponent(slug)}`, { scroll: false });
  };

  /* Update helpers */
  const set = <K extends keyof ResumeForm>(key: K, val: ResumeForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const updateExp = (i: number, patch: Partial<Experience>) =>
    set(
      'experience',
      form.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );

  const updateEdu = (i: number, patch: Partial<Education>) =>
    set(
      'education',
      form.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );

  const addBullet = (expIdx: number) =>
    updateExp(expIdx, { bullets: [...form.experience[expIdx].bullets, ''] });

  const updateBullet = (expIdx: number, bulletIdx: number, val: string) =>
    updateExp(expIdx, {
      bullets: form.experience[expIdx].bullets.map((b, j) => (j === bulletIdx ? val : b)),
    });

  const removeBullet = (expIdx: number, bulletIdx: number) =>
    updateExp(expIdx, {
      bullets: form.experience[expIdx].bullets.filter((_, j) => j !== bulletIdx),
    });

  /* Submit */
  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const resumeData: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        summary: form.summary,
        skills: form.skills,
        experience: form.experience
          .filter((e) => e.title || e.company)
          .map((e) => ({
            ...e,
            endDate: e.endDate || null,
            bullets: e.bullets.filter(Boolean),
          })),
        education: form.education
          .filter((e) => e.degree || e.institution)
          .map((e) => ({
            ...e,
            endDate: e.endDate || null,
          })),
      };
      const data = await generatePdf(template, resumeData, notifyEmail);
      setResult({ jobId: data.jobId });
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-7">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Generate PDF</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Fill in the resume details and generate an ATS-optimized PDF
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 xl:gap-6 items-start">
        {/* ── Resume Form ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-bg-card border border-border-default rounded-[14px] p-5 sm:p-6"
        >
          {/* Personal Info */}
          <SectionHeader icon="👤" title="Personal Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="San Francisco, CA"
                className={inputClass}
              />
            </div>
          </div>

          {/* Summary */}
          <SectionHeader icon="📝" title="Professional Summary" />
          <textarea
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Experienced software engineer with 8+ years building scalable systems..."
            rows={3}
            className={`${inputClass} resize-y min-h-[80px]`}
          />

          {/* Skills */}
          <SectionHeader icon="🛠" title="Skills" />
          <SkillInput skills={form.skills} onChange={(s) => set('skills', s)} />

          {/* Experience */}
          <SectionHeader
            icon="💼"
            title="Experience"
            action={
              <button
                type="button"
                onClick={() =>
                  set('experience', [...form.experience, { ...EMPTY_EXPERIENCE, bullets: [''] }])
                }
                className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                + Add Position
              </button>
            }
          />
          <div className="space-y-4">
            <AnimatePresence>
              {form.experience.map((exp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-bg-tertiary/50 border border-border-default rounded-[10px] p-4 relative"
                >
                  {form.experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          'experience',
                          form.experience.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute top-3 right-3 text-text-muted hover:text-error text-sm transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExp(i, { title: e.target.value })}
                      placeholder="Job Title"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExp(i, { company: e.target.value })}
                      placeholder="Company"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExp(i, { location: e.target.value })}
                      placeholder="Location"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateExp(i, { startDate: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, { endDate: e.target.value })}
                        placeholder="Present"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
                    Key Achievements
                  </label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex gap-2 mb-1.5">
                      <span className="text-text-muted text-xs mt-3 shrink-0">•</span>
                      <input
                        type="text"
                        value={b}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        placeholder="Describe an achievement..."
                        className={`${inputClass} flex-1`}
                      />
                      {exp.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBullet(i, bi)}
                          className="text-text-muted hover:text-error text-xs mt-2.5 shrink-0 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBullet(i)}
                    className="text-[11px] text-accent hover:text-accent-hover font-medium mt-1 transition-colors"
                  >
                    + Add bullet
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Education */}
          <SectionHeader
            icon="🎓"
            title="Education"
            action={
              <button
                type="button"
                onClick={() => set('education', [...form.education, { ...EMPTY_EDUCATION }])}
                className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                + Add Education
              </button>
            }
          />
          <div className="space-y-4">
            <AnimatePresence>
              {form.education.map((edu, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-bg-tertiary/50 border border-border-default rounded-[10px] p-4 relative"
                >
                  {form.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          'education',
                          form.education.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute top-3 right-3 text-text-muted hover:text-error text-sm transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEdu(i, { degree: e.target.value })}
                      placeholder="Degree (e.g. B.S. Computer Science)"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEdu(i, { institution: e.target.value })}
                      placeholder="Institution"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => updateEdu(i, { startDate: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) => updateEdu(i, { endDate: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => updateEdu(i, { gpa: e.target.value })}
                      placeholder="GPA (e.g. 3.8)"
                      className={inputClass}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Config Sidebar ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="xl:sticky xl:top-8 space-y-5"
        >
          <div className="bg-bg-card border border-border-default rounded-[14px] p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold text-text-primary mb-5 pb-3 border-b border-border-default">
              Configuration
            </h3>

            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%236b7280%27%20stroke-width=%272%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-9`}
            >
              {templates.length > 0 ? (
                templates.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="default-resume">Default Resume</option>
                  <option value="modern-resume">Modern Resume</option>
                </>
              )}
            </select>

            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mt-4 mb-1">
              Notify Email (optional)
            </label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              className={inputClass}
            />

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading || !form.name}
              className="w-full mt-6 py-3.5 px-5 bg-gradient-to-br from-accent to-purple-500 text-white text-sm font-semibold font-sans border-none rounded-[10px] cursor-pointer shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>⬡ Generate PDF</>
              )}
            </motion.button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`mt-4 p-3.5 rounded-[10px] text-[13px] leading-relaxed border ${
                    result.error
                      ? 'bg-error-soft text-error border-error/20'
                      : 'bg-success-soft text-success border-success/20'
                  }`}
                >
                  {result.error ? (
                    <p>Error: {result.error}</p>
                  ) : (
                    <p>
                      Job created! ID:{' '}
                      <code className="bg-success/15 px-1.5 py-0.5 rounded font-mono text-xs">
                        {result.jobId}
                      </code>
                      <br />
                      <a
                        href="/jobs"
                        className="text-success font-semibold underline"
                      >
                        Track progress →
                      </a>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick tips */}
          <div className="bg-bg-card border border-border-default rounded-[14px] p-5">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
              Tips for a high ATS score
            </h4>
            <ul className="space-y-2 text-[12px] text-text-secondary leading-relaxed">
              <li className="flex gap-2">
                <span className="text-success shrink-0">✓</span>
                Include 5-10 relevant skills matching the job description
              </li>
              <li className="flex gap-2">
                <span className="text-success shrink-0">✓</span>
                Use action verbs and quantify achievements in bullets
              </li>
              <li className="flex gap-2">
                <span className="text-success shrink-0">✓</span>
                Write a concise professional summary (2-3 sentences)
              </li>
              <li className="flex gap-2">
                <span className="text-success shrink-0">✓</span>
                List experience in reverse chronological order
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
