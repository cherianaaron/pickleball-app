"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import {
  TIER_FEATURES,
  TIER_NAMES,
  TIER_DESCRIPTIONS,
  SubscriptionTier,
} from "../lib/tier-limits";
import { PRICING } from "../lib/stripe";
import LoadingSpinner from "../components/LoadingSpinner";

function PricingContent() {
  const { user } = useAuth();
  const { subscription, loading, createCheckoutSession } = useSubscription();
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const cancelled = searchParams.get("cancelled") === "true";

  const handleSubscribe = async (tier: "club" | "league") => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=/pricing`;
      return;
    }

    setProcessingTier(tier);
    try {
      const url = await createCheckoutSession(tier, billingInterval);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setProcessingTier(null);
    }
  };

  const getPrice = (tier: "club" | "league") => {
    if (billingInterval === "month") {
      return PRICING[tier].monthly;
    }
    return (PRICING[tier].yearly / 12).toFixed(2);
  };

  const getYearlySavings = (tier: "club" | "league") => {
    const monthly = PRICING[tier].monthly * 12;
    const yearly = PRICING[tier].yearly;
    return Math.round(monthly - yearly);
  };

  const isCurrentPlan = (tier: SubscriptionTier) => {
    return subscription.tier === tier;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading pricing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-3xl">💎</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Start with a free 7-day trial on any paid plan. No credit card required to try!
          </p>

          {cancelled && (
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 max-w-md mx-auto">
              <p className="text-yellow-300 text-sm">
                Checkout was cancelled. Feel free to try again when you're ready!
              </p>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              billingInterval === "month" ? "text-white" : "text-white/50"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingInterval(billingInterval === "month" ? "year" : "month")
            }
            className="relative w-14 h-7 rounded-full bg-white/10 border border-white/20 transition-colors"
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-gradient-to-r from-lime-400 to-yellow-300 transition-all ${
                billingInterval === "year" ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              billingInterval === "year" ? "text-white" : "text-white/50"
            }`}
          >
            Yearly
          </span>
          {billingInterval === "year" && (
            <span className="ml-2 px-2 py-1 rounded-full bg-lime-400/20 text-lime-400 text-xs font-medium">
              2 months free!
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Free Tier */}
          <div className="glass rounded-3xl p-6 lg:p-8 border border-white/10 relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {TIER_NAMES.free}
              </h3>
              <p className="text-white/50 text-sm">{TIER_DESCRIPTIONS.free}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-white/50 ml-2">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {TIER_FEATURES.free.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white/70 text-sm">
                  <span className="text-white/40 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrentPlan("free") ? (
              <div className="w-full py-3 rounded-xl text-center font-semibold bg-white/10 text-white/60">
                Current Plan
              </div>
            ) : (
              <Link
                href={user ? "/" : "/login?redirect=/pricing"}
                className="block w-full py-3 rounded-xl text-center font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Club Tier - Most Popular */}
          <div className="glass rounded-3xl p-6 lg:p-8 border-2 border-lime-400/50 relative transform md:scale-105 shadow-xl shadow-lime-400/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 text-xs font-bold">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {TIER_NAMES.club}
              </h3>
              <p className="text-white/50 text-sm">{TIER_DESCRIPTIONS.club}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">
                ${getPrice("club")}
              </span>
              <span className="text-white/50 ml-2">/month</span>
              {billingInterval === "year" && (
                <div className="text-lime-400 text-sm mt-1">
                  Save ${getYearlySavings("club")}/year
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {TIER_FEATURES.club.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white/70 text-sm">
                  <span className="text-lime-400 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrentPlan("club") ? (
              <div className="w-full py-3 rounded-xl text-center font-semibold bg-lime-400/20 text-lime-400">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe("club")}
                disabled={processingTier === "club"}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 hover:shadow-lg hover:shadow-lime-400/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingTier === "club" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Start Free Trial"
                )}
              </button>
            )}
          </div>

          {/* League Tier */}
          <div className="glass rounded-3xl p-6 lg:p-8 border border-orange-400/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold">
              PRO
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {TIER_NAMES.league}
              </h3>
              <p className="text-white/50 text-sm">{TIER_DESCRIPTIONS.league}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">
                ${getPrice("league")}
              </span>
              <span className="text-white/50 ml-2">/month</span>
              {billingInterval === "year" && (
                <div className="text-orange-400 text-sm mt-1">
                  Save ${getYearlySavings("league")}/year
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {TIER_FEATURES.league.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white/70 text-sm">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrentPlan("league") ? (
              <div className="w-full py-3 rounded-xl text-center font-semibold bg-orange-400/20 text-orange-400">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe("league")}
                disabled={processingTier === "league"}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 text-white hover:shadow-lg hover:shadow-orange-400/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingTier === "league" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Start Free Trial"
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-white/60 text-sm">
                Yes! You can cancel your subscription at any time. You'll continue
                to have access to your paid features until the end of your billing
                period.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">
                What happens after my 7-day trial?
              </h3>
              <p className="text-white/60 text-sm">
                After your trial ends, you'll be automatically charged for your
                selected plan. You can cancel before the trial ends to avoid any
                charges.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-white/60 text-sm">
                Absolutely! You can upgrade or downgrade your plan at any time.
                Changes take effect immediately, and we'll prorate your billing.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-white/60 text-sm">
                If you try to exceed your plan's limits (like adding more players
                than allowed), you'll see a prompt to upgrade. Your existing
                tournaments will continue to work normally.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-white/60 text-sm">
                Yes! We use Stripe for all payment processing. Your payment
                information is never stored on our servers and is protected by
                bank-level security.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-white/50 text-sm">
            Have questions? Contact us at{" "}
            <a
              href="mailto:support@picklebracket.app"
              className="text-lime-400 hover:underline"
            >
              support@picklebracket.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading pricing..." />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
