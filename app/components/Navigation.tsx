"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/players", label: "Players", icon: "👥" },
    { href: "/bracket", label: "Bracket", icon: "🏆" },
    { href: "/history", label: "History", icon: "📜" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 backdrop-blur-lg border-b border-lime-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-lime-400/30 group-hover:shadow-lime-400/50 transition-shadow">
              <span className="text-xl">🥒</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white hidden sm:inline">
              PICKLE<span className="text-lime-400">BRACKET</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                    ${
                      isActive
                        ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  <span className="sm:mr-1.5">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
