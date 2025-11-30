"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTournament } from "../context/TournamentContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const SCORE_OPTIONS = [5, 7, 9, 11, 15, 21];
const TIMER_OPTIONS = [
  { value: null, label: "No Timer" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
];

export default function SettingsPage() {
  const { tournament, loading, error, updateSettings } = useTournament();
  const [scoreLimit, setScoreLimit] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [gameTimer, setGameTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tournament?.settings) {
      setScoreLimit(tournament.settings.scoreLimit);
      setWinByTwo(tournament.settings.winByTwo);
      setGameTimer(tournament.settings.gameTimerMinutes);
    }
  }, [tournament?.settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateSettings({
      scoreLimit,
      winByTwo,
      gameTimerMinutes: gameTimer,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading settings..." />
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

  const isStarted = tournament?.isStarted;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-3xl">⚙️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/50">Configure your tournament rules</p>
        </div>

        {/* Warning if tournament started */}
        {isStarted && (
          <div className="mb-8 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold">Tournament in Progress</p>
              <p className="text-yellow-400/70 text-sm">
                Some settings cannot be changed once the tournament has started.
              </p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-8">
          {/* Score Limit */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Score Limit</h3>
                <p className="text-white/50 text-sm">Points needed to win a game</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SCORE_OPTIONS.map((score) => (
                <button
                  key={score}
                  onClick={() => !isStarted && setScoreLimit(score)}
                  disabled={isStarted}
                  className={`
                    py-3 px-4 rounded-xl font-bold text-lg transition-all
                    ${scoreLimit === score
                      ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                    }
                    ${isStarted ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Win by Two */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✌️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Win by Two</h3>
                  <p className="text-white/50 text-sm">Require 2-point lead to win</p>
                </div>
              </div>
              
              <button
                onClick={() => !isStarted && setWinByTwo(!winByTwo)}
                disabled={isStarted}
                className={`
                  relative w-16 h-9 rounded-full transition-all
                  ${winByTwo ? "bg-lime-400" : "bg-white/20"}
                  ${isStarted ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-all
                    ${winByTwo ? "left-8" : "left-1"}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Game Timer */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⏱️</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Game Timer</h3>
                <p className="text-white/50 text-sm">Optional time limit per game</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIMER_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setGameTimer(option.value)}
                  className={`
                    py-3 px-4 rounded-xl font-medium transition-all
                    ${gameTimer === option.value
                      ? "bg-lime-400 text-emerald-900 shadow-lg shadow-lime-400/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Current Rules</h3>
            <div className="bg-white/5 rounded-2xl p-4 font-mono text-sm">
              <p className="text-lime-400">
                First to <span className="text-white font-bold">{scoreLimit}</span> points
                {winByTwo && <span className="text-white/70">, win by 2</span>}
              </p>
              {gameTimer ? (
                <p className="text-yellow-400 mt-1">
                  ⏱️ {gameTimer} minute game timer
                </p>
              ) : (
                <p className="text-white/40 mt-1">No time limit</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              w-full py-4 rounded-2xl text-lg font-bold transition-all
              ${saved
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-[1.02] active:scale-[0.98]"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

