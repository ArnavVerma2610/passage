'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { c, MONO } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

export default function ChatPage() {
  const router = useRouter();
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport     = usePassageStore(s => s.passport);
  const saved        = usePassageStore(s => s.swipedDestinations).filter(s => s.dir === 'right');

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${c.ghost}` }}>
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.faint, marginBottom: 5 }}>Chat</div>
        <div style={{ fontSize: '1rem', color: c.fg }}>Group matching</div>
        <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 4 }}>
          Find travelers attempting the same crossing from a different passport
        </div>
      </div>

      <div style={{ maxWidth: 560, padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '0.5625rem', letterSpacing: '0.12em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>How it works</div>
          {[
            ['Save a destination', 'Hit + on any destination in Discover. That signals your intent.'],
            ['Get matched', 'We find travelers from different passports aiming at the same place.'],
            ['Group chat unlocks', 'A shared thread opens — compare visa strategies, coordinate timing.'],
            ['The crossing is the point', 'The conversation is between people navigating different bureaucracies toward the same place.'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 20, height: 20, border: `1px solid ${c.ghost}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5625rem', color: c.faint, marginTop: 2 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: c.sub, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {saved.length === 0 ? (
          <div style={{ padding: '20px', border: `1px solid ${c.ghost}`, background: c.surface }}>
            <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, marginBottom: 16 }}>
              Save at least one destination to enable group matching.
            </div>
            <button
              onClick={() => router.push('/discover')}
              style={{ background: 'none', border: `1px solid ${c.ghost}`, color: c.dim, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', cursor: 'pointer' }}
            >
              Go to Discover →
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px', border: `1px solid ${c.ghost}` }}>
            <div style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>Matching in progress</div>
            <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6 }}>
              You have {saved.length} destination{saved.length > 1 ? 's' : ''} queued for matching.
              Group chats will appear here when travelers from compatible passports save the same destinations.
            </div>
            <div style={{ marginTop: 14, fontSize: '0.625rem', color: c.faint, fontStyle: 'italic' }}>
              This feature is in development. You'll get a notification when a match is found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
