import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfileValues, Destination, ItineraryDay, ItineraryStyle } from './types';

export interface SwipedEntry {
  id: string;
  dir: 'left' | 'right';
}

interface PassageStore {
  // ── persisted ──────────────────────────────────────────────────────────────
  passport: string;
  profile: ProfileValues;
  fontSize: number;
  fontSizeSet: boolean;
  customItineraries: Record<string, ItineraryDay[]>;
  itineraryStyle: Record<string, ItineraryStyle>;

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
  clearSwipes: () => void;
  setSelectedDestination: (dest: Destination | null) => void;
  setActiveTab: (tab: string) => void;
  resetOnboarding: () => void;

  setItinerary: (destId: string, days: ItineraryDay[]) => void;
  clearItinerary: (destId: string) => void;
  setItineraryStyle: (destId: string, style: ItineraryStyle) => void;
  updateItineraryDay: (destId: string, dayIndex: number, patch: Partial<ItineraryDay>) => void;
  addItineraryDay: (destId: string, day: ItineraryDay) => void;
  removeItineraryDay: (destId: string, dayIndex: number) => void;
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

function renumberDays(days: ItineraryDay[]): ItineraryDay[] {
  return days.map((d, i) => ({ ...d, day: i + 1 }));
}

export const usePassageStore = create<PassageStore>()(
  persist(
    (set) => ({
      passport: '',
      profile: DEFAULT_PROFILE,
      fontSize: 16,
      fontSizeSet: false,
      customItineraries: {},
      itineraryStyle: {},
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
      clearSwipes: () => set({ swipedDestinations: [] }),

      setSelectedDestination: (dest) => set({ selectedDestination: dest }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      resetOnboarding: () =>
        set({
          passport: '',
          profile: DEFAULT_PROFILE,
          swipedDestinations: [],
          selectedDestination: null,
          activeTab: 'discover',
          customItineraries: {},
          itineraryStyle: {},
        }),

      setItinerary: (destId, days) =>
        set((s) => ({
          customItineraries: { ...s.customItineraries, [destId]: renumberDays(days) },
        })),
      clearItinerary: (destId) =>
        set((s) => {
          const { [destId]: _omit, ...rest } = s.customItineraries;
          return { customItineraries: rest };
        }),
      setItineraryStyle: (destId, style) =>
        set((s) => ({ itineraryStyle: { ...s.itineraryStyle, [destId]: style } })),
      updateItineraryDay: (destId, idx, patch) =>
        set((s) => {
          const current = s.customItineraries[destId];
          if (!current) return s;
          const next = current.map((d, i) => (i === idx ? { ...d, ...patch } : d));
          return { customItineraries: { ...s.customItineraries, [destId]: renumberDays(next) } };
        }),
      addItineraryDay: (destId, day) =>
        set((s) => {
          const current = s.customItineraries[destId] ?? [];
          return {
            customItineraries: {
              ...s.customItineraries,
              [destId]: renumberDays([...current, day]),
            },
          };
        }),
      removeItineraryDay: (destId, idx) =>
        set((s) => {
          const current = s.customItineraries[destId];
          if (!current) return s;
          const next = current.filter((_, i) => i !== idx);
          return { customItineraries: { ...s.customItineraries, [destId]: renumberDays(next) } };
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
        customItineraries: state.customItineraries,
        itineraryStyle: state.itineraryStyle,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
