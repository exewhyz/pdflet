'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getProject,
  listProjects,
  createProjectApi,
  updateProject,
  deleteProjectApi,
  setActiveApiKey,
  type ProjectInfo,
  type ProjectListItem,
} from '@/lib/api';

export default function SettingsPage() {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  /* Create org state */
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  /* Saving state */
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [projectData, projectsList] = await Promise.all([
        getProject().catch(() => null),
        listProjects().catch(() => ({ projects: [], total: 0 })),
      ]);
      if (projectData) {
        setProject(projectData);
        setWebhookUrl(projectData.webhookUrl || '');
      }
      setProjects(projectsList.projects);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => { setLoading(true); loadData(); };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [loadData]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreatedKey(null);
    try {
      const result = await createProjectApi(newName.trim());
      setCreatedKey(result.apiKey.key);
      // auto-switch to the new project
      setActiveApiKey(result.apiKey.key);
      setNewName('');
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = (fullApiKey: string | null) => {
    if (!fullApiKey) return;
    setActiveApiKey(fullApiKey);
  };

  const handleSaveWebhook = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateProject({ webhookUrl });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
      await deleteProjectApi();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const usagePercent = project
    ? Math.round((project.usageCount / project.usageLimits.maxPdfsPerMonth) * 100)
    : 0;

  const planLabels: Record<string, string> = {
    free: 'Free Plan',
    starter: 'Starter Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Manage organisations, API keys, and project configuration
        </p>
      </div>

      {/* ──────── Organisations ──────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-9"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Organisations</h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowCreate(!showCreate); setCreatedKey(null); }}
            className="text-[13px] font-semibold text-accent bg-accent-soft border border-accent/20 px-[18px] py-2 rounded-[10px] cursor-pointer font-sans hover:bg-accent hover:text-white transition-all"
          >
            {showCreate ? 'Cancel' : '+ Create Organisation'}
          </motion.button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-bg-card border border-accent/20 rounded-[14px] p-5">
                <p className="text-sm font-semibold text-text-primary mb-3">New Organisation</p>
                <div className="flex gap-2.5 max-md:flex-col">
                  <input
                    type="text"
                    placeholder="Organisation name (e.g. Acme Corp)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="flex-1 px-3.5 py-[11px] bg-bg-input border border-border-default rounded-[10px] text-text-primary text-[13px] font-sans outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="px-6 py-[11px] bg-accent text-white text-[13px] font-semibold font-sans border-none rounded-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-all whitespace-nowrap"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </motion.button>
                </div>

                {/* Show created key */}
                {createdKey && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-success-soft border border-success/20 rounded-[10px]"
                  >
                    <p className="text-sm font-semibold text-success mb-1.5">
                      ✓ Organisation created! Here&apos;s your API key:
                    </p>
                    <div className="flex items-center gap-2.5">
                      <code className="font-mono text-xs text-text-primary bg-bg-tertiary px-3 py-1.5 rounded-[6px] flex-1 break-all">
                        {createdKey}
                      </code>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyKey(createdKey)}
                        className="text-xs font-semibold text-accent bg-accent-soft border-none px-3.5 py-[5px] rounded-[6px] cursor-pointer font-sans hover:bg-accent hover:text-white transition-all shrink-0"
                      >
                        {copied === createdKey ? '✓ Copied' : 'Copy'}
                      </motion.button>
                    </div>
                    <p className="text-[11px] text-text-tertiary mt-2">
                      Save this key — it won&apos;t be shown again. This project is now active.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects List */}
        <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
          {projects.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="text-[36px] opacity-30 block mb-2">🏢</span>
              <p className="text-sm text-text-tertiary">No organisations yet. Create one above.</p>
            </div>
          ) : (
            projects.map((p, i) => {
              const isCurrent = project?.id === p.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`flex items-center justify-between px-5 py-[18px] border-b border-border-default last:border-b-0 gap-4 max-md:flex-col max-md:items-start max-md:gap-2.5 ${isCurrent ? 'bg-accent-soft/30' : ''}`}
                >
                  <div className="flex flex-col gap-0.5 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{p.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted">
                      {p.stats.totalJobs} jobs · {planLabels[p.plan] || p.plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.apiKeyMasked && (
                      <code className="font-mono text-[11px] text-text-tertiary bg-bg-tertiary px-2 py-1 rounded">
                        {p.apiKeyMasked}
                      </code>
                    )}
                    {!isCurrent && p.apiKey && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSwitch(p.apiKey)}
                        className="text-[11px] font-semibold text-accent bg-accent-soft border border-accent/20 px-3 py-1 rounded-[6px] cursor-pointer font-sans hover:bg-accent hover:text-white transition-all"
                      >
                        Switch
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ──────── Active project settings (only if authenticated) ──────── */}
      {project && (
        <>
          {/* Organisation Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mb-9"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">Active Project</h2>
            <div className="bg-bg-card border border-border-default rounded-[14px] p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Project Name</span>
                  <span className="text-[15px] font-bold text-text-primary">{project.name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Project ID</span>
                  <span className="font-mono text-xs text-text-tertiary">{project.id}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Total Jobs</span>
                  <span className="text-[15px] font-bold text-text-primary">{project.stats.totalJobs}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Completed</span>
                  <span className="text-[15px] font-bold text-success">{project.stats.completedJobs}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* API Keys */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mb-9"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">API Keys</h2>
            <div className="bg-bg-card border border-border-default rounded-[14px] overflow-hidden">
              {project.apiKeys.map((k, i) => (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="flex items-center justify-between px-5 py-[18px] border-b border-border-default last:border-b-0 gap-5 max-md:flex-col max-md:items-start max-md:gap-2.5"
                >
                  <div className="flex flex-col gap-0.5 min-w-[140px]">
                    <span className="text-sm font-semibold text-text-primary">{k.label}</span>
                    <span className="text-[11px] text-text-muted">
                      Created {new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2.5">
                    <code className="font-mono text-xs text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-[6px] tracking-wide">
                      {k.key}
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
                onClick={handleSaveWebhook}
                disabled={saving}
                className="px-6 py-[11px] bg-accent text-white text-[13px] font-semibold font-sans border-none rounded-[10px] cursor-pointer disabled:opacity-50 hover:bg-accent-hover transition-all"
              >
                {saving ? 'Saving...' : saveMsg || 'Save'}
              </motion.button>
            </div>
          </motion.div>

          {/* Plan & Usage */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="mb-9"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">Plan & Usage</h2>
            <div className="bg-bg-card border border-border-default rounded-[14px] p-6 flex items-center gap-7 max-md:flex-col max-md:items-stretch">
              <div className="flex flex-col gap-0.5 min-w-[140px]">
                <span className="text-base font-bold text-text-primary">
                  {planLabels[project.plan] || project.plan}
                </span>
                <span className="text-xs text-text-tertiary">
                  {project.usageLimits.maxPdfsPerMonth} PDFs / month
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
                  />
                </div>
                <span className="text-xs text-text-tertiary">
                  {project.usageCount} / {project.usageLimits.maxPdfsPerMonth} used
                </span>
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
            transition={{ duration: 0.35, delay: 0.3 }}
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
                onClick={handleDelete}
                className="px-5 py-2 bg-error-soft text-error text-[13px] font-semibold font-sans border border-error/20 rounded-[10px] cursor-pointer hover:bg-error hover:text-white transition-all"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </>
      )}

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-error text-white px-5 py-3 rounded-[10px] shadow-lg text-sm font-medium z-50 max-w-sm"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-3 opacity-70 hover:opacity-100 cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
