export interface CountryAccess {
  name: string;
  code: string;
  visaFree: number;
  restricted: number;
  impossible: number;
  score: number;
}

export interface MenuItem {
  name: string;
  desc: string;
  price: string;
}

export interface FoodSpot {
  id: string;
  name: string;
  desc: string;
  funFact: string;
  submittedBy: string;
  map: string;
  type: string;
  priceLevel: 1 | 2 | 3 | 4;
  menu: MenuItem[];
}

export interface Friction {
  transport: string;
  language: string;
  connectivity: string;
}

export interface Flight {
  from: string;
  to: string;
  airline: string;
  duration: string;
  stops: number;
  price: string;
}

export interface Suborbital {
  origin: string;
  originCode: string;
  arrival: string;
  arrivalCode: string;
  vehicle: string;
  operator: string;
  duration: string;
  peakG: string;
  fastingWindow: string;
  medicalGate: string;
  carbonOffset: string;
  price: string;
  windowsPerDay: number;
  onward: string;
  reentryCorridor: string;
}

export interface Hotel {
  name: string;
  type: string;
  price: string;
  desc: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  desc: string;
}

export type ItineraryStyle = 'classic' | 'adventure' | 'relaxed';

export interface TravelPlan {
  flights: Flight;
  suborbital: Suborbital;
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  itineraryVariants?: Record<ItineraryStyle, ItineraryDay[]>;
}

// ── Safety: mesh beacon + geo feed ────────────────────────────────────────
// Both are simulated for the demo. Mesh beacon describes the local
// peer-mesh density a device joins on landing; geo events are a
// rolling feed of destination-scoped advisories that a real backend
// would stream from USGS / NOAA / ACLED / WHO etc.

export interface MeshBeacon {
  protocol: string; // e.g. "LoRa-mesh 868MHz"
  density: number; // # of Passage devices currently in mesh range
  hopsToSAR: number; // network hops to nearest SAR ops
  nearestRelay: string; // e.g. "Andasibe ranger station · 4.2km NE"
  coverage: number; // 0-100 % terrain coverage estimate
  lastPing: string; // relative, e.g. "47s ago"
  knownTravelers: number; // strangers passively reachable
}

export type GeoEventKind = 'seismic' | 'civil' | 'weather' | 'health' | 'transport';
export type GeoEventSeverity = 'WATCH' | 'ADVISORY' | 'CRITICAL';

export interface GeoEvent {
  id: string;
  kind: GeoEventKind;
  severity: GeoEventSeverity;
  title: string;
  desc: string;
  timestamp: string; // relative, e.g. "12 min ago"
  predictedWindow?: string; // e.g. "next 6h, 78% probability"
  autoAction?: string; // e.g. "Itinerary day 3 shifted +1 day"
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  coords: string;
  voiceNote: string;
  voiceDuration: string;
  prompts: string[];
  foodSpots: FoodSpot[];
  friction: Friction;
  frictionLevel: number;
  trivia: string;
  deniedCount: number;
  visaProb: Record<string, number>;
  bestMonths: string;
  avgTemp: string;
  currency: string;
  flightHub: string;
  travelPlan: TravelPlan;
  meshBeacon: MeshBeacon;
  geoEvents: GeoEvent[];
}

export interface ProfileValues {
  cuisine: number;
  distance: number;
  budget: number;
  risk: number;
  language: number;
  solitude: number;
}

export interface ProfileSlide {
  key: keyof ProfileValues;
  label: string;
  desc: string;
  low: string;
  high: string;
  icon: string;
}

export type AuthProvider = 'google' | 'apple' | 'email';

export interface User {
  name: string;
  email: string;
  provider: AuthProvider;
  avatarInitials: string;
  signedInAt: string; // ISO date
}

export interface Identity {
  fullName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd or empty
  passportNumber: string;
  passportCountry: string; // ISO 2-letter code
  documentVerified: boolean; // demo: always true after submit
}

export type BookingType = 'flight' | 'suborbital' | 'hotel' | 'visa';

export interface BookingResultFlight {
  from: string;
  to: string;
  airline: string;
  duration: string;
  price: string;
  seat: string;
  class: string;
}

export interface BookingResultSuborbital {
  vehicle: string;
  operator: string;
  flightNumber: string;
  origin: string;
  arrival: string;
  duration: string;
  peakG: string;
  cabin: string;
  berth: string;
  launchWindow: string;
  reentryCorridor: string;
  price: string;
}

export interface BookingResultHotel {
  name: string;
  hotelType: string;
  pricePerNight: string;
  nights: number;
  confirmationCode: string;
}

export interface BookingResultVisa {
  country: string;
  processingTime: string;
  applicationType: string;
  applicationId: string;
  status: string;
}

export interface BookingResult {
  bookingRef: string;
  issuedAt: string;
  type: BookingType;
  details: BookingResultFlight | BookingResultSuborbital | BookingResultHotel | BookingResultVisa;
}
