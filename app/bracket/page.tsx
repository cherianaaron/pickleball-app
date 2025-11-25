"use client";

import Link from "next/link";
import Bracket from "../components/Bracket";
import { useTournament } from "../context/TournamentContext";

export default function BracketPage() {
  const { tournament, resetTournament } = useTournament();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {tournament?.name || "Tournament Bracket"}
          </h1>
          <p className="text-white/50">
            {tournament?.isStarted 
              ? "Click on matches to enter scores" 
              : "Generate a bracket to start the tournament"}
          </p>
        </div>

        {/* Stats Bar */}
        {tournament?.isStarted && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-white/50 text-sm">Players:</span>
              <span className="text-white font-bold">{tournament.players.length}</span>
            </div>
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-white/50 text-sm">Rounds:</span>
              <span className="text-white font-bold">{tournament.rounds}</span>
            </div>
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-white/50 text-sm">Matches Complete:</span>
              <span className="text-lime-400 font-bold">
                {tournament.matches.filter(m => m.isComplete).length}
              </span>
              <span className="text-white/30">/</span>
              <span className="text-white font-bold">{tournament.matches.length}</span>
            </div>
            {tournament.champion && (
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 border-lime-400/30 border">
                <span className="text-lime-400 text-sm">🏆 Champion:</span>
                <span className="text-lime-400 font-bold">{tournament.champion.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Bracket */}
        <div className="glass rounded-3xl p-6 sm:p-8 mb-8">
          <Bracket />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!tournament?.isStarted && (
            <Link
              href="/players"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              ➕ Add Players First
            </Link>
          )}
          
          {tournament?.isStarted && (
            <button
              onClick={resetTournament}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              🔄 Start New Tournament
            </button>
          )}
        </div>

        {/* Instructions */}
        {tournament?.isStarted && !tournament.isComplete && (
          <div className="mt-12 glass rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>📋</span> How to Enter Scores
            </h3>
            <ul className="text-white/60 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-lime-400">1.</span>
                Click on any match that has both players assigned
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400">2.</span>
                Enter the final score for each player (games go to 11, win by 2)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400">3.</span>
                The winner automatically advances to the next round
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400">4.</span>
                Complete all matches to crown the tournament champion!
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

