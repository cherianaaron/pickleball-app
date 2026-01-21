import Stripe from "stripe";

// Server-side Stripe instance - ONLY USE IN API ROUTES
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Price IDs from Stripe Dashboard - ONLY USE IN API ROUTES
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
