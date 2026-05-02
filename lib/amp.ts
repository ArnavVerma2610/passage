// AI Mobility Profile (AMP) — scoring, tiers, types

export type Tier = 1 | 2 | 3;

export interface AmpField {
  key: string;
  label: string;
  low: string; // value 0 description
  high: string; // value 10 description
  // Some fields are inherently negative ("missed flights"); UX always renders
  // value 10 = "good", so internal logic is uniform.
}

export interface AmpCategory {
  key: string;
  title: string;
  desc: string;
  icon: string;
  fields: AmpField[];
}

export const AMP_CATEGORIES: AmpCategory[] = [
  {
    key: 'identity',
    title: 'Identity readiness',
    desc: 'Travel-document state and verifiability.',
    icon: '◈',
    fields: [
      {
        key: 'passportValidity',
        label: 'Passport validity',
        low: 'Expired or expiring',
        high: '5+ years left',
      },
      {
        key: 'visaStatus',
        label: 'Active visa coverage',
        low: 'None',
        high: 'Multi-year, multi-region',
      },
      {
        key: 'linkedNationalId',
        label: 'Linked national ID',
        low: 'Not linked',
        high: 'Verified, linked',
      },
      {
        key: 'documentCompleteness',
        label: 'Document completeness',
        low: 'Missing key docs',
        high: 'All required docs current',
      },
      {
        key: 'emergencyVerification',
        label: 'Emergency verification',
        low: 'Not set up',
        high: 'Contacts verified',
      },
    ],
  },
  {
    key: 'compliance',
    title: 'Compliance history',
    desc: 'Past behavior at borders and with authorities.',
    icon: '◇',
    fields: [
      {
        key: 'overstayRecords',
        label: 'Overstay records',
        low: 'Multiple overstays',
        high: 'No overstays',
      },
      {
        key: 'borderViolations',
        label: 'Border violations',
        low: 'Several violations',
        high: 'Clean record',
      },
      {
        key: 'customsPenalties',
        label: 'Customs penalties',
        low: 'Past penalties',
        high: 'No penalties',
      },
      { key: 'fraudAttempts', label: 'Document fraud flags', low: 'Flagged', high: 'No flags' },
      {
        key: 'entryDenials',
        label: 'Entry denial history',
        low: 'Multiple denials',
        high: 'No denials',
      },
    ],
  },
  {
    key: 'reliability',
    title: 'Travel reliability',
    desc: 'Track record as a traveler and bookings client.',
    icon: '○',
    fields: [
      { key: 'missedFlights', label: 'Missed flights', low: 'Often', high: 'Never' },
      { key: 'noShowBookings', label: 'No-show bookings', low: 'Frequent', high: 'None' },
      {
        key: 'lateCheckIns',
        label: 'Late check-ins',
        low: 'Routinely late',
        high: 'Always on time',
      },
      {
        key: 'cancellationFreq',
        label: 'Cancellation frequency',
        low: 'Frequent cancels',
        high: 'Almost never',
      },
      {
        key: 'returnPunctuality',
        label: 'Return punctuality',
        low: 'Often delayed',
        high: 'Always on schedule',
      },
    ],
  },
  {
    key: 'financial',
    title: 'Financial capacity',
    desc: 'Your ability to fund travel and absorb friction.',
    icon: '$',
    fields: [
      { key: 'stableIncome', label: 'Stable income', low: 'Irregular', high: 'Long-term stable' },
      {
        key: 'savingsRatio',
        label: 'Savings ratio',
        low: 'Live paycheck-to-paycheck',
        high: '6+ months runway',
      },
      { key: 'creditHealth', label: 'Credit health', low: 'Poor', high: 'Excellent' },
      {
        key: 'insuranceActive',
        label: 'Travel insurance',
        low: 'None',
        high: 'Active, comprehensive',
      },
      { key: 'noUnpaidDues', label: 'No unpaid dues', low: 'Outstanding debts', high: 'Cleared' },
    ],
  },
  {
    key: 'sustainability',
    title: 'Sustainability score',
    desc: 'Climate footprint of how you move.',
    icon: '△',
    fields: [
      { key: 'flightsPerYear', label: 'Flights per year', low: '20+', high: '0–2' },
      { key: 'railUsage', label: 'Rail usage ratio', low: 'Almost never', high: 'Mostly rail' },
      { key: 'carbonOffsets', label: 'Carbon offsets', low: 'Never offset', high: 'Always offset' },
      {
        key: 'sharedMobility',
        label: 'Shared mobility usage',
        low: 'Solo cars',
        high: 'Mostly shared',
      },
      { key: 'emissionIntensity', label: 'Emission intensity', low: 'Heavy', high: 'Low' },
    ],
  },
  {
    key: 'value',
    title: 'Economic value',
    desc: 'Your contribution as a traveler to host economies.',
    icon: '◉',
    fields: [
      {
        key: 'avgSpend',
        label: 'Average spend per trip',
        low: 'Minimal',
        high: 'High contribution',
      },
      { key: 'lengthOfStay', label: 'Average length of stay', low: '1–2 days', high: '2+ weeks' },
      {
        key: 'businessPurpose',
        label: 'Business / professional travel',
        low: 'Never',
        high: 'Routinely',
      },
      {
        key: 'skillRelevance',
        label: 'Skill demand relevance',
        low: 'No declared skills',
        high: 'High-demand skills',
      },
      {
        key: 'tourismContribution',
        label: 'Tourism contribution',
        low: 'Pass-through',
        high: 'Engaged contributor',
      },
    ],
  },
];

export const AMP_FIELD_COUNT = AMP_CATEGORIES.reduce((n, c) => n + c.fields.length, 0);

export type AmpProfile = Record<string, Record<string, number>>;

export function defaultAmpProfile(): AmpProfile {
  const out: AmpProfile = {};
  for (const cat of AMP_CATEGORIES) {
    out[cat.key] = {};
    for (const f of cat.fields) out[cat.key][f.key] = 5;
  }
  return out;
}

export function categoryScore(
  profile: AmpProfile,
  categoryKey: string,
): { score: number; max: number } {
  const cat = AMP_CATEGORIES.find(c => c.key === categoryKey);
  if (!cat) return { score: 0, max: 0 };
  let total = 0;
  for (const f of cat.fields) {
    const v = profile[cat.key]?.[f.key] ?? 5;
    total += v;
  }
  // each field 0–10. Each category contributes equally to /1000.
  // max raw = fields*10. Normalized cat score = (raw/max) * (1000 / categories)
  const perCategory = 1000 / AMP_CATEGORIES.length;
  const max = perCategory;
  const score = Math.round((total / (cat.fields.length * 10)) * perCategory);
  return { score, max: Math.round(max) };
}

export function computeAmpScore(profile: AmpProfile): number {
  let total = 0;
  for (const cat of AMP_CATEGORIES) {
    const v = categoryScore(profile, cat.key);
    total += v.score;
  }
  return Math.min(1000, total);
}

export function getTier(score: number): Tier {
  if (score >= 700) return 3;
  if (score >= 400) return 2;
  return 1;
}

export interface TierMeta {
  tier: Tier;
  label: string;
  short: string;
  desc: string;
  perks: string[];
  color: string;
}

// Tier colours resolve to CSS variables so they re-theme automatically with
// light / dark mode. Tier 3 reads as the foreground colour (max contrast),
// tier 2 as the warning amber, tier 1 as the danger red.
export const TIER_META: Record<Tier, TierMeta> = {
  3: {
    tier: 3,
    label: 'Open access',
    short: 'TIER 3',
    desc: 'Most destinations are accessible. Premium routes are visible. Approvals are faster.',
    perks: ['More destinations', 'Faster approvals', 'Premium routes visible', 'Lower cost tier'],
    color: 'var(--c-fg)',
  },
  2: {
    tier: 2,
    label: 'Conditional access',
    short: 'TIER 2',
    desc: 'A selected portion of the world is accessible. Approvals take longer. Some routes are hidden.',
    perks: [
      'Selected destinations',
      'Delayed approvals',
      'Route restrictions',
      'Additional requirements',
    ],
    color: 'var(--c-warn)',
  },
  1: {
    tier: 1,
    label: 'Restricted',
    short: 'TIER 1',
    desc: 'Movement is limited. Pricing is higher. Premium routes are hidden by default.',
    perks: ['Limited movement', 'Higher pricing', 'Frequent denials', 'Hidden premium routes'],
    color: 'var(--c-danger)',
  },
};

// Adjust a base visa probability (0–100) by the user's AMP tier.
// Used in cards / trip pages so destinations re-color based on AMP, not just passport.
export function effectiveVisaProb(baseProb: number, tier: Tier): number {
  if (tier === 3) return Math.min(99, baseProb + 12);
  if (tier === 1) return Math.max(3, baseProb - 22);
  return baseProb;
}
