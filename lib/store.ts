import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfileValues, Destination } from './types';

export interface SwipedEntry {
  id: string;
  dir: 'left' | 'right';
}

interface PassageStore {
  // ── persisted ──────────────────────────────────────────────────────────────
  passport: string;
  profile: ProfileValues;
  fontSize: number;         // 14 | 16 | 18 | 20
  fontSizeSet: boolean;     // true after user has explicitly chosen

  // ── session ────────────────────────────────────────────────────────────────
  swipedDestinations: SwipedEntry[];
  selectedDestination: Destination | null;
  activeTab: string;

  // ── hydration flag (not persisted) ─────────────────────────────────────────
  _hasHydrated: boolean;

  // ── actions ────────────────────────────────────────────────────────────────
  setHasHydrated: (v: boolean) => void;
  setPassport: (code: string) => void;
  setProfile: (values: ProfileValues) => void;
  setFontSize: (size: number) => void;
  confirmFontSize: () => void;
  addSwipedDestination: (id: string, dir: 'left' | 'right') => void;
  removeSwipedDestination: (id: string) => void;
  setSelectedDestination: (dest: Destination | null) => void;
  setActiveTab: (tab: string) => void;
  resetOnboarding: () => void;
}

const DEFAULT_PROFILE: ProfileValues = {
  cuisine: 5, distance: 5, budget: 5, risk: 5, language: 5, solitude: 5,
};

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
});

export const usePassageStore = create<PassageStore>()(
  persist(
    (set) => ({
      passport: '',
      profile: DEFAULT_PROFILE,
      fontSize: 16,
      fontSizeSet: false,
      swipedDestinations: [],
      selectedDestination: null,
      activeTab: 'discover',
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setPassport: (code) => set({ passport: code }),
      setProfile: (values) => set({ profile: values }),
      setFontSize: (size) => set({ fontSize: size }),
      confirmFontSize: () => set({ fontSizeSet: true }),
      addSwipedDestination: (id, dir) =>
        set((s) => {
          const existing = s.swipedDestinations.findIndex(e => e.id === id);
          if (existing >= 0) {
            const updated = [...s.swipedDestinations];
            updated[existing] = { id, dir };
            return { swipedDestinations: updated };
          }
          return { swipedDestinations: [...s.swipedDestinations, { id, dir }] };
        }),
      removeSwipedDestination: (id) =>
        set((s) => ({ swipedDestinations: s.swipedDestinations.filter(e => e.id !== id) })),
      setSelectedDestination: (dest) => set({ selectedDestination: dest }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      resetOnboarding: () =>
        set({
          passport: '',
          profile: DEFAULT_PROFILE,
          swipedDestinations: [],
          selectedDestination: null,
          activeTab: 'discover',
        }),
    }),
    {
      name: 'passage-store',
      storage: ssrSafeStorage,
      partialize: (state) => ({
        passport: state.passport,
        profile: state.profile,
        fontSize: state.fontSize,
        fontSizeSet: state.fontSizeSet,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
