export type SubscriptionTier = "free" | "club" | "league";

export interface TierLimits {
  maxActiveTournaments: number;
  maxPlayersPerTournament: number;
  maxCollaborators: number;
  hasRoundRobin: boolean;
  historyDays: number;
  hasAds: boolean;
  hasExport: boolean;
  hasCustomBranding: boolean;
  hasAdvancedStats: boolean;
  hasPrioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxActiveTournaments: 1,
    maxPlayersPerTournament: 8,
    maxCollaborators: 0,
    hasRoundRobin: false,
    historyDays: 30,
    hasAds: true,
    hasExport: false,
    hasCustomBranding: false,
    hasAdvancedStats: false,
    hasPrioritySupport: false,
  },
  club: {
    maxActiveTournaments: 5,
    maxPlayersPerTournament: 24,
    maxCollaborators: 5,
    hasRoundRobin: true,
    historyDays: 365,
    hasAds: false,
    hasExport: true,
    hasCustomBranding: false,
    hasAdvancedStats: false,
    hasPrioritySupport: false,
  },
  league: {
    maxActiveTournaments: Infinity,
    maxPlayersPerTournament: Infinity,
    maxCollaborators: Infinity,
    hasRoundRobin: true,
    historyDays: Infinity,
    hasAds: false,
    hasExport: true,
    hasCustomBranding: true,
    hasAdvancedStats: true,
    hasPrioritySupport: true,
  },
};

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: "Free",
  club: "Club",
  league: "League",
};

export const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  free: "Perfect for casual players",
  club: "Great for club organizers",
  league: "For serious tournament directors",
};

// Feature descriptions for pricing page
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    "1 active tournament",
    "Up to 8 players",
    "Bracket tournaments only",
    "30-day history",
    "Ad-supported",
  ],
  club: [
    "5 active tournaments",
    "Up to 24 players",
    "Bracket + Round Robin",
    "5 collaborators per tournament",
    "1-year history",
    "No ads",
  ],
  league: [
    "Unlimited tournaments",
    "Unlimited players",
    "All tournament formats",
    "Unlimited collaborators",
    "Unlimited history",
    "No ads",
    "Priority support",
  ],
};

// Helper to check if a feature is available
export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];
  
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return false;
}

// Helper to get the minimum tier required for a feature
export function getRequiredTier(feature: keyof TierLimits): SubscriptionTier {
  if (canUseFeature("free", feature)) return "free";
  if (canUseFeature("club", feature)) return "club";
  return "league";
}

// Pricing display (for UI) - safe for client-side use
export const PRICING = {
  club: {
    monthly: 5, // $5/month
    yearly: 48, // $4/month billed annually (saves $12/year)
  },
  league: {
    monthly: 10, // $10/month
    yearly: 96, // $8/month billed annually (saves $24/year)
  },
};
