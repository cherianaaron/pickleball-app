"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-emerald-900/50 via-teal-900/50 to-emerald-900/50 border-t border-lime-400/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center p-1">
              <img src="/pickleball.svg" alt="PickleBracket" className="w-full h-full" />
            </div>
            <span className="text-white/50 text-sm">
              © {currentYear} PickleBracket
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-white/50 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/cookies" 
              className="text-white/50 hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
