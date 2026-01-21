"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useTournament } from "../context/TournamentContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { TIER_NAMES, TIER_LIMITS } from "../lib/tier-limits";
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

function SettingsContent() {
  const { tournament, loading, error, updateSettings, getUserSettingsPreference, saveUserSettingsPreference } = useTournament();
  const { subscription, loading: subLoading, createPortalSession } = useSubscription();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  
  // Initialize with defaults (will be updated from localStorage/tournament on mount)
  const [scoreLimit, setScoreLimit] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [gameTimer, setGameTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Bug report state
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugCategory, setBugCategory] = useState("functionality");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugEmail, setBugEmail] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);

  // Load settings on mount - prioritize tournament settings, fall back to localStorage
  useEffect(() => {
    if (tournament?.settings) {
      setScoreLimit(tournament.settings.scoreLimit);
      setWinByTwo(tournament.settings.winByTwo);
      setGameTimer(tournament.settings.gameTimerMinutes);
    } else if (!settingsLoaded) {
      // No tournament - load from localStorage
      const savedPrefs = getUserSettingsPreference();
      setScoreLimit(savedPrefs.scoreLimit);
      setWinByTwo(savedPrefs.winByTwo);
      setGameTimer(savedPrefs.gameTimerMinutes);
    }
    setSettingsLoaded(true);
  }, [tournament?.settings, settingsLoaded, getUserSettingsPreference]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    const newSettings = {
      scoreLimit,
      winByTwo,
      gameTimerMinutes: gameTimer,
    };
    
    // Always save to localStorage (for future tournaments)
    saveUserSettingsPreference(newSettings);
    
    // Also save to current tournament if one exists
    if (tournament) {
      await updateSettings(newSettings);
    }
    
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
              <span className="bg-transparent px-4 text-white/30 text-sm">Billing</span>
            </div>
          </div>

          {/* Subscription / Billing Section */}
          <div id="billing" className="glass rounded-3xl p-6 scroll-mt-24">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💎</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Subscription</h3>
                <p className="text-white/50 text-sm">Manage your plan and billing</p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <span>🎉</span> Welcome! Your subscription is now active. Enjoy your trial!
              </div>
            )}

            {user ? (
              <>
                {/* Current Plan */}
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Current Plan</span>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold
                      ${subscription.tier === "league" 
                        ? "bg-gradient-to-r from-orange-400 to-red-400 text-white"
                        : subscription.tier === "club"
                        ? "bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900"
                        : "bg-white/10 text-white/60"
                      }
                    `}>
                      {TIER_NAMES[subscription.tier].toUpperCase()}
                    </span>
                  </div>
                  
                  {subscription.tier !== "free" && (
                    <>
                      <div className="text-white text-sm mb-1">
                        Status: <span className={`font-medium ${
                          subscription.status === "active" ? "text-green-400" :
                          subscription.status === "trialing" ? "text-lime-400" :
                          subscription.status === "past_due" ? "text-red-400" :
                          "text-white/60"
                        }`}>
                          {subscription.status === "trialing" ? "🎁 Trial Active" :
                           subscription.status === "active" ? "✓ Active" :
                           subscription.status === "past_due" ? "⚠️ Payment Due" :
                           subscription.status}
                        </span>
                      </div>
                      {subscription.currentPeriodEnd && (
                        <div className="text-white/50 text-xs">
                          {subscription.cancelAtPeriodEnd 
                            ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          }
                        </div>
                      )}
                    </>
                  )}

                  {/* Plan Limits */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-white/40 text-xs mb-2">Your Limits</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-white/60">
                        Tournaments: <span className="text-white">{TIER_LIMITS[subscription.tier].maxActiveTournaments === Infinity ? "∞" : TIER_LIMITS[subscription.tier].maxActiveTournaments}</span>
                      </div>
                      <div className="text-white/60">
                        Players: <span className="text-white">{TIER_LIMITS[subscription.tier].maxPlayersPerTournament === Infinity ? "∞" : TIER_LIMITS[subscription.tier].maxPlayersPerTournament}</span>
                      </div>
                      <div className="text-white/60">
                        Collaborators: <span className="text-white">{TIER_LIMITS[subscription.tier].maxCollaborators === Infinity ? "∞" : TIER_LIMITS[subscription.tier].maxCollaborators}</span>
                      </div>
                      <div className="text-white/60">
                        Round Robin: <span className={TIER_LIMITS[subscription.tier].hasRoundRobin ? "text-lime-400" : "text-red-400"}>{TIER_LIMITS[subscription.tier].hasRoundRobin ? "✓" : "✗"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {subscription.tier === "free" ? (
                    <Link
                      href="/pricing"
                      className="block w-full py-3 px-4 rounded-xl font-bold text-center bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 hover:shadow-lg hover:shadow-lime-400/30 transition-all"
                    >
                      🚀 Upgrade to Pro
                    </Link>
                  ) : (
                    <button
                      onClick={async () => {
                        const url = await createPortalSession();
                        if (url) window.location.href = url;
                      }}
                      className="w-full py-3 px-4 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      ⚙️ Manage Subscription
                    </button>
                  )}
                  
                  {subscription.tier !== "free" && subscription.tier !== "league" && (
                    <Link
                      href="/pricing"
                      className="block w-full py-3 px-4 rounded-xl font-medium text-center bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      ⬆️ Upgrade to League
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-white/60 mb-4">Sign in to manage your subscription</p>
                <Link
                  href="/login?redirect=/settings"
                  className="inline-block px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

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
          <div id="bug-report" className="glass rounded-3xl p-6 scroll-mt-24">
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
            <p className="mt-1 text-center">🎂 Happy birthday Mylynh 🎉</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading settings..." />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
