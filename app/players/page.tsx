"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PlayerForm from "../components/PlayerForm";
import PlayerList from "../components/PlayerList";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useTournament } from "../context/TournamentContext";

export default function PlayersPage() {
  const { tournament, loading, error, generateBracket, setTournamentName, resetTournament } = useTournament();
  
  // Local state for tournament name with debounced save
  const [localName, setLocalName] = useState(tournament?.name || "");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Sync local state when tournament changes (e.g., loading a different tournament)
  useEffect(() => {
    if (tournament?.name !== undefined) {
      setLocalName(tournament.name);
    }
  }, [tournament?.name]);
  
  // Debounced save to database
  const handleNameChange = (value: string) => {
    setLocalName(value);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer to save after 500ms of no typing
    debounceTimer.current = setTimeout(() => {
      setTournamentName(value);
    }, 500);
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading players..." />
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

  // No active tournament - prompt user to create one
  if (!tournament) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6">
              <span className="text-4xl">👥</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">No Active Bracket Tournament</h1>
            <p className="text-white/60 mb-4">
              Create a new bracket-style tournament to start adding players and generating brackets.
            </p>
            <p className="text-orange-400/80 text-sm mb-8">
              ⚠️ This page is for <strong>Bracket tournaments only</strong>. For Round Robin, go to the <Link href="/round-robin" className="underline hover:text-orange-300">Round Robin page</Link>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetTournament}
                className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                ➕ Create New Tournament
              </button>
              <Link
                href="/history"
                className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                📜 Load from History
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canGenerateBracket = tournament && tournament.players.length >= 2 && !tournament.isStarted;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-3xl">👥</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Players</h1>
          <p className="text-white/50">Add participants for your pickleball tournament</p>
          <p className="text-orange-400/80 text-sm mt-2">
            ⚠️ This page is for <strong>Bracket tournaments only</strong>. For Round Robin, go to the <Link href="/round-robin" className="underline hover:text-orange-300">Round Robin page</Link>.
          </p>
        </div>

        {/* Tournament Name */}
        {!tournament?.isStarted && (
          <div className="mb-8">
            <label className="block text-white/60 text-sm font-medium mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter tournament name..."
              className="w-full px-5 py-4 rounded-2xl text-lg font-medium bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-lime-400 focus:bg-white/15 transition-all duration-300"
            />
          </div>
        )}

        {/* Add Player Form */}
        <div className="mb-12">
          <PlayerForm />
        </div>

        {/* Player Count & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              Players ({tournament?.players.length || 0})
            </h2>
            {tournament && tournament.players.length < 2 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                Need at least 2 players
              </span>
            )}
          </div>

          {canGenerateBracket && (
            <button
              onClick={generateBracket}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              🏆 Generate Bracket & Start
            </button>
          )}

          {tournament?.isStarted && (
            <Link
              href="/bracket"
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              📊 View Bracket
            </Link>
          )}
        </div>

        {/* Player List */}
        <PlayerList />

        {/* Bracket Size Info */}
        {tournament && tournament.players.length >= 2 && !tournament.isStarted && (
          <div className="mt-12 glass rounded-2xl p-6 text-center">
            <p className="text-white/60 mb-2">
              With <span className="text-lime-400 font-bold">{tournament.players.length}</span> players, 
              you&apos;ll have a bracket of{" "}
              <span className="text-lime-400 font-bold">
                {Math.pow(2, Math.ceil(Math.log2(tournament.players.length)))}
              </span>{" "}
              slots
            </p>
            <p className="text-white/40 text-sm">
              {Math.pow(2, Math.ceil(Math.log2(tournament.players.length))) - tournament.players.length > 0 && (
                <>
                  {Math.pow(2, Math.ceil(Math.log2(tournament.players.length))) - tournament.players.length} player(s) will receive a bye in round 1
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

