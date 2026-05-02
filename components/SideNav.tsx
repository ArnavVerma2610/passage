'use client';

import { usePathname, useRouter } from 'next/navigation';
import { COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const TABS = [
  { key: 'discover', label: 'Discover', href: '/discover' },
  { key: 'trips', label: 'Trips', href: '/trips' },
  { key: 'chat', label: 'Chat', href: '/chat' },
  { key: 'profile', label: 'Profile', href: '/profile' },
] as const;

function tabFromPathname(p: string): string {
  if (p.startsWith('/discover') || p.startsWith('/trip/')) return 'discover';
  if (p.startsWith('/trips')) return 'trips';
  if (p.startsWith('/chat')) return 'chat';
  if (p.startsWith('/profile')) return 'profile';
  return '';
}

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const passport = usePassageStore(s => s.passport);
  const active = tabFromPathname(pathname);
  const country = COUNTRIES_ACCESS[passport];

  return (
    <div className="flex h-full w-full flex-col border-r border-ghost font-mono">
      <div className="border-b border-ghost px-6 pb-5 pt-6">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-fg">PASSAGE</div>
        <div className="mt-1 text-[0.625rem] tracking-[0.05em] text-faint">
          Calibrated to your passport
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.push(tab.href)}
              className={`mb-0.5 block w-full cursor-pointer border-l-2 px-[22px] py-[11px] text-left font-mono text-xs uppercase tracking-[0.12em] transition-all ${
                isActive
                  ? 'border-fg bg-surface text-fg'
                  : 'border-transparent bg-transparent text-faint hover:text-dim'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {country && (
        <div className="border-t border-ghost px-6 py-4">
          <div className="mb-1.5 text-[0.5625rem] uppercase tracking-[0.12em] text-faint">
            Passport
          </div>
          <div className="text-[0.8125rem] text-sub">{country.name}</div>
          <div className="relative mt-1.5 h-px w-full bg-ghost">
            <div
              className="absolute left-0 top-0 h-px bg-faint"
              style={{ width: `${country.score}%` }}
            />
          </div>
          <div className="mt-1 text-[0.625rem] text-faint">{country.score}/100 mobility</div>
        </div>
      )}
    </div>
  );
}
