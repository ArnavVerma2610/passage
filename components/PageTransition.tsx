'use client';

import { useState } from 'react';
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'framer-motion';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import FontSizeModal from './FontSizeModal';
import { usePassageStore } from '@/lib/store';

const NAV_ROOTS = ['/discover', '/trips', '/chat', '/profile', '/trip'];
const isDetail = (p: string) => p.startsWith('/trip/');

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

function GestureScaleFrame({ children }: { children: React.ReactNode }) {
  const scale = usePassageStore(s => s.gestureScale);

  if (Math.abs(scale - 1) < 0.01) return <>{children}</>;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: `${100 / scale}%`,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track the previous path as state so the entry transition for a new route
  // can be derived from the route it's replacing. Updating state during render
  // when the input changes is the React-recommended "deriving state" pattern.
  const [snapshot, setSnapshot] = useState({ curr: pathname, prev: pathname });
  if (snapshot.curr !== pathname) {
    setSnapshot({ curr: pathname, prev: snapshot.curr });
  }

  const initial = entryFrom(pathname, snapshot.prev);
  const transition = enterTransition(pathname, snapshot.prev);

  const showNav = NAV_ROOTS.some(r => pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <FontSizeModal />

      {showNav ? (
        <div className="md:flex md:min-h-screen">
          <aside className="sticky top-0 hidden h-screen shrink-0 overflow-y-auto md:block md:w-52 lg:w-56">
            <SideNav />
          </aside>

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={initial}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={transition}
              >
                <GestureScaleFrame>{children}</GestureScaleFrame>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={initial}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <GestureScaleFrame>{children}</GestureScaleFrame>
          </motion.div>
        </AnimatePresence>
      )}

      {showNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
