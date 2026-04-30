'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, type Transition, type TargetAndTransition } from 'framer-motion';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import FontSizeModal from './FontSizeModal';

const NAV_ROOTS = ['/discover', '/trips', '/chat', '/profile', '/trip'];
const isDetail  = (p: string) => p.startsWith('/trip/');

function entryFrom(curr: string, prev: string): TargetAndTransition {
  if (!isDetail(prev) && isDetail(curr)) return { opacity: 0, y: 16 };
  if (isDetail(prev) && !isDetail(curr)) return { opacity: 0, y: -8 };
  return { opacity: 0 };
}

function enterTransition(curr: string, prev: string): Transition {
  return isDetail(curr) || isDetail(prev)
    ? { type: 'spring', stiffness: 400, damping: 36 }
    : { duration: 0.14, ease: 'easeOut' };
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevRef  = useRef(pathname);

  const initial    = entryFrom(pathname, prevRef.current);
  const transition = enterTransition(pathname, prevRef.current);

  useEffect(() => { prevRef.current = pathname; }, [pathname]);

  const showNav = NAV_ROOTS.some(r => pathname.startsWith(r));

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* Font size picker — overlay, shown once on first visit */}
      <FontSizeModal />

      {showNav ? (
        /* ── authenticated layout: sidebar (md+) + content ── */
        <div className="md:flex md:min-h-screen">
          <aside className="hidden md:block md:w-52 lg:w-56 shrink-0 sticky top-0 h-screen overflow-y-auto">
            <SideNav />
          </aside>

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={pathname} initial={initial} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={transition}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      ) : (
        /* ── unauthenticated layout: full-width centered ── */
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={initial} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={transition}>
            {children}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Bottom tab bar — mobile only */}
      {showNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
