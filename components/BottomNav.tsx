'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { c, MONO, COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const TAB_ROUTES: Record<string, string> = {
  discover: '/discover',
  trips:    '/trips',
  chat:     '/chat',
  profile:  '/profile',
};

function tabFromPathname(pathname: string): string {
  if (pathname.startsWith('/discover') || pathname.startsWith('/trip/')) return 'discover';
  if (pathname.startsWith('/trips'))   return 'trips';
  if (pathname.startsWith('/chat'))    return 'chat';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'discover';
}

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const passport    = usePassageStore(s => s.passport);
  const activeTab   = usePassageStore(s => s.activeTab);
  const setActiveTab = usePassageStore(s => s.setActiveTab);

  useEffect(() => {
    setActiveTab(tabFromPathname(pathname));
  }, [pathname, setActiveTab]);

  const items = [
    { key: 'discover', label: 'Discover' },
    { key: 'trips',    label: 'Trips' },
    { key: 'chat',     label: 'Chat' },
    { key: 'profile',  label: COUNTRIES_ACCESS[passport]?.code || 'You' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', background: '#000', borderTop: `1px solid ${c.ghost}`,
      display: 'flex', zIndex: 200, padding: '0 0 env(safe-area-inset-bottom)',
    }}>
      {items.map(it => (
        <button
          key={it.key}
          onClick={() => { setActiveTab(it.key); router.push(TAB_ROUTES[it.key]); }}
          style={{
            flex: 1, background: 'none', border: 'none',
            padding: '14px 0 12px', fontFamily: MONO,
            fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            color: activeTab === it.key ? c.fg : c.faint,
            borderTop: activeTab === it.key ? `1px solid ${c.fg}` : '1px solid transparent',
            marginTop: -1, transition: 'all 0.2s',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
