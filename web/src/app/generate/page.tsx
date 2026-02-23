'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const SAMPLE_RESUME = JSON.stringify(
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary:
      'Senior Software Engineer with 8+ years of experience building scalable web applications and distributed systems. Passionate about clean architecture and mentoring.',
    skills: ['TypeScript', 'Node.js', 'React', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL', 'Redis'],
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'Acme Corp',
        location: 'San Francisco, CA',
        startDate: '2021-03-01',
        endDate: null,
        bullets: [
          'Led migration of monolith to microservices, reducing deployment time by 70%',
          'Designed event-driven architecture handling 50K events/sec',
          'Mentored team of 5 junior engineers',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        startDate: '2018-06-01',
        endDate: '2021-02-28',
        bullets: [
          'Built real-time collaboration features for 100K+ users',
          'Implemented CI/CD pipeline reducing release cycles from 2 weeks to 2 hours',
        ],
      },
    ],
    education: [
      { degree: 'B.S. Computer Science', institution: 'MIT', startDate: '2012-09-01', endDate: '2016-05-15', gpa: '3.8' },
    ],
  },
  null,
  2,
);

export default function GeneratePage() {
  const [template, setTemplate] = useState('default-resume');
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [jsonData, setJsonData] = useState(SAMPLE_RESUME);
  const [result, setResult] = useState<{ jobId?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const parsed = JSON.parse(jsonData);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${baseUrl}/v1/generate/${template}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ resumeData: parsed, notifyEmail: email || undefined }),
      });
      const data = await res.json();
      setResult(res.ok ? { jobId: data.jobId } : { error: data.error || 'Something went wrong' });
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
        <p className="text-sm text-text-tertiary mt-1">Create an ATS-optimized resume PDF from JSON data</p>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-6 items-start max-lg:grid-cols-1">
        {/* Config Panel */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="sticky top-8 bg-bg-card border border-border-default rounded-[14px] p-6"
        >
          <h3 className="text-[15px] font-semibold text-text-primary mb-5 pb-3 border-b border-border-default">Configuration</h3>

          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">API Key</label>
          <input
            type="text"
            placeholder="pk_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] placeholder:text-text-muted"
          />

          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mt-4 mb-1.5">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%236b7280%27%20stroke-width=%272%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-9 transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
          >
            <option value="default-resume">Default Resume</option>
            <option value="modern-resume">Modern Resume</option>
          </select>

          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mt-4 mb-1.5">Notify Email (optional)</label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] placeholder:text-text-muted"
          />

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading || !apiKey}
            className="w-full mt-6 py-3.5 px-5 bg-gradient-to-br from-accent to-purple-500 text-white text-sm font-semibold font-sans border-none rounded-[10px] cursor-pointer shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>⬡ Generate PDF</>
            )}
          </motion.button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
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
                  Job created! ID: <code className="bg-success/15 px-1.5 py-0.5 rounded font-mono text-xs">{result.jobId}</code>
                  <br />
                  <a href="/jobs" className="text-success font-semibold underline">Track progress →</a>
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* JSON Editor */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="sticky top-8 bg-bg-card border border-border-default rounded-[14px] p-6"
        >
          <h3 className="text-[15px] font-semibold text-text-primary mb-5 pb-3 border-b border-border-default">Resume JSON Data</h3>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[520px] p-4 bg-bg-input border border-border-default rounded-[10px] text-text-primary font-mono text-[12.5px] leading-[1.7] resize-y outline-none tab-[2] transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
