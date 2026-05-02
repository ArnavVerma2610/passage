import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ProfileValues,
  Destination,
  ItineraryDay,
  ItineraryStyle,
  User,
  Identity,
} from './types';
import type { AmpProfile } from './amp';
import { defaultAmpProfile } from './amp';

export interface SwipedEntry {
  id: string;
  dir: 'left' | 'right';
}

interface PassageStore {
  // ── persisted ──────────────────────────────────────────────────────────────
  user: User | null;
  identity: Identity | null;
  amp: AmpProfile;
  ampCompleted: boolean;
  passport: string; // mirrors identity.passportCountry — kept for legacy reads
  profile: ProfileValues;
  fontSize: number;
  fontSizeSet: boolean;
  theme: 'dark' | 'light';
  customItineraries: Record<string, ItineraryDay[]>;
  itineraryStyle: Record<string, ItineraryStyle>;
  discoverRound: number; // increments every time the deck is reset
  meshBeaconArmed: Record<string, boolean>; // per-destination mesh beacon arm state
  geoAutoReroute: Record<string, boolean>; // per-destination auto-reroute toggle
  gestureEnabled: boolean; // master switch for webcam-driven gesture control
  gesturePreviewHidden: boolean; // user hid the floating webcam preview
  gestureLegendOpen: boolean; // user expanded the gesture legend

  // ── session ────────────────────────────────────────────────────────────────
  swipedDestinations: SwipedEntry[];
  selectedDestination: Destination | null;
  activeTab: string;

  // ── hydration flag (not persisted) ─────────────────────────────────────────
  _hasHydrated: boolean;

  // ── actions ────────────────────────────────────────────────────────────────
  setHasHydrated: (v: boolean) => void;
  setUser: (user: User | null) => void;
  signOut: () => void;

  setIdentity: (identity: Identity) => void;
  setPassport: (code: string) => void;
  setProfile: (values: ProfileValues) => void;
  setFontSize: (size: number) => void;
  confirmFontSize: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setAmpField: (categoryKey: string, fieldKey: string, value: number) => void;
  setAmp: (amp: AmpProfile) => void;
  setAmpCompleted: (v: boolean) => void;
  resetAmp: () => void;
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

  setMeshBeaconArmed: (destId: string, armed: boolean) => void;
  setGeoAutoReroute: (destId: string, on: boolean) => void;

  setGestureEnabled: (v: boolean) => void;
  setGesturePreviewHidden: (v: boolean) => void;
  setGestureLegendOpen: (v: boolean) => void;
}

const DEFAULT_PROFILE: ProfileValues = {
  cuisine: 5,
  distance: 5,
  budget: 5,
  risk: 5,
  language: 5,
  solitude: 5,
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
    set => ({
      user: null,
      identity: null,
      amp: defaultAmpProfile(),
      ampCompleted: false,
      passport: '',
      profile: DEFAULT_PROFILE,
      fontSize: 16,
      fontSizeSet: false,
      theme: 'dark',
      customItineraries: {},
      itineraryStyle: {},
      discoverRound: 0,
      meshBeaconArmed: {},
      geoAutoReroute: {},
      gestureEnabled: false,
      gesturePreviewHidden: false,
      gestureLegendOpen: false,
      swipedDestinations: [],
      selectedDestination: null,
      activeTab: 'discover',
      _hasHydrated: false,

      setHasHydrated: v => set({ _hasHydrated: v }),
      setUser: user => set({ user }),
      signOut: () =>
        set({
          user: null,
          identity: null,
          amp: defaultAmpProfile(),
          ampCompleted: false,
          passport: '',
          swipedDestinations: [],
          customItineraries: {},
          itineraryStyle: {},
          meshBeaconArmed: {},
          geoAutoReroute: {},
        }),

      setIdentity: identity => set({ identity, passport: identity.passportCountry }),
      setPassport: code =>
        set(s => ({
          passport: code,
          identity: s.identity ? { ...s.identity, passportCountry: code } : s.identity,
        })),
      setProfile: values => set({ profile: values }),
      setFontSize: size => set({ fontSize: size }),
      confirmFontSize: () => set({ fontSizeSet: true }),
      setTheme: t => set({ theme: t }),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      setAmpField: (categoryKey, fieldKey, value) =>
        set(s => ({
          amp: {
            ...s.amp,
            [categoryKey]: { ...(s.amp[categoryKey] ?? {}), [fieldKey]: value },
          },
        })),
      setAmp: amp => set({ amp }),
      setAmpCompleted: v => set({ ampCompleted: v }),
      resetAmp: () => set({ amp: defaultAmpProfile(), ampCompleted: false }),

      addSwipedDestination: (id, dir) =>
        set(s => {
          const existing = s.swipedDestinations.findIndex(e => e.id === id);
          if (existing >= 0) {
            const updated = [...s.swipedDestinations];
            updated[existing] = { id, dir };
            return { swipedDestinations: updated };
          }
          return { swipedDestinations: [...s.swipedDestinations, { id, dir }] };
        }),
      removeSwipedDestination: id =>
        set(s => ({ swipedDestinations: s.swipedDestinations.filter(e => e.id !== id) })),
      clearSwipes: () => set(s => ({ swipedDestinations: [], discoverRound: s.discoverRound + 1 })),

      setSelectedDestination: dest => set({ selectedDestination: dest }),
      setActiveTab: tab => set({ activeTab: tab }),

      resetOnboarding: () =>
        set({
          user: null,
          identity: null,
          amp: defaultAmpProfile(),
          ampCompleted: false,
          passport: '',
          profile: DEFAULT_PROFILE,
          swipedDestinations: [],
          selectedDestination: null,
          activeTab: 'discover',
          customItineraries: {},
          itineraryStyle: {},
          discoverRound: 0,
          meshBeaconArmed: {},
          geoAutoReroute: {},
        }),

      setItinerary: (destId, days) =>
        set(s => ({
          customItineraries: { ...s.customItineraries, [destId]: renumberDays(days) },
        })),
      clearItinerary: destId =>
        set(s => {
          const { [destId]: _omit, ...rest } = s.customItineraries;
          return { customItineraries: rest };
        }),
      setItineraryStyle: (destId, style) =>
        set(s => ({ itineraryStyle: { ...s.itineraryStyle, [destId]: style } })),
      updateItineraryDay: (destId, idx, patch) =>
        set(s => {
          const current = s.customItineraries[destId];
          if (!current) return s;
          const next = current.map((d, i) => (i === idx ? { ...d, ...patch } : d));
          return { customItineraries: { ...s.customItineraries, [destId]: renumberDays(next) } };
        }),
      addItineraryDay: (destId, day) =>
        set(s => {
          const current = s.customItineraries[destId] ?? [];
          return {
            customItineraries: {
              ...s.customItineraries,
              [destId]: renumberDays([...current, day]),
            },
          };
        }),
      removeItineraryDay: (destId, idx) =>
        set(s => {
          const current = s.customItineraries[destId];
          if (!current) return s;
          const next = current.filter((_, i) => i !== idx);
          return { customItineraries: { ...s.customItineraries, [destId]: renumberDays(next) } };
        }),

      setMeshBeaconArmed: (destId, armed) =>
        set(s => ({ meshBeaconArmed: { ...s.meshBeaconArmed, [destId]: armed } })),
      setGeoAutoReroute: (destId, on) =>
        set(s => ({ geoAutoReroute: { ...s.geoAutoReroute, [destId]: on } })),

      setGestureEnabled: v => set({ gestureEnabled: v }),
      setGesturePreviewHidden: v => set({ gesturePreviewHidden: v }),
      setGestureLegendOpen: v => set({ gestureLegendOpen: v }),
    }),
    {
      name: 'passage-store',
      storage: ssrSafeStorage,
      partialize: state => ({
        user: state.user,
        identity: state.identity,
        amp: state.amp,
        ampCompleted: state.ampCompleted,
        passport: state.passport,
        profile: state.profile,
        fontSize: state.fontSize,
        fontSizeSet: state.fontSizeSet,
        theme: state.theme,
        customItineraries: state.customItineraries,
        itineraryStyle: state.itineraryStyle,
        discoverRound: state.discoverRound,
        meshBeaconArmed: state.meshBeaconArmed,
        geoAutoReroute: state.geoAutoReroute,
        gestureEnabled: state.gestureEnabled,
        gesturePreviewHidden: state.gesturePreviewHidden,
        gestureLegendOpen: state.gestureLegendOpen,
      }),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
