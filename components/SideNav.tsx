'use client';

import { usePathname, useRouter } from 'next/navigation';
import { c, MONO, COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const TABS = [
  { key: 'discover', label: 'Discover', href: '/discover' },
  { key: 'trips',    label: 'Trips',    href: '/trips' },
  { key: 'chat',     label: 'Chat',     href: '/chat' },
  { key: 'profile',  label: 'Profile',  href: '/profile' },
] as const;

function tabFromPathname(p: string): string {
  if (p.startsWith('/discover') || p.startsWith('/trip/')) return 'discover';
  if (p.startsWith('/trips')) return 'trips';
  if (p.startsWith('/chat')) return 'chat';
  if (p.startsWith('/profile')) return 'profile';
  return '';
}

export default function SideNav() {
  const router   = useRouter();
  const pathname = usePathname();
  const passport = usePassageStore(s => s.passport);
  const active   = tabFromPathname(pathname);
  const country  = COUNTRIES_ACCESS[passport];

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${c.ghost}`, fontFamily: MONO,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${c.ghost}` }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.fg }}>PASSAGE</div>
        <div style={{ fontSize: '0.625rem', color: c.faint, marginTop: 4, letterSpacing: '0.05em' }}>
          Calibrated to your passport
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: isActive ? c.surface : 'none',
                border: 'none',
                borderLeft: `2px solid ${isActive ? c.fg : 'transparent'}`,
                padding: '11px 22px',
                cursor: 'pointer', fontFamily: MONO,
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: isActive ? c.fg : c.faint,
                transition: 'all 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = c.dim; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = c.faint; }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Passport info */}
      {country && (
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.ghost}` }}>
          <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Passport</div>
          <div style={{ fontSize: '0.8125rem', color: c.sub }}>{country.name}</div>
          <div style={{ marginTop: 6, width: '100%', height: 1, background: c.ghost, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: 1, width: `${country.score}%`, background: c.faint }} />
          </div>
          <div style={{ fontSize: '0.625rem', color: c.faint, marginTop: 4 }}>{country.score}/100 mobility</div>
        </div>
      )}
    </div>
  );
}
