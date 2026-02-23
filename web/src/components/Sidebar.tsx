'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◈' },
  { href: '/generate', label: 'Generate PDF', icon: '⬡' },
  { href: '/templates', label: 'Templates', icon: '❖' },
  { href: '/jobs', label: 'Jobs', icon: '⟐' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-bg-secondary border-r border-border-default flex flex-col py-5 px-3.5 z-50 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2.5 pb-6 border-b border-border-default mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-[10px] flex items-center justify-center shadow-glow">
          <span className="text-xl text-white">◆</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary tracking-tight">ResumeForge</h1>
          <p className="text-[11px] text-text-tertiary font-medium tracking-widest uppercase">PDF Generation SaaS</p>
        </div>
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

      {/* Footer */}
      <div className="pt-4 border-t border-border-default">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary px-3 py-2 bg-bg-tertiary rounded-[10px] mb-1.5">
          <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          Free Plan
        </div>
        <p className="text-[11px] text-text-tertiary px-3">42 / 100 PDFs used</p>
      </div>
    </aside>
  );
}
