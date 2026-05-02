'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const TAB_ROUTES: Record<string, string> = {
  discover: '/discover',
  trips: '/trips',
  chat: '/chat',
  profile: '/profile',
};

function tabFromPathname(pathname: string): string {
  if (pathname.startsWith('/discover') || pathname.startsWith('/trip/')) return 'discover';
  if (pathname.startsWith('/trips')) return 'trips';
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'discover';
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const passport = usePassageStore(s => s.passport);
  const activeTab = usePassageStore(s => s.activeTab);
  const setActiveTab = usePassageStore(s => s.setActiveTab);

  useEffect(() => {
    setActiveTab(tabFromPathname(pathname));
  }, [pathname, setActiveTab]);

  const items = [
    { key: 'discover', label: 'Discover' },
    { key: 'trips', label: 'Trips' },
    { key: 'chat', label: 'Chat' },
    { key: 'profile', label: COUNTRIES_ACCESS[passport]?.code || 'You' },
  ];

  return (
    <div
      className="fixed bottom-0 left-1/2 z-[200] flex w-full -translate-x-1/2 border-t border-ghost bg-bg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(it => {
        const active = activeTab === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              setActiveTab(it.key);
              router.push(TAB_ROUTES[it.key]);
            }}
            className={`-mt-px flex-1 cursor-pointer border-0 border-t bg-transparent px-0 pb-3 pt-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-all ${
              active ? 'border-fg text-fg' : 'border-transparent text-faint'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
