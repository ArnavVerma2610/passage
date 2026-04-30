import type { CountryAccess, Destination, ProfileSlide } from './types';

export const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

export const c = {
  bg: "#000", fg: "#fff",
  dim: "#bbb",        // was #999 — WCAG AA on black
  faint: "#888",      // was #555 — 5.9:1 contrast, was 2.8:1 (fail)
  ghost: "#2a2a2a",
  sub: "#ddd",        // was #aaa
  accent: "#fff",
  danger: "#cc4444",
  warn: "#cc9900",
  surface: "#0a0a0a",
} as const;

export const COUNTRIES_ACCESS: Record<string, CountryAccess> = {
  IN: { name: "India", code: "IN", visaFree: 62, restricted: 87, impossible: 44, score: 32 },
  NO: { name: "Norway", code: "NO", visaFree: 185, restricted: 6, impossible: 2, score: 96 },
  NG: { name: "Nigeria", code: "NG", visaFree: 46, restricted: 102, impossible: 45, score: 24 },
  PK: { name: "Pakistan", code: "PK", visaFree: 38, restricted: 110, impossible: 45, score: 20 },
  US: { name: "United States", code: "US", visaFree: 186, restricted: 5, impossible: 2, score: 96 },
  SY: { name: "Syria", code: "SY", visaFree: 29, restricted: 118, impossible: 46, score: 15 },
};

export const PROFILE_SLIDES: ProfileSlide[] = [
  { key: "cuisine", label: "Culinary curiosity", desc: "How far outside your comfort zone will you eat?", low: "Familiar only", high: "I'll eat anything", icon: "◉" },
  { key: "distance", label: "Travel distance", desc: "How far from the nearest airport are you willing to go?", low: "Under 1 hour", high: "Days if needed", icon: "→" },
  { key: "budget", label: "Daily budget", desc: "What can you spend per day, excluding flights?", low: "< $20/day", high: "$150+/day", icon: "$" },
  { key: "risk", label: "Risk tolerance", desc: "How comfortable are you with unpredictability?", low: "I need a plan", high: "Plans ruin it", icon: "△" },
  { key: "language", label: "Language barrier", desc: "Can you function where nobody speaks your language?", low: "Need English", high: "I'll use my hands", icon: "◊" },
  { key: "solitude", label: "Solitude comfort", desc: "How long can you be alone in a foreign place?", low: "A few hours", high: "Weeks, happily", icon: "○" },
];

export const DESTINATIONS: Destination[] = [
  {
    id: "mestia",
    name: "Mestia",
    country: "Georgia",
    region: "Svaneti, Upper Caucasus",
    coords: "43.0°N, 42.7°E",
    voiceNote: "You hear cowbells before you see the village. The bread here is baked in the ground.",
    voiceDuration: "0:15",
    prompts: ["Can you walk 6 hours uphill and call it a good day?", "Will you drink chacha with a stranger at 10am?"],
    foodSpots: [
      { name: "Unnamed window kitchen", desc: "A woman sells khachapuri from her window. No sign. Look for the steam.", map: "Third house past the stone tower, left side", type: "Street food", price: "$" },
      { name: "Laila's place", desc: "Kubdari — meat-stuffed bread so heavy it could be a weapon. Her grandmother's recipe.", map: "Behind the police station, wooden gate", type: "Home kitchen", price: "$" },
      { name: "The tower cellar", desc: "Wine aged in qvevri underground. The owner pours without asking and won't let you leave sober.", map: "Below the Svan tower near the museum", type: "Wine cellar", price: "$$" },
    ],
    friction: { transport: "4hr marshrutka from Zugdidi, unpaved last hour", language: "Georgian/Svan, almost no English", connectivity: "Intermittent 3G" },
    frictionLevel: 72,
    trivia: "The local word for 'stranger' is the same word as 'guest.'",
    deniedCount: 3,
    visaProb: { IN: 87, NO: 99, NG: 72, PK: 65, US: 99, SY: 31 },
    bestMonths: "Jun–Sep",
    avgTemp: "18°C summer",
    currency: "Georgian Lari (GEL)",
    flightHub: "Kutaisi (KUT)",
    travelPlan: {
      flights: { from: "DEL", to: "KUT", airline: "Wizz Air via Istanbul", duration: "9h 40m", stops: 1, price: "₹18,400" },
      hotels: [
        { name: "Svan Guesthouse", type: "Family homestay", price: "₹1,200/night", desc: "Stone house, shared bathroom, dinner included. The family speaks zero English and it doesn't matter." },
        { name: "Hotel Tetnuldi", type: "Budget hotel", price: "₹2,800/night", desc: "The only place with reliable WiFi. You won't need it." },
      ],
      itinerary: [
        { day: 1, title: "Arrive & orient", desc: "Marshrutka from Kutaisi. Arrive dazed. Walk the village. Find the bread window. Sleep early." },
        { day: 2, title: "Ushguli trek", desc: "6-hour hike to Europe's highest continuously inhabited village. Pack water. The views will make you forget your legs." },
        { day: 3, title: "The towers", desc: "Explore Svan defensive towers. Visit the ethnographic museum. Get invited to someone's house for chacha. Say yes." },
        { day: 4, title: "Get lost on purpose", desc: "No plan. Walk a direction. See what's there. This is the day the app goes dark." },
        { day: 5, title: "Departure", desc: "Morning marshrutka back. You'll want to stay. Everyone does." },
      ],
    },
  },
  {
    id: "harar",
    name: "Harar",
    country: "Ethiopia",
    region: "Harari Region, Eastern Highlands",
    coords: "9.3°N, 42.1°E",
    voiceNote: "The hyenas come at dusk. The man who feeds them learned from his father, who learned from his.",
    voiceDuration: "0:18",
    prompts: ["Can you drink coffee that takes an hour to prepare?", "Are you comfortable in a city with 362 alleyways and no map?"],
    foodSpots: [
      { name: "The gate injera", desc: "Injera with raw kitfo, served on a shared plate. You eat with your right hand or not at all.", map: "Near the Shoa Gate, downhill, follow the spice smell", type: "Local restaurant", price: "$" },
      { name: "Abdullahi's coffee", desc: "The full ceremony. Green beans roasted in front of you, three rounds, two hours. Refusing the third cup is an insult.", map: "Inside the old city, ask anyone for Abdullahi", type: "Coffee ceremony", price: "$" },
      { name: "Night market juice", desc: "Avocado-mango layered juice at the night market. The vendor has been there for 20 years.", map: "Main market square after 7pm", type: "Street vendor", price: "$" },
    ],
    friction: { transport: "1hr flight from Addis or 8hr bus through the Rift Valley", language: "Harari/Amharic, minimal English", connectivity: "Decent 4G in center, nothing outside" },
    frictionLevel: 68,
    trivia: "This city has been trading coffee for 600 years. Starbucks has existed for 54.",
    deniedCount: 7,
    visaProb: { IN: 91, NO: 97, NG: 78, PK: 70, US: 97, SY: 25 },
    bestMonths: "Oct–Feb",
    avgTemp: "24°C",
    currency: "Ethiopian Birr (ETB)",
    flightHub: "Dire Dawa (DIR)",
    travelPlan: {
      flights: { from: "DEL", to: "DIR", airline: "Ethiopian Airlines via Addis", duration: "8h 20m", stops: 1, price: "₹24,600" },
      hotels: [
        { name: "Ras Hotel Harar", type: "Heritage hotel", price: "₹1,600/night", desc: "Colonial era building in the old city. Creaky floors and the best rooftop view of the minarets." },
        { name: "Rewda homestay", type: "Family home", price: "₹800/night", desc: "Sleeping on traditional mats. Morning coffee ceremony included. The grandmother will adopt you." },
      ],
      itinerary: [
        { day: 1, title: "Enter the walls", desc: "Arrive from Dire Dawa. Walk through the Shoa Gate. Get lost immediately. That's correct." },
        { day: 2, title: "The 362 alleyways", desc: "Wander the old city. Visit the Harari museum. Buy spices you can't name. Eat injera until you can't." },
        { day: 3, title: "Hyena feeding", desc: "At dusk, go to the eastern wall. The Hyena Man will hand you raw meat on a stick. You hold it in your teeth. A hyena takes it from your mouth. This is real." },
        { day: 4, title: "Coffee and nothing else", desc: "Spend the entire day doing coffee ceremonies. Three rounds each. At least two houses. Talk to everyone." },
        { day: 5, title: "Departure", desc: "Bus to Dire Dawa at dawn. The city gets smaller in your window. You'll think about the hyenas for years." },
      ],
    },
  },
  {
    id: "karakol",
    name: "Karakol",
    country: "Kyrgyzstan",
    region: "Issyk-Kul Province, Tian Shan",
    coords: "42.5°N, 78.4°E",
    voiceNote: "The mountains here don't care about you. That's why they're beautiful.",
    voiceDuration: "0:12",
    prompts: ["Can you eat horse meat and not make it weird?", "Do you know how to be cold and happy at the same time?"],
    foodSpots: [
      { name: "Dungan ashlan-fu", desc: "Cold noodles in vinegar broth. The Dungan woman who makes it hasn't changed the recipe in 30 years.", map: "Behind the central bazaar, blue metal door", type: "Home restaurant", price: "$" },
      { name: "Bazaar samsa", desc: "Baked lamb pastries from the tandoor. Get there before 11am or they're gone.", map: "Central bazaar, south entrance, first stall on right", type: "Bazaar stall", price: "$" },
      { name: "Besh barmak house", desc: "Five-finger noodles with horse meat. You eat with your hands. The host watches to make sure you enjoy it.", map: "Ask your guesthouse. Everyone knows a place.", type: "Home cooking", price: "$" },
    ],
    friction: { transport: "7hr shared taxi from Bishkek, mountain passes", language: "Kyrgyz/Russian, very little English", connectivity: "WiFi in town, nothing in valleys" },
    frictionLevel: 65,
    trivia: "More horses than cars. Nobody here thinks that's unusual.",
    deniedCount: 1,
    visaProb: { IN: 94, NO: 99, NG: 80, PK: 75, US: 99, SY: 40 },
    bestMonths: "Jul–Sep",
    avgTemp: "22°C summer",
    currency: "Kyrgyz Som (KGS)",
    flightHub: "Bishkek Manas (FRU)",
    travelPlan: {
      flights: { from: "DEL", to: "FRU", airline: "Air Manas via Almaty", duration: "6h 10m", stops: 1, price: "₹15,200" },
      hotels: [
        { name: "Tagaytay Yurt Camp", type: "Yurt stay", price: "₹900/night", desc: "Felt walls, wood stove, total silence except the river. Breakfast is fresh bread and honey from the neighbor." },
        { name: "Duet Hostel", type: "Budget hostel", price: "₹600/night", desc: "Run by two sisters who will plan your entire trip if you let them. Don't let them. Get lost instead." },
      ],
      itinerary: [
        { day: 1, title: "The long road in", desc: "Shared taxi from Bishkek. You'll stop for roadside kymyz (fermented mare's milk). Drink it." },
        { day: 2, title: "Jyrgalan Valley", desc: "Hike into the valley. No trails marked. Follow the river. Find the hot spring the locals use." },
        { day: 3, title: "Bazaar day", desc: "Central market. Buy felt, eat samsa, watch the animal trading. Nobody's performing for you. This is Tuesday." },
        { day: 4, title: "Horse day", desc: "Rent a horse. Ride toward the mountains. The horse knows where to go better than you do." },
        { day: 5, title: "Departure", desc: "Shared taxi back. Seven hours of mountain passes. You'll sleep through the best views and dream about the ones you saw awake." },
      ],
    },
  },
];
