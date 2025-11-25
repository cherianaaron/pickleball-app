"use client";

import { useState } from "react";
import { Match, useTournament } from "../context/TournamentContext";

interface ScoreEntryProps {
  match: Match;
  onClose: () => void;
}

export default function ScoreEntry({ match, onClose }: ScoreEntryProps) {
  const { updateMatchScore } = useTournament();
  const [score1, setScore1] = useState<string>("");
  const [score2, setScore2] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    if (isNaN(s1) || isNaN(s2)) {
      setError("Please enter valid scores");
      return;
    }

    if (s1 < 0 || s2 < 0) {
      setError("Scores cannot be negative");
      return;
    }

    if (s1 === s2) {
      setError("Scores cannot be tied - there must be a winner");
      return;
    }

    // Standard pickleball scoring - must win by 2, games typically go to 11 or 15
    const winningScore = Math.max(s1, s2);
    const losingScore = Math.min(s1, s2);
    
    if (winningScore < 11) {
      setError("Winning score must be at least 11");
      return;
    }

    if (winningScore - losingScore < 2 && winningScore < 15) {
      setError("Must win by 2 points");
      return;
    }

    updateMatchScore(match.id, s1, s2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-emerald-900 to-teal-900 rounded-3xl p-8 max-w-md w-full border border-lime-400/20 shadow-2xl shadow-lime-400/10 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏓</div>
          <h2 className="text-2xl font-bold text-white">Enter Score</h2>
          <p className="text-white/50 text-sm mt-1">Game to 11, win by 2</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player 1 */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
                  <span className="text-lg font-bold text-lime-400">
                    {match.player1?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white font-medium">{match.player1?.name}</span>
              </div>
              <input
                type="number"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                min="0"
                max="99"
                placeholder="0"
                className="w-20 h-12 rounded-xl bg-white/10 border-2 border-white/20 text-center text-2xl font-bold text-white focus:outline-none focus:border-lime-400 transition-colors"
              />
            </label>
          </div>

          {/* VS divider */}
          <div className="flex items-center justify-center">
            <span className="text-white/30 font-bold text-sm">VS</span>
          </div>

          {/* Player 2 */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
                  <span className="text-lg font-bold text-lime-400">
                    {match.player2?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white font-medium">{match.player2?.name}</span>
              </div>
              <input
                type="number"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                min="0"
                max="99"
                placeholder="0"
                className="w-20 h-12 rounded-xl bg-white/10 border-2 border-white/20 text-center text-2xl font-bold text-white focus:outline-none focus:border-lime-400 transition-colors"
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Submit Score
          </button>
        </form>
      </div>
    </div>
  );
}

