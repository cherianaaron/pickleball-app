"use client";

import Link from "next/link";
import { useTournament } from "./context/TournamentContext";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";

export default function Home() {
  const { tournament, loading, error, generateBracket, resetTournament } = useTournament();

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

  const canStartTournament = tournament && tournament.players.length >= 2 && !tournament.isStarted;
  const tournamentInProgress = tournament?.isStarted && !tournament.isComplete;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background decorations */}
        <div className="absolute inset-0 pattern-overlay opacity-50" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!tournament?.isStarted ? (
                <>
                  <Link
                    href="/players"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    ➕ Add Players
                  </Link>
                  {canStartTournament && (
                    <button
                      onClick={generateBracket}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      🏆 Start Tournament
                    </button>
                  )}
                  <Link
                    href="/settings"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    ⚙️ Settings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/bracket"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    📊 View Bracket
                  </Link>
                  <button
                    onClick={resetTournament}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    🔄 New Tournament
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats/Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass rounded-3xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-3xl font-bold text-white mb-1">
                {tournament?.players.length || 0}
              </p>
              <p className="text-white/50">Players</p>
            </div>
            <div className="glass rounded-3xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-3xl font-bold text-white mb-1">
                {tournament?.matches.filter(m => m.isComplete).length || 0}
                <span className="text-white/30 text-xl"> / {tournament?.matches.length || 0}</span>
              </p>
              <p className="text-white/50">Matches</p>
            </div>
            <div className="glass rounded-3xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">
                {tournament?.isComplete ? "🏆" : tournamentInProgress ? "⚡" : "💤"}
              </div>
              <p className="text-lg font-bold text-white mb-1">
                {tournament?.isComplete 
                  ? "Complete!" 
                  : tournamentInProgress 
                    ? "In Progress" 
                    : "Not Started"}
              </p>
              <p className="text-white/50">Status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "👥",
                title: "Add Players",
                description: "Enter all participating players for your tournament",
              },
              {
                icon: "🎲",
                title: "Generate Bracket",
                description: "Automatically create a randomized single-elimination bracket",
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

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-white/30 text-sm">
        <p>Made with 🏓 for pickleball enthusiasts</p>
      </footer>
    </div>
  );
}
