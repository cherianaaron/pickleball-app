"use client";

import { useState, useEffect, useCallback } from "react";
import { Match, useTournament } from "../context/TournamentContext";

interface ScoreEntryProps {
  match: Match;
  onClose: () => void;
}

export default function ScoreEntry({ match, onClose }: ScoreEntryProps) {
  const { tournament, updateMatchScore } = useTournament();
  const [score1, setScore1] = useState<string>("");
  const [score2, setScore2] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const settings = tournament?.settings;
  const scoreLimit = settings?.scoreLimit ?? 11;
  const winByTwo = settings?.winByTwo ?? true;
  const gameTimerMinutes = settings?.gameTimerMinutes;

  // Initialize timer
  useEffect(() => {
    if (gameTimerMinutes) {
      setTimeRemaining(gameTimerMinutes * 60);
    }
  }, [gameTimerMinutes]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      setTimerExpired(true);
      setTimerRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleStartTimer = () => {
    setTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    if (gameTimerMinutes) {
      setTimeRemaining(gameTimerMinutes * 60);
      setTimerRunning(false);
      setTimerExpired(false);
    }
  };

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

    const winningScore = Math.max(s1, s2);
    const losingScore = Math.min(s1, s2);
    
    // Only enforce score limit if timer hasn't expired
    if (!timerExpired) {
      if (winningScore < scoreLimit) {
        setError(`Winning score must be at least ${scoreLimit}`);
        return;
      }

      if (winByTwo && winningScore - losingScore < 2) {
        setError("Must win by 2 points");
        return;
      }
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

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏓</div>
          <h2 className="text-2xl font-bold text-white">Enter Score</h2>
          <p className="text-white/50 text-sm mt-1">
            Game to {scoreLimit}{winByTwo ? ", win by 2" : ""}
          </p>
        </div>

        {/* Timer Section */}
        {gameTimerMinutes && (
          <div className={`mb-6 p-4 rounded-2xl border ${timerExpired ? "bg-red-500/20 border-red-500/30" : "bg-white/5 border-white/10"}`}>
            <div className="text-center">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Game Timer</p>
              <p className={`text-4xl font-mono font-bold ${timerExpired ? "text-red-400" : timeRemaining && timeRemaining <= 60 ? "text-yellow-400" : "text-white"}`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
              </p>
              {timerExpired && (
                <p className="text-red-400 text-sm mt-2 font-medium">⏰ Time&apos;s up! Enter final scores.</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  disabled={timerExpired}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-lime-400 text-emerald-900 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ▶ Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-400 text-emerald-900 hover:bg-yellow-300 transition-colors"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                type="button"
                onClick={handleResetTimer}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                ↻ Reset
              </button>
            </div>
          </div>
        )}

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
