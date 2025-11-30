"use client";

import { useTournament } from "../context/TournamentContext";
import Link from "next/link";

export default function WinnerDisplay() {
  const { tournament, resetTournament, showWinnerCelebration, dismissWinnerCelebration } = useTournament();

  // Only show if tournament just completed in this session
  if (!showWinnerCelebration || !tournament?.isComplete || !tournament.champion) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Close button */}
      <button
        onClick={dismissWinnerCelebration}
        className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all text-2xl"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900">
        {/* Confetti-like particles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ["#a3e635", "#fde047", "#22d3ee", "#f472b6", "#fb923c"][
                  Math.floor(Math.random() * 5)
                ],
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative text-center z-10 animate-in fade-in zoom-in duration-500">
        {/* Trophy */}
        <div className="relative inline-block mb-8">
          <div className="text-[120px] animate-bounce-slow drop-shadow-2xl">🏆</div>
          <div className="absolute inset-0 blur-3xl bg-yellow-400/30 -z-10 animate-pulse" />
        </div>

        {/* Champion name */}
        <div className="mb-8">
          <p className="text-lime-400 text-xl font-semibold uppercase tracking-widest mb-4 animate-in slide-in-from-bottom duration-500 delay-200">
            Tournament Champion
          </p>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 animate-in slide-in-from-bottom duration-500 delay-300">
            {tournament.champion.name}
          </h1>
          <div className="flex items-center justify-center gap-3 animate-in slide-in-from-bottom duration-500 delay-400">
            <span className="text-2xl">🎉</span>
            <p className="text-white/60 text-xl">{tournament.name} Winner</p>
            <span className="text-2xl">🎉</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-12 animate-in slide-in-from-bottom duration-500 delay-500">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-white/50 text-sm">Players</p>
            <p className="text-2xl font-bold text-white">{tournament.players.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-white/50 text-sm">Rounds</p>
            <p className="text-2xl font-bold text-white">{tournament.rounds}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-white/50 text-sm">Matches</p>
            <p className="text-2xl font-bold text-white">{tournament.matches.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-in slide-in-from-bottom duration-500 delay-700">
          <Link
            href="/"
            onClick={dismissWinnerCelebration}
            className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all"
          >
            🏠 Home
          </Link>
          <Link
            href="/bracket"
            onClick={dismissWinnerCelebration}
            className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all"
          >
            📊 View Bracket
          </Link>
          <Link
            href="/history"
            onClick={dismissWinnerCelebration}
            className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all"
          >
            📜 History
          </Link>
          <button
            onClick={() => {
              dismissWinnerCelebration();
              resetTournament();
            }}
            className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            🆕 New Tournament
          </button>
        </div>
      </div>
    </div>
  );
}
