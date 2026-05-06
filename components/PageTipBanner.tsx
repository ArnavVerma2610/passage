'use client';

import { useState, type ReactNode } from 'react';

interface PageTipBannerProps {
  storageKey: string;
  eyebrow: string;
  title: string;
  detail?: string;
  right?: ReactNode;
  sticky?: boolean;
}

export default function PageTipBanner({
  storageKey,
  eyebrow,
  title,
  detail,
  right,
  sticky = true,
}: PageTipBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    setCollapsed(next => !next);
  };

  return (
    <div
      data-tip-key={storageKey}
      className={`${sticky ? 'sticky top-0 z-10' : ''} border-b border-ghost bg-bg px-6 ${
        collapsed ? 'py-3' : 'pb-5 pt-6'
      }`}
    >
      <div className="mx-auto flex max-w-[720px] items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </div>
          <div className="text-base leading-snug text-fg">{title}</div>
          {!collapsed && detail && <div className="mt-1 text-[0.6875rem] text-faint">{detail}</div>}
        </div>
        {!collapsed && right && <div className="shrink-0 text-right">{right}</div>}
        <button
          type="button"
          onClick={toggle}
          className="shrink-0 cursor-pointer border border-ghost bg-transparent px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-faint"
          aria-expanded={!collapsed}
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>
    </div>
  );
}
