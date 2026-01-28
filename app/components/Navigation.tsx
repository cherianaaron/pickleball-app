"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { TIER_NAMES } from "../lib/tier-limits";

// Navbar icon components using currentColor for theme matching
const NavIcons = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11.5 12 4l8 7.5"/>
        <path d="M6.5 10.5V20h11V10.5"/>
        <circle cx="10.2" cy="15.2" r="0.7"/>
        <circle cx="12" cy="14.3" r="0.7"/>
        <circle cx="13.8" cy="15.2" r="0.7"/>
      </g>
    </svg>
  ),
  players: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="9" r="2"/>
        <circle cx="16" cy="9" r="2"/>
        <path d="M4.5 19c.8-3 2.6-4.8 5.5-4.8"/>
        <path d="M19.5 19c-.8-3-2.6-4.8-5.5-4.8"/>
        <circle cx="12" cy="13.2" r="1.1"/>
        <circle cx="11.6" cy="12.8" r="0.25"/>
        <circle cx="12.4" cy="12.8" r="0.25"/>
        <circle cx="12" cy="13.7" r="0.25"/>
      </g>
    </svg>
  ),
  roundRobin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.2 7.2a6.5 6.5 0 0 1 10 2.1"/>
        <path d="M18 6.8v3.6h-3.6"/>
        <path d="M16.8 16.8a6.5 6.5 0 0 1-10-2.1"/>
        <path d="M6 17.2v-3.6h3.6"/>
        <circle cx="12" cy="12" r="1.2"/>
        <circle cx="11.6" cy="11.6" r="0.25"/>
        <circle cx="12.4" cy="11.6" r="0.25"/>
        <circle cx="12" cy="12.5" r="0.25"/>
      </g>
    </svg>
  ),
  bracket: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6h3v3"/>
        <path d="M6 18h3v-3"/>
        <path d="M9 9h3v2"/>
        <path d="M9 15h3v-2"/>
        <path d="M15 10h3v4h-3"/>
        <path d="M12 11h3"/>
        <path d="M12 13h3"/>
      </g>
    </svg>
  ),
  history: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l3 3v15H7z"/>
        <path d="M14 3v3h3"/>
        <path d="M12 12.2v2.8l2 1.2"/>
        <circle cx="12" cy="14" r="4.2"/>
      </g>
    </svg>
  ),
  join: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6H6v12h2"/>
        <path d="M16 6h2v12h-2"/>
        <path d="M12 9v6"/>
        <path d="M9 12h6"/>
      </g>
    </svg>
  ),
  pricing: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </g>
    </svg>
  ),
  howItWorks: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19c-2.2-1.6-4.7-2.2-7.5-2.2V6.8C7.3 6.8 9.8 7.4 12 9"/>
        <path d="M12 19c2.2-1.6 4.7-2.2 7.5-2.2V6.8C16.7 6.8 14.2 7.4 12 9"/>
        <path d="M9.2 12.2h2.2v2.2H9.2z"/>
        <path d="M12.6 13.3h2.2"/>
        <path d="M11.4 14.4h1.2"/>
      </g>
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.8l1 .6 1.4-.3.8 1.4 1.3.5v1.6l.9 1.1-.9 1.1v1.6l-1.3.5-.8 1.4-1.4-.3-1 .6-1-.6-1.4.3-.8-1.4-1.3-.5v-1.6l-.9-1.1.9-1.1V6l1.3-.5.8-1.4 1.4.3z"/>
        <circle cx="12" cy="12" r="1.7"/>
        <circle cx="11.6" cy="11.6" r="0.25"/>
        <circle cx="12.4" cy="11.6" r="0.25"/>
        <circle cx="12" cy="12.5" r="0.25"/>
      </g>
    </svg>
  ),
};

type IconKey = keyof typeof NavIcons;

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { subscription, isTrialing } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Different navigation links based on auth state
  const authenticatedLinks: { href: string; label: string; icon: IconKey }[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/players", label: "Players", icon: "players" },
    { href: "/round-robin", label: "Round Robin", icon: "roundRobin" },
    { href: "/bracket", label: "Bracket", icon: "bracket" },
    { href: "/history", label: "History", icon: "history" },
    { href: "/join", label: "Join", icon: "join" },
    { href: "/pricing", label: "Pricing", icon: "pricing" },
    { href: "/faq", label: "How It Works", icon: "howItWorks" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  const publicLinks: { href: string; label: string; icon?: IconKey }[] = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
  ];

  const links = user ? authenticatedLinks : publicLinks;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  // Get user display name or email
  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  // Get current page info for mobile display
  const currentPage = links.find(link => link.href === pathname) || links[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 backdrop-blur-lg border-b border-lime-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-lime-400/30 group-hover:shadow-lime-400/50 transition-shadow p-1.5">
              <img src="/pickleball.svg" alt="PickleBracket" className="w-full h-full" />
            </div>
            <span className="text-xl font-black tracking-tight text-white hidden sm:inline">
              PICKLE<span className="text-lime-400">BRACKET</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-1 ml-6 flex-nowrap">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const icon = 'icon' in link && link.icon ? NavIcons[link.icon as IconKey] : null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap inline-flex items-center gap-1.5
                    ${
                      isActive
                        ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  {icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Auth Button */}
            <div className="ml-2 pl-2 border-l border-white/20">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="inline-flex items-center h-9 pl-3 pr-7 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()!} 
                        alt={getUserDisplayName()} 
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center text-emerald-900 text-xs font-bold mr-2">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white text-sm font-medium whitespace-nowrap">
                      {getUserDisplayName()}
                    </span>
                    <span className={`text-white/60 text-xs transition-transform duration-300 ml-5 ${showUserMenu ? "rotate-180" : ""}`}>▼</span>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-xl border border-lime-400/20 shadow-xl shadow-black/30 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-medium truncate">{getUserDisplayName()}</p>
                          <span className={`
                            px-2 py-0.5 rounded-full text-[10px] font-bold
                            ${subscription.tier === "league" 
                              ? "bg-gradient-to-r from-orange-400 to-red-400 text-white"
                              : subscription.tier === "club"
                              ? "bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900"
                              : "bg-white/20 text-white/60"
                            }
                          `}>
                            {TIER_NAMES[subscription.tier].toUpperCase()}
                            {isTrialing && " (Trial)"}
                          </span>
                        </div>
                        <p className="text-white/50 text-xs truncate">{user.email}</p>
                      </div>
                      {subscription.tier === "free" && (
                        <Link
                          href="/pricing"
                          className="w-full px-4 py-2 text-left text-sm text-lime-400 hover:bg-lime-400/10 transition-colors flex items-center gap-2"
                        >
                          <span>✨</span>
                          Upgrade to Pro
                        </Link>
                      )}
                      <Link
                        href="/settings#billing"
                        className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <span>💳</span>
                        Billing
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300 whitespace-nowrap"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden relative" ref={menuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                ${isMobileMenuOpen 
                  ? "bg-lime-400 text-emerald-900" 
                  : "bg-white/10 text-white"
                }
              `}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {'icon' in currentPage && currentPage.icon ? NavIcons[currentPage.icon as IconKey] : null}
              <span>{currentPage.label}</span>
              <span className={`transition-transform duration-300 ${isMobileMenuOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl border border-lime-400/20 shadow-xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  const icon = 'icon' in link && link.icon ? NavIcons[link.icon as IconKey] : null;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-lime-400/20 text-lime-400 border-l-4 border-lime-400"
                            : "text-white/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent"
                        }
                      `}
                    >
                      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
                      <span>{link.label}</span>
                      {isActive && <span className="ml-auto text-xs">●</span>}
                    </Link>
                  );
                })}
                
                {/* Auth option in mobile menu */}
                <div className="border-t border-white/10 mt-1 pt-1">
                  {loading ? (
                    <div className="px-4 py-3">
                      <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                    </div>
                  ) : user ? (
                    <>
                      <div className="px-4 py-2 flex items-center gap-3">
                        {getUserAvatar() ? (
                          <img 
                            src={getUserAvatar()!} 
                            alt={getUserDisplayName()} 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-emerald-900 text-sm font-bold">
                            {getUserDisplayName().charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium truncate">{getUserDisplayName()}</p>
                            <span className={`
                              px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0
                              ${subscription.tier === "league" 
                                ? "bg-gradient-to-r from-orange-400 to-red-400 text-white"
                                : subscription.tier === "club"
                                ? "bg-lime-400 text-emerald-900"
                                : "bg-white/20 text-white/60"
                              }
                            `}>
                              {TIER_NAMES[subscription.tier].toUpperCase()}
                            </span>
                          </div>
                          <p className="text-white/50 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                      {subscription.tier === "free" && (
                        <Link
                          href="/pricing"
                          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-lime-400 hover:bg-lime-400/10 border-l-4 border-transparent transition-all duration-200"
                        >
                          <span className="text-lg">✨</span>
                          <span>Upgrade to Pro</span>
                        </Link>
                      )}
                      <Link
                        href="/settings#billing"
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 border-l-4 border-transparent transition-all duration-200"
                      >
                        <span className="text-lg">💳</span>
                        <span>Billing</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 border-l-4 border-transparent transition-all duration-200"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-lime-400 hover:bg-lime-400/10 border-l-4 border-transparent transition-all duration-200"
                    >
                      <span className="text-lg">🔐</span>
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
