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
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  itineraryVariants?: Record<ItineraryStyle, ItineraryDay[]>;
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
  dateOfBirth: string;       // ISO yyyy-mm-dd or empty
  passportNumber: string;
  passportCountry: string;   // ISO 2-letter code
  documentVerified: boolean; // demo: always true after submit
}

export type BookingType = 'flight' | 'hotel' | 'visa';

export interface BookingResultFlight {
  from: string;
  to: string;
  airline: string;
  duration: string;
  price: string;
  seat: string;
  class: string;
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
  details: BookingResultFlight | BookingResultHotel | BookingResultVisa;
}
