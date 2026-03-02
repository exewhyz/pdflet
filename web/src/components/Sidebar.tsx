'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSidebar } from './SidebarContext';
import {
  getProject,
  listProjects,
  createProjectApi,
  setActiveApiKey,
  type ProjectInfo,
  type ProjectListItem,
} from '@/lib/api';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◈' },
  { href: '/generate', label: 'Generate PDF', icon: '⬡' },
  { href: '/templates', label: 'Templates', icon: '❖' },
  { href: '/resumes', label: 'Resumes', icon: '📄' },
  { href: '/jobs', label: 'Jobs', icon: '⟐' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [project, setProject] = useState<ProjectInfo | null>(null);

  /* Org switcher state */
  const [orgs, setOrgs] = useState<ProjectListItem[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadProject = useCallback(() => {
    getProject()
      .then(setProject)
      .catch(() => setProject(null));
  }, []);

  const loadOrgs = useCallback(() => {
    listProjects()
      .then((r) => setOrgs(r.projects))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProject();
    loadOrgs();
    const handler = () => {
      loadProject();
      loadOrgs();
    };
    window.addEventListener('rf_project_changed', handler);
    return () => window.removeEventListener('rf_project_changed', handler);
  }, [loadProject, loadOrgs]);

  const switchOrg = (org: ProjectListItem) => {
    if (org.apiKey) {
      setActiveApiKey(org.apiKey);
      setShowSwitcher(false);
    }
  };

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createProjectApi(newOrgName.trim());
      setActiveApiKey(result.apiKey.key);
      setNewOrgName('');
      setShowCreate(false);
      setShowSwitcher(false);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const planLabel = project
    ? project.plan === 'free'
      ? 'Free Plan'
      : project.plan.charAt(0).toUpperCase() + project.plan.slice(1) + ' Plan'
    : 'Free Plan';
  const usageCount = project?.usageCount ?? 0;
  const usageLimit = project?.usageLimits?.maxPdfsPerMonth ?? 100;

  return (
    <>
      {/* Overlay — mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          w-[260px] h-screen fixed left-0 top-0 bg-bg-secondary border-r border-border-default
          flex flex-col py-5 px-3.5 z-50 overflow-y-auto
          transition-transform duration-300 ease-out
          max-lg:-translate-x-full max-lg:shadow-[4px_0_24px_rgba(0,0,0,0.5)]
          ${isOpen ? 'max-lg:translate-x-0' : ''}
        `}
      >
        {/* Brand + Org Switcher */}
        <div className="relative pb-6 border-b border-border-default mb-5">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center gap-3 px-2.5 w-full text-left rounded-[10px] py-2 -my-2 hover:bg-bg-tertiary transition-colors group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-[10px] flex items-center justify-center shadow-glow shrink-0">
              <span className="text-xl text-white">◆</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-text-primary tracking-tight truncate">
                {project?.name || 'ResumeForge'}
              </h1>
              <p className="text-[11px] text-text-tertiary font-medium tracking-widest uppercase">
                PDF Generation SaaS
              </p>
            </div>
            <span className="text-text-muted text-xs group-hover:text-text-secondary transition-colors shrink-0">
              {showSwitcher ? '▲' : '▼'}
            </span>
          </button>

          {/* Org Dropdown */}
          <AnimatePresence>
            {showSwitcher && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 bg-bg-card border border-border-default rounded-[12px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              >
                <div className="max-h-[200px] overflow-y-auto">
                  {orgs.map((org) => {
                    const isCurrent = project?.id === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => !isCurrent && switchOrg(org)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors border-b border-border-default last:border-b-0
                          ${isCurrent
                            ? 'bg-accent-soft text-accent font-semibold cursor-default'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary cursor-pointer'
                          }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-xs font-bold shrink-0
                            ${isCurrent
                              ? 'bg-accent text-white'
                              : 'bg-bg-tertiary text-text-muted'
                            }`}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{org.name}</p>
                          <p className="text-[10px] text-text-muted">{org.plan} · {org.usageCount} PDFs</p>
                        </div>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Create Org */}
                {!showCreate ? (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-accent hover:bg-accent-soft transition-colors border-t border-border-default"
                  >
                    <span className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-accent-soft text-accent text-sm font-bold">+</span>
                    Create Organization
                  </button>
                ) : (
                  <div className="p-3 border-t border-border-default space-y-2">
                    {createError && (
                      <p className="text-[11px] text-error">{createError}</p>
                    )}
                    <input
                      type="text"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="Organization name"
                      autoFocus
                      className="w-full px-3 py-2 bg-bg-secondary border border-border-default rounded-[8px] text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowCreate(false); setCreateError(null); setNewOrgName(''); }}
                        className="flex-1 px-3 py-1.5 text-[12px] text-text-secondary bg-bg-tertiary rounded-[8px] hover:bg-bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={creating || !newOrgName.trim()}
                        className="flex-1 px-3 py-1.5 text-[12px] font-semibold text-white bg-accent rounded-[8px] hover:bg-accent-hover disabled:opacity-40 transition-colors"
                      >
                        {creating ? '…' : 'Create'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.2px] px-3 mb-2">Menu</p>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 py-[11px] px-3.5 rounded-[10px] text-sm font-medium relative mb-0.5 transition-all duration-200
                  ${isActive
                    ? 'text-accent-hover bg-accent-soft'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
              >
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — real project data */}
        <div className="pt-4 border-t border-border-default">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary px-3 py-2 bg-bg-tertiary rounded-[10px] mb-1.5">
            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            {planLabel}
          </div>
          <p className="text-[11px] text-text-tertiary px-3">
            {usageCount} / {usageLimit} PDFs used
          </p>
        </div>
      </aside>
    </>
  );
}
