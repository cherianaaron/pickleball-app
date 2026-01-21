"use client";

import Link from "next/link";
import { useSubscription } from "../context/SubscriptionContext";
import { TIER_NAMES, SubscriptionTier } from "../lib/tier-limits";

interface UpgradePromptProps {
  feature: string;
  requiredTier?: SubscriptionTier;
  currentValue?: number;
  limit?: number;
  onClose: () => void;
}

export default function UpgradePrompt({
  feature,
  requiredTier = "club",
  currentValue,
  limit,
  onClose,
}: UpgradePromptProps) {
  const { subscription, createCheckoutSession } = useSubscription();

  const handleUpgrade = async () => {
    const url = await createCheckoutSession(requiredTier as "club" | "league", "month");
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6">
          <span className="text-3xl">🔒</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Upgrade Required
        </h2>

        {/* Description */}
        <p className="text-white/60 text-center mb-6">
          {currentValue !== undefined && limit !== undefined ? (
            <>
              You've reached your limit of <span className="text-white font-semibold">{limit} {feature}</span>.
              <br />
              Upgrade to {TIER_NAMES[requiredTier]} to get more!
            </>
          ) : (
            <>
              <span className="text-white font-semibold">{feature}</span> is a {TIER_NAMES[requiredTier]} feature.
              <br />
              Upgrade to unlock this and more!
            </>
          )}
        </p>

        {/* Current tier badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-white/40 text-sm">Current plan:</span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm font-medium">
            {TIER_NAMES[subscription.tier]}
          </span>
        </div>

        {/* Upgrade benefits */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6">
          <p className="text-lime-400 text-sm font-medium mb-2">
            {TIER_NAMES[requiredTier]} includes:
          </p>
          <ul className="space-y-1 text-white/70 text-sm">
            {requiredTier === "club" ? (
              <>
                <li>✓ 5 active tournaments</li>
                <li>✓ Up to 24 players</li>
                <li>✓ Round Robin tournaments</li>
                <li>✓ 5 collaborators per tournament</li>
                <li>✓ No ads</li>
              </>
            ) : (
              <>
                <li>✓ Unlimited tournaments</li>
                <li>✓ Unlimited players</li>
                <li>✓ Unlimited collaborators</li>
                <li>✓ Custom branding</li>
                <li>✓ Priority support</li>
              </>
            )}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 hover:shadow-lg hover:shadow-lime-400/30 hover:scale-105 active:scale-95 transition-all"
          >
            🚀 Upgrade to {TIER_NAMES[requiredTier]} - Start Free Trial
          </button>

          <Link
            href="/pricing"
            className="block w-full py-3 rounded-xl font-medium text-center bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Compare Plans
          </Link>
        </div>

        {/* Trial note */}
        <p className="text-white/40 text-xs text-center mt-4">
          7-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  );
}
