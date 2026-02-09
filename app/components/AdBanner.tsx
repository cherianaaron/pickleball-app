"use client";

import { useEffect, useRef } from "react";
import { useSubscription } from "../context/SubscriptionContext";

interface AdBannerProps {
  placement?: "bottom" | "inline" | "history";
  className?: string;
  adSlot?: string;
}

// AdSense client ID
const ADSENSE_CLIENT_ID = "ca-pub-9856496401783276";

export default function AdBanner({ 
  placement = "bottom", 
  className = "",
  adSlot = "auto" // You can create specific ad slots in AdSense and pass them here
}: AdBannerProps) {
  const { subscription, loading } = useSubscription();
  const adRef = useRef<HTMLDivElement>(null);
  const adInitialized = useRef(false);

  // Placement styles
  const placementStyles = {
    bottom: "fixed bottom-0 left-0 right-0 z-40",
    inline: "my-4",
    history: "my-4",
  };

  const heightStyles = {
    bottom: "h-[90px]",
    inline: "h-[250px]",
    history: "h-[100px]",
  };

  // Initialize AdSense when component mounts (for free tier users only)
  useEffect(() => {
    // Only initialize for free tier users (not admins)
    if (loading || subscription.tier !== "free" || subscription.isAdmin) {
      return;
    }

    // Prevent double initialization
    if (adInitialized.current) {
      return;
    }

    if (!adRef.current) {
      return;
    }

    // Try to load ad
    try {
      // @ts-expect-error - adsbygoogle is added by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adInitialized.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [loading, subscription.tier]);

  // Don't show ads for paid users, admins, or while loading
  if (loading || subscription.tier !== "free" || subscription.isAdmin) {
    return null;
  }

  // Real AdSense ad
  return (
    <div
      ref={adRef}
      className={`
        ${placementStyles[placement]}
        ${heightStyles[placement]}
        ${className}
        bg-gradient-to-r from-emerald-900/30 to-teal-900/30
        backdrop-blur-sm border-t border-white/10
        overflow-hidden
      `}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {/* Subtle upgrade hint */}
      <div className="absolute bottom-1 right-2 text-[10px] text-white/20">
        <a href="/pricing" className="hover:text-lime-400/50 transition-colors">
          Go ad-free
        </a>
      </div>
    </div>
  );
}
