"use client";

import Link from "next/link";
import { BracketIcon, RoundRobinIcon, PlayersIcon, JoinIcon, HistoryIcon } from "./Icons";

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Background decorations */}
        <div className="absolute inset-0 pattern-overlay opacity-50" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Floating pickleball */}
          <div className="inline-block mb-8 animate-float">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center shadow-2xl shadow-lime-400/30 animate-pulse-glow p-4">
              <img src="/pickleball.svg" alt="Pickleball" className="w-full h-full" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight">
            Pickle<span className="gradient-text">Bracket</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-12">
            The ultimate tournament management platform for pickleball. Create brackets, run round robins, 
            track scores in real-time, and crown your champions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Get Started Free
            </Link>
            <Link
              href="/features"
              className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            Everything You Need to Run Tournaments
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-16">
            From casual club play to competitive leagues, PickleBracket handles it all with ease.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Bracket Tournaments */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border border-lime-400/30 mb-6 text-lime-400 group-hover:scale-110 transition-transform">
                <BracketIcon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bracket Tournaments</h3>
              <p className="text-white/60">
                Single elimination brackets with automatic seeding. Perfect for playoffs and knockout competitions.
              </p>
            </div>

            {/* Round Robin */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400/20 to-yellow-300/20 flex items-center justify-center border border-orange-400/30 mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                <RoundRobinIcon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Round Robin</h3>
              <p className="text-white/60">
                Everyone plays everyone. Automatic scheduling, standings calculation, and pool play management.
              </p>
            </div>

            {/* Pool Play */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-300/20 flex items-center justify-center border border-blue-400/30 mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <PlayersIcon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Pool Play</h3>
              <p className="text-white/60">
                Split teams into pools for balanced competition. Track standings and point differentials automatically.
              </p>
            </div>

            {/* Automatic Playoffs */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-300/20 flex items-center justify-center border border-purple-400/30 mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automatic Playoffs</h3>
              <p className="text-white/60">
                Seamlessly transition from pool play to playoff brackets. Top teams are seeded automatically.
              </p>
            </div>

            {/* Live Collaboration */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-300/20 flex items-center justify-center border border-green-400/30 mb-6 text-green-400 group-hover:scale-110 transition-transform">
                <JoinIcon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Collaboration</h3>
              <p className="text-white/60">
                Share tournaments with invite codes. Multiple users can enter scores in real-time.
              </p>
            </div>

            {/* Tournament History */}
            <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-300/20 flex items-center justify-center border border-amber-400/30 mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                <HistoryIcon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tournament History</h3>
              <p className="text-white/60">
                Save and review past tournaments. Track champions, scores, and player statistics over time.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-lime-400 hover:text-lime-300 font-semibold transition-colors"
            >
              View All Features
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-16">
            Get Started in Minutes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                description: "Sign in with Google or Apple. It's free to get started.",
              },
              {
                step: "2",
                title: "Add Players",
                description: "Enter your players or teams. Name your tournament.",
              },
              {
                step: "3",
                title: "Start Playing",
                description: "Generate brackets or pools and start recording scores.",
              },
              {
                step: "4",
                title: "Crown Champion",
                description: "Celebrate the winner with our victory celebration!",
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center text-emerald-900 font-black text-2xl mx-auto mb-4 shadow-lg shadow-lime-400/30">
                  {item.step}
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-lime-400/50 to-transparent" />
                )}
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-lime-400/10 to-yellow-300/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Run Your Tournament?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Join pickleball players who use PickleBracket to organize their games. 
                Free to start, no credit card required.
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
