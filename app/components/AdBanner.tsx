"use client";

import Link from "next/link";
import { useSubscription } from "../context/SubscriptionContext";

interface AdBannerProps {
  placement?: "bottom" | "inline" | "history";
  className?: string;
}

export default function AdBanner({ 
  placement = "bottom", 
  className = "",
}: AdBannerProps) {
  const { subscription, loading } = useSubscription();

  // Don't show ads for paid users, admins, or while loading
  if (loading || subscription.tier !== "free" || subscription.isAdmin) {
    return null;
  }

  // Simple, controlled upgrade banner instead of AdSense
  // This gives us full control over size and prevents intrusive ads
  if (placement === "bottom") {
    return (
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-40
          h-[44px]
          bg-gradient-to-r from-emerald-900/95 to-teal-900/95
          backdrop-blur-sm border-t border-lime-400/20
          flex items-center justify-center
          ${className}
        `}
      >
        <Link
          href="/pricing"
          className="flex items-center gap-2 text-sm text-white/80 hover:text-lime-400 transition-colors"
        >
          <span>✨</span>
          <span>Upgrade to Pro for unlimited features & no ads</span>
          <span className="text-lime-400 font-medium ml-1">→</span>
        </Link>
      </div>
    );
  }

  // Inline placement (for history page, etc.)
  return (
    <div
      className={`
        my-3 mx-4 p-3 rounded-xl
        bg-gradient-to-r from-emerald-900/50 to-teal-900/50
        border border-lime-400/20
        ${className}
      `}
    >
      <Link
        href="/pricing"
        className="flex items-center justify-center gap-2 text-sm text-white/70 hover:text-lime-400 transition-colors"
      >
        <span>✨</span>
        <span>Go ad-free with Pro</span>
        <span className="text-lime-400 font-medium">→</span>
      </Link>
    </div>
  );
}
