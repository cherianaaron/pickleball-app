import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Price IDs from Stripe Dashboard
// You'll need to create these products/prices in Stripe and update these values
export const STRIPE_PRICES = {
  club: {
    monthly: process.env.STRIPE_PRICE_CLUB_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_CLUB_YEARLY!,
  },
  league: {
    monthly: process.env.STRIPE_PRICE_LEAGUE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_LEAGUE_YEARLY!,
  },
};

// Pricing display (for UI)
export const PRICING = {
  club: {
    monthly: 4.99,
    yearly: 49.90, // 2 months free (10 months × $4.99)
  },
  league: {
    monthly: 9.99,
    yearly: 99.90, // 2 months free (10 months × $9.99)
  },
};
