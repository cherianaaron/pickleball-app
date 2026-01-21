"use client";

import { useEffect, useRef } from "react";
import { useSubscription } from "../context/SubscriptionContext";

interface AdBannerProps {
  placement?: "bottom" | "inline" | "history";
  className?: string;
}

export default function AdBanner({ placement = "bottom", className = "" }: AdBannerProps) {
  const { subscription, loading } = useSubscription();
  const adRef = useRef<HTMLDivElement>(null);

  // Don't show ads for paid users
  if (loading || subscription.tier !== "free") {
    return null;
  }

  // Only render on client side
  useEffect(() => {
    // Check if AdSense is configured
    const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    
    if (!adsenseClientId || !adRef.current) {
      return;
    }

    // Try to load ad
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  // Placeholder styles based on placement
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

  // If AdSense is not configured, show a minimal placeholder
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`
          ${placementStyles[placement]}
          ${heightStyles[placement]}
          ${className}
          bg-gradient-to-r from-emerald-900/50 to-teal-900/50
          backdrop-blur-sm border-t border-white/10
          flex items-center justify-center
        `}
      >
        <div className="text-center">
          <p className="text-white/30 text-xs">
            ✨ <span className="text-lime-400/50">Upgrade to Pro</span> for an ad-free experience
          </p>
        </div>
      </div>
    );
  }

  // Real AdSense ad
  return (
    <div
      ref={adRef}
      className={`
        ${placementStyles[placement]}
        ${heightStyles[placement]}
        ${className}
        bg-white/5 backdrop-blur-sm
      `}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot="YOUR_AD_SLOT_ID" // Replace with your actual ad slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
