'use client';

import { useSidebar } from './SidebarContext';

export function MobileHeader() {
  const { toggle } = useSidebar();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-bg-secondary/95 backdrop-blur-md border-b border-border-default flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg bg-bg-tertiary border border-border-default"
          aria-label="Toggle menu"
        >
          <span className="block w-4 h-[2px] bg-text-secondary rounded-full" />
          <span className="block w-4 h-[2px] bg-text-secondary rounded-full" />
          <span className="block w-3 h-[2px] bg-text-secondary rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xs text-white">◆</span>
          </div>
          <span className="text-sm font-bold text-text-primary">ResumeForge</span>
        </div>
      </div>
    </header>
  );
}
