"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTournament } from "../context/TournamentContext";
import { supabase } from "../lib/supabase";
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

const BUG_CATEGORIES = [
  { value: "ui", label: "🎨 UI/Display Issue" },
  { value: "functionality", label: "⚡ Feature Not Working" },
  { value: "data", label: "💾 Data/Save Issue" },
  { value: "performance", label: "🐌 Performance Problem" },
  { value: "other", label: "📝 Other" },
];

export default function SettingsPage() {
  const { tournament, loading, error, updateSettings } = useTournament();
  const [scoreLimit, setScoreLimit] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [gameTimer, setGameTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Bug report state
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugCategory, setBugCategory] = useState("functionality");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugEmail, setBugEmail] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);

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

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    setBugError(null);

    if (!bugTitle.trim()) {
      setBugError("Please enter a title for the bug report");
      return;
    }

    if (!bugDescription.trim()) {
      setBugError("Please describe the bug");
      return;
    }

    setSubmittingBug(true);

    try {
      const { error: insertError } = await supabase
        .from("bug_reports")
        .insert({
          category: bugCategory,
          title: bugTitle.trim(),
          description: bugDescription.trim(),
          email: bugEmail.trim() || null,
          user_agent: navigator.userAgent,
          url: window.location.href,
        });

      if (insertError) throw insertError;

      setBugSubmitted(true);
      setBugTitle("");
      setBugDescription("");
      setBugEmail("");
      setBugCategory("functionality");

      setTimeout(() => {
        setBugSubmitted(false);
        setShowBugForm(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting bug report:", err);
      setBugError("Failed to submit bug report. Please try again.");
    } finally {
      setSubmittingBug(false);
    }
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
        <div className="mb-12">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
                <span className="text-3xl">⚙️</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-white/50">Configure your tournament rules</p>
          </div>
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

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-4 text-white/30 text-sm">Support</span>
            </div>
          </div>

          {/* Bug Report Section */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🐛</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Report a Bug</h3>
                <p className="text-white/50 text-sm">Help us improve by reporting issues</p>
              </div>
            </div>

            {!showBugForm ? (
              <button
                onClick={() => setShowBugForm(true)}
                className="w-full py-3 px-4 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>📝</span> Submit Bug Report
              </button>
            ) : (
              <form onSubmit={handleSubmitBug} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BUG_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setBugCategory(cat.value)}
                        className={`
                          py-2 px-3 rounded-xl text-sm font-medium transition-all
                          ${bugCategory === cat.value
                            ? "bg-red-400 text-white shadow-lg"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                          }
                        `}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="Brief description of the issue..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-400 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-400 transition-colors resize-none"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={bugEmail}
                    onChange={(e) => setBugEmail(e.target.value)}
                    placeholder="your@email.com - for follow-up questions"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-400 transition-colors"
                  />
                </div>

                {/* Error */}
                {bugError && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {bugError}
                  </div>
                )}

                {/* Success */}
                {bugSubmitted && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                    <span>✓</span> Bug report submitted successfully! Thank you for your feedback.
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBugForm(false);
                      setBugError(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBug || bugSubmitted}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingBug ? "Submitting..." : bugSubmitted ? "✓ Submitted!" : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* App Info */}
          <div className="text-center text-white/30 text-sm">
            <p>PickleBracket v1.0</p>
            <p className="mt-1 flex items-center justify-center gap-2">Made with <img src="/pickleball.svg" alt="pickleball" className="w-5 h-5 inline-block" /> for pickleball enthusiasts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
