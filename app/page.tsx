"use client";

import Link from "next/link";
import { useTournament } from "./context/TournamentContext";
import { useAuth } from "./context/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";

export default function Home() {
  const { tournament, loading, error, generateBracket, resetTournament } = useTournament();
  const { user, loading: authLoading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading tournament..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background decorations */}
        <div className="absolute inset-0 pattern-overlay opacity-50" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-8">
            {/* Floating pickleball */}
            <div className="inline-block mb-8 animate-float">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center shadow-2xl shadow-lime-400/30 animate-pulse-glow p-4">
                <img src="/pickleball.svg" alt="Pickleball" className="w-full h-full" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight">
              Pickle<span className="gradient-text">Bracket</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-8">
              Create epic pickleball tournaments, generate brackets, track scores, and crown your champions!
            </p>

            {/* Quick actions */}
            <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto">
              {!tournament?.isStarted ? (
                <>
                  {/* New User Guide */}
                  <div className="w-full">
                    <Link
                      href="/faq"
                      className="w-full block px-6 py-3 rounded-2xl text-base font-semibold bg-white/10 backdrop-blur-sm text-white border border-lime-400/30 hover:bg-white/20 hover:border-lime-400/50 transition-all duration-300 text-center"
                    >
                      📖 New here? Learn How It Works
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-white/50 text-sm font-medium">Start a Tournament</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>

                  {/* Login prompt if not signed in */}
                  {!user && !authLoading && (
                    <div className="w-full p-4 rounded-2xl bg-lime-400/10 border border-lime-400/30 mb-2">
                      <p className="text-white/80 text-sm mb-3 text-center">
                        🔐 Sign in to create and save your tournaments
                      </p>
                      <Link
                        href="/login"
                        className="w-full block px-6 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 text-center hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        Sign In to Get Started
                      </Link>
                    </div>
                  )}

                  {/* Round Robin Option */}
                  <div className="w-full text-center">
                    <p className="text-white/70 text-lg mb-3">Create a Round Robin Tournament</p>
                    <Link
                      href={user ? "/round-robin" : "/login?redirect=/round-robin"}
                      className="w-full block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      🔄 Round Robin
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-white/50 text-sm font-medium">Or</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>

                  {/* Bracket Option */}
                  <div className="w-full text-center">
                    <p className="text-white/70 text-lg mb-3">Create a Bracket (Single Elimination)</p>
                    <Link
                      href={user ? "/players" : "/login?redirect=/players"}
                      className="w-full block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      🏆 Bracket
                    </Link>
                  </div>

                  {/* Settings at bottom */}
                  <div className="w-full pt-4">
                    <Link
                      href="/settings"
                      className="w-full block px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300 text-center"
                    >
                      ⚙️ Settings
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/bracket"
                    className="w-full px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300 text-center"
                  >
                    📊 View Bracket
                  </Link>
                  <button
                    onClick={resetTournament}
                    className="w-full px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    🔄 New Tournament
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "🎯",
                title: "Choose Tournament Style",
                description: "Create a Round Robin or Bracket style tournament. Adjust settings before starting.",
              },
              {
                icon: "👥",
                title: "Add Teams/Players",
                description: "Enter all participants and generate your tournament bracket or pools",
              },
              {
                icon: "📝",
                title: "Enter Scores",
                description: "Record match results with official pickleball scoring",
              },
              {
                icon: "🏆",
                title: "Crown Champion",
                description: "Celebrate the winner with a glorious victory screen",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative glass rounded-3xl p-6 text-center group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-emerald-900 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/50">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* How It Works Link */}
          <p className="text-center text-white/60 mt-8">
            Visit the <Link href="/faq" className="text-lime-400 hover:text-lime-300 underline underline-offset-2 font-medium">How It Works</Link> section for more help on how to use the app
          </p>
        </div>
      </section>

      {/* Current Tournament Info */}
      {tournament && tournament.players.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto glass rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{tournament.name}</h2>
              {!tournament.isStarted && tournament.players.length >= 2 && (
                <button
                  onClick={generateBracket}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Generate Bracket
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tournament.players.slice(0, 8).map((player) => (
                <div
                  key={player.id}
                  className="bg-white/5 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border border-lime-400/30">
                    <span className="text-sm font-bold text-lime-400">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white/80 text-sm truncate">{player.name}</span>
                </div>
              ))}
              {tournament.players.length > 8 && (
                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-white/50 text-sm">
                    +{tournament.players.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
