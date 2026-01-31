"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "../lib/supabase-browser";
import {
  SubscriptionTier,
  TierLimits,
  TIER_LIMITS,
  canUseFeature,
} from "../lib/tier-limits";

interface Subscription {
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "past_due" | "trialing" | "inactive";
  billingInterval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription;
  limits: TierLimits;
  loading: boolean;
  error: string | null;
  isTrialing: boolean;
  isPaid: boolean;
  canUse: (feature: keyof TierLimits) => boolean;
  checkLimit: (feature: keyof TierLimits, currentValue: number) => boolean;
  refreshSubscription: () => Promise<void>;
  syncSubscription: () => Promise<boolean | undefined>;
  createCheckoutSession: (
    tier: "club" | "league",
    interval: "month" | "year"
  ) => Promise<string | null>;
  createPortalSession: () => Promise<string | null>;
}

const defaultSubscription: Subscription = {
  tier: "free",
  status: "active",
  billingInterval: null,
  currentPeriodEnd: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] =
    useState<Subscription>(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the browser client that shares auth state with AuthContext
  const supabase = useMemo(() => createClient(), []);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(defaultSubscription);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription from database
      const { data, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching subscription:", fetchError);
        // If table doesn't exist yet, just use free tier
        setSubscription(defaultSubscription);
        setLoading(false);
        return;
      }

      if (data) {
        // Check if subscription is still valid
        const now = new Date();
        const periodEnd = data.current_period_end
          ? new Date(data.current_period_end)
          : null;
        const trialEnd = data.trial_end ? new Date(data.trial_end) : null;

        // Determine effective status
        let effectiveStatus = data.status;
        let effectiveTier = data.tier as SubscriptionTier;

        // If period has ended and not renewed, downgrade to free
        if (
          periodEnd &&
          periodEnd < now &&
          data.status !== "trialing" &&
          data.tier !== "free"
        ) {
          effectiveStatus = "inactive";
          effectiveTier = "free";
        }

        // If trial has ended without payment, downgrade to free
        if (
          trialEnd &&
          trialEnd < now &&
          data.status === "trialing" &&
          !data.stripe_subscription_id
        ) {
          effectiveStatus = "inactive";
          effectiveTier = "free";
        }

        setSubscription({
          tier: effectiveTier,
          status: effectiveStatus,
          billingInterval: data.billing_interval || null,
          currentPeriodEnd: data.current_period_end,
          trialEnd: data.trial_end,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
          stripeCustomerId: data.stripe_customer_id,
        });
      } else {
        // No subscription record exists yet - user is on free tier
        // Don't try to insert from client (server will create when needed)
        console.log("No subscription record found, using default free tier");
        setSubscription(defaultSubscription);
      }
    } catch (err) {
      console.error("Error in fetchSubscription:", err);
      setError("Failed to load subscription");
      setSubscription(defaultSubscription);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Sync subscription from Stripe (useful when webhooks don't fire)
  const syncSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log("Syncing subscription from Stripe...");
      const response = await fetch("/api/stripe/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      console.log("Sync response:", data);
      
      if (response.ok && data.synced) {
        // Refetch subscription after sync
        await fetchSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error syncing subscription:", err);
      return false;
    }
  }, [user, fetchSubscription]);

  // Fetch subscription when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [user, authLoading, fetchSubscription]);

  // Auto-sync when returning from Stripe checkout
  useEffect(() => {
    if (!authLoading && user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        console.log("Detected success=true, triggering sync...");
        // User just returned from successful checkout, sync with Stripe
        syncSubscription().then(result => {
          console.log("Sync completed:", result);
        });
      }
    }
  }, [authLoading, user, syncSubscription]);

  // Computed values
  const limits = TIER_LIMITS[subscription.tier];
  const isTrialing = subscription.status === "trialing";
  const isPaid = subscription.tier !== "free" && subscription.status === "active";

  // Check if user can use a feature
  const canUse = useCallback(
    (feature: keyof TierLimits): boolean => {
      return canUseFeature(subscription.tier, feature);
    },
    [subscription.tier]
  );

  // Check if a limit is within bounds
  const checkLimit = useCallback(
    (feature: keyof TierLimits, currentValue: number): boolean => {
      const limit = limits[feature];
      if (typeof limit !== "number") return true;
      return currentValue < limit;
    },
    [limits]
  );

  // Create Stripe Checkout session
  const createCheckoutSession = useCallback(
    async (
      tier: "club" | "league",
      interval: "month" | "year"
    ): Promise<string | null> => {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, interval }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create checkout session");
        }

        const { url } = await response.json();
        return url;
      } catch (err) {
        console.error("Error creating checkout session:", err);
        setError(err instanceof Error ? err.message : "Failed to start checkout");
        return null;
      }
    },
    []
  );

  // Create Stripe Customer Portal session
  const createPortalSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create portal session");
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error("Error creating portal session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      return null;
    }
  }, []);

  const value: SubscriptionContextType = {
    subscription,
    limits,
    loading,
    error,
    isTrialing,
    isPaid,
    canUse,
    checkLimit,
    refreshSubscription: fetchSubscription,
    syncSubscription,
    createCheckoutSession,
    createPortalSession,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
