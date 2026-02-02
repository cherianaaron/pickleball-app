"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function PublicNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 backdrop-blur-lg border-b border-lime-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img src="/picklebracket-horizontal.png" alt="PickleBracket" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    text-sm font-semibold transition-all duration-300
                    ${isActive
                      ? "text-lime-400"
                      : "text-white/80 hover:text-white"
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Sign In Button */}
            <Link
              href="/login"
              className="px-6 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                      ${isActive
                        ? "bg-lime-400/20 text-lime-400"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
