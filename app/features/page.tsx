"use client";

import Link from "next/link";
import { BracketIcon, RoundRobinIcon, PlayersIcon, JoinIcon, HistoryIcon, SettingsIcon } from "../components/Icons";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6">
            Powerful Features for
            <span className="block gradient-text">Every Tournament</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Everything you need to run professional-quality pickleball tournaments, 
            from casual club play to competitive leagues.
          </p>
        </div>
      </section>

      {/* Bracket Tournaments */}
      <section id="bracket" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-lime-400/20 flex items-center justify-center text-lime-400">
                    <BracketIcon size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Bracket Tournaments</h2>
                </div>
                <p className="text-white/70 text-lg mb-6">
                  Classic single-elimination brackets that automatically advance winners. 
                  Perfect for playoffs, knockouts, and competitive events.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatic bracket generation for any number of players",
                    "Smart seeding with BYEs for uneven numbers",
                    "Real-time score entry and winner advancement",
                    "Visual bracket display with match progression",
                    "Champion celebration with confetti animation",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="text-lime-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-lime-400/10 rounded-xl border border-lime-400/30">
                    <span className="text-white font-medium">Seed 1</span>
                    <span className="text-lime-400 font-bold">11</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-white/60">Seed 8</span>
                    <span className="text-white/40">5</span>
                  </div>
                  <div className="h-8 flex items-center justify-center">
                    <div className="w-px h-full bg-lime-400/30"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-lime-400/20 rounded-xl border border-lime-400/50">
                    <span className="text-lime-400 font-bold">🏆 Champion</span>
                    <span className="text-lime-400">Seed 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Round Robin */}
      <section id="round-robin" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-400/20 flex items-center justify-center text-orange-400">
                    <RoundRobinIcon size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Round Robin</h2>
                </div>
                <p className="text-white/70 text-lg mb-6">
                  Every team plays every other team. Fair, comprehensive competition 
                  with automatic standings and tiebreakers.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatic match scheduling for all teams",
                    "Live standings with wins, losses, and point differential",
                    "Support for 5 concurrent courts with rotating waits",
                    "Fair distribution of bye/wait rounds",
                    "Seamless transition to playoff brackets",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="text-orange-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:order-1 bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-white font-semibold mb-4">Live Standings</h4>
                <div className="space-y-2">
                  {[
                    { rank: 1, team: "Team Alpha", w: 5, l: 0, diff: "+42" },
                    { rank: 2, team: "Team Beta", w: 4, l: 1, diff: "+28" },
                    { rank: 3, team: "Team Gamma", w: 3, l: 2, diff: "+15" },
                  ].map((row) => (
                    <div key={row.rank} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${row.rank === 1 ? 'bg-lime-400 text-emerald-900' : 'bg-white/10 text-white/60'}`}>
                        {row.rank}
                      </span>
                      <span className="text-white flex-1">{row.team}</span>
                      <span className="text-white/60 text-sm">{row.w}-{row.l}</span>
                      <span className="text-lime-400 text-sm font-medium">{row.diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pool Play */}
      <section id="pools" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 left-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-400/20 flex items-center justify-center text-blue-400">
                    <PlayersIcon size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Pool Play</h2>
                </div>
                <p className="text-white/70 text-lg mb-6">
                  Divide teams into balanced pools for manageable group stages. 
                  Ideal for larger tournaments with multiple skill levels.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatic pool assignment (Pool A, Pool B, etc.)",
                    "Separate standings for each pool",
                    "Cross-pool matches for variety",
                    "Top teams from each pool advance to playoffs",
                    "Color-coded pool identification",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="text-blue-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
                    <h5 className="text-blue-400 font-bold mb-3">Pool A</h5>
                    <div className="space-y-2 text-sm text-white/70">
                      <div>1. Team One</div>
                      <div>2. Team Two</div>
                      <div>3. Team Three</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/30">
                    <h5 className="text-purple-400 font-bold mb-3">Pool B</h5>
                    <div className="space-y-2 text-sm text-white/70">
                      <div>1. Team Four</div>
                      <div>2. Team Five</div>
                      <div>3. Team Six</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playoffs */}
      <section id="playoffs" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-400/20 flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">Automatic Playoffs</h2>
                </div>
                <p className="text-white/70 text-lg mb-6">
                  Seamlessly transition from round robin to playoff brackets. 
                  Top teams are automatically seeded based on standings.
                </p>
                <ul className="space-y-3">
                  {[
                    "One-click playoff bracket creation",
                    "Top 6 teams advance with proper seeding",
                    "Seeds 1 & 2 get first-round byes",
                    "Bronze medal match included",
                    "Championship and 3rd place games",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="text-purple-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:order-1 bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-white font-bold text-xl mb-2">Pool Play Complete!</div>
                <div className="text-white/60 mb-4">Ready to start playoffs</div>
                <div className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 text-white font-bold">
                  Start Playoffs →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration */}
      <section id="collaboration" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-400/20 flex items-center justify-center text-green-400">
                    <JoinIcon size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Live Collaboration</h2>
                </div>
                <p className="text-white/70 text-lg mb-6">
                  Share your tournament and let others help manage it. 
                  Multiple people can enter scores simultaneously with real-time sync.
                </p>
                <ul className="space-y-3">
                  {[
                    "Generate shareable invite codes",
                    "Multiple users can join any tournament",
                    "Real-time score synchronization",
                    "All collaborators see live updates",
                    "Perfect for large events with multiple courts",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="text-green-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <div className="text-white/60 text-sm mb-2">Share this code:</div>
                  <div className="inline-block px-6 py-3 bg-white/10 rounded-xl font-mono text-2xl text-lime-400 tracking-widest">
                    ABC123
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="text-white/60 text-sm mb-3">Collaborators:</div>
                  <div className="flex -space-x-2">
                    {["A", "B", "C", "+2"].map((initial, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center text-emerald-900 text-xs font-bold border-2 border-teal-900">
                        {initial}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">More Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <HistoryIcon size={24} />,
                title: "Tournament History",
                description: "Save and revisit past tournaments. Track champions and stats over time.",
                color: "amber",
              },
              {
                icon: <SettingsIcon size={24} />,
                title: "Custom Settings",
                description: "Set winning scores, game timers, and match rules to fit your play style.",
                color: "lime",
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                description: "Works great on phones and tablets. Score games right from the court.",
                color: "cyan",
              },
              {
                icon: "⏱️",
                title: "Game Timers",
                description: "Built-in countdown timers to keep matches moving on schedule.",
                color: "orange",
              },
              {
                icon: "📊",
                title: "Live Standings",
                description: "Automatic standings calculation with tiebreakers and point differentials.",
                color: "purple",
              },
              {
                icon: "🎉",
                title: "Victory Celebrations",
                description: "Celebrate champions with confetti and animated winner displays.",
                color: "pink",
              },
            ].map((feature, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-400/20 flex items-center justify-center text-${feature.color}-400 mb-4`}>
                  {typeof feature.icon === "string" ? (
                    <span className="text-2xl">{feature.icon}</span>
                  ) : (
                    feature.icon
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Create your first tournament in minutes. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
  );
}
