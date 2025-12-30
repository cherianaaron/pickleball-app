"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/players", label: "Players", icon: "👥" },
    { href: "/round-robin", label: "Round Robin", icon: "🔄" },
    { href: "/bracket", label: "Bracket", icon: "🏆" },
    { href: "/history", label: "History", icon: "📜" },
    { href: "/join", label: "Join", icon: "🤝" },
    { href: "/faq", label: "How It Works", icon: "📖" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

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
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  <span className="mr-1">{link.icon}</span>
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
                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()!} 
                        alt={getUserDisplayName()} 
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-lime-400 flex items-center justify-center text-emerald-900 text-xs font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white text-sm font-medium whitespace-nowrap">
                      {getUserDisplayName()}
                    </span>
                    <span className={`text-white/60 text-xs transition-transform duration-300 ml-1 ${showUserMenu ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-xl border border-lime-400/20 shadow-xl shadow-black/30 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-white text-sm font-medium truncate">{getUserDisplayName()}</p>
                        <p className="text-white/50 text-xs truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
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
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
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
              <span>{currentPage.icon}</span>
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
                      <span className="text-lg">{link.icon}</span>
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
                          <p className="text-white text-sm font-medium truncate">{getUserDisplayName()}</p>
                          <p className="text-white/50 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
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
