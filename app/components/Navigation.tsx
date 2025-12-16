"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/players", label: "Players", icon: "👥" },
    { href: "/round-robin", label: "Round Robin", icon: "🔄" },
    { href: "/bracket", label: "Bracket", icon: "🏆" },
    { href: "/history", label: "History", icon: "📜" },
    { href: "/faq", label: "FAQ", icon: "❓" },
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
  }, [pathname]);

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
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                    ${
                      isActive
                        ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
