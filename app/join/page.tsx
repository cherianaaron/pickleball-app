"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function JoinTournamentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const code = inviteCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError("Please enter a valid invite code");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Try to find bracket tournament with this code
      // Use maybeSingle() to avoid error when no rows found
      const { data: bracketTournament, error: bracketError } = await supabase
        .from("tournaments")
        .select("id, name, user_id")
        .eq("invite_code", code)
        .maybeSingle();

      if (bracketError) {
        console.error("Error finding bracket tournament:", bracketError);
      }

      if (bracketTournament) {
        // Check if user is already the owner
        if (bracketTournament.user_id === user.id) {
          setError("You are the owner of this tournament!");
          setLoading(false);
          return;
        }

        // Check if already joined
        const { data: existing } = await supabase
          .from("tournament_collaborators")
          .select("id")
          .eq("tournament_id", bracketTournament.id)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          setSuccess(`You've already joined "${bracketTournament.name}"!`);
          setTimeout(() => router.push("/bracket"), 1500);
          setLoading(false);
          return;
        }

        // Join the tournament
        const { error: joinError } = await supabase
          .from("tournament_collaborators")
          .insert({
            tournament_id: bracketTournament.id,
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
          });

        if (joinError) {
          console.error("Join error:", joinError);
          throw new Error(`Failed to join: ${joinError.message}`);
        }

        setSuccess(`Successfully joined "${bracketTournament.name}"!`);
        setTimeout(() => router.push(`/bracket?tournament=${bracketTournament.id}`), 1500);
        return;
      }

      // Try to find round robin tournament with this code
      // Use maybeSingle() to avoid error when no rows found
      const { data: rrTournament, error: rrError } = await supabase
        .from("round_robin_tournaments")
        .select("id, name, user_id")
        .eq("invite_code", code)
        .maybeSingle();

      if (rrError) {
        console.error("Error finding round robin tournament:", rrError);
      }

      if (rrTournament) {
        // Check if user is already the owner
        if (rrTournament.user_id === user.id) {
          setError("You are the owner of this tournament!");
          setLoading(false);
          return;
        }

        // Check if already joined
        const { data: existing } = await supabase
          .from("round_robin_collaborators")
          .select("id")
          .eq("tournament_id", rrTournament.id)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          setSuccess(`You've already joined "${rrTournament.name}"!`);
          setTimeout(() => router.push("/round-robin"), 1500);
          setLoading(false);
          return;
        }

        // Join the tournament
        const { error: joinError } = await supabase
          .from("round_robin_collaborators")
          .insert({
            tournament_id: rrTournament.id,
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
          });

        if (joinError) throw joinError;

        setSuccess(`Successfully joined "${rrTournament.name}"!`);
        // Store the tournament ID for round robin page to load
        localStorage.setItem("activeRoundRobinTournamentId", rrTournament.id);
        setTimeout(() => router.push("/round-robin"), 1500);
        return;
      }

      // No tournament found
      setError("Invalid invite code. Please check and try again.");
    } catch (err: unknown) {
      console.error("Error joining tournament:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err 
          ? String((err as { message: unknown }).message)
          : "Failed to join tournament";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-orange-400/30 mx-auto mb-6">
              <span className="text-4xl">🤝</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Join a Tournament</h1>
            <p className="text-white/60 mb-8">
              Sign in to join a tournament and collaborate with others.
            </p>
            <Link
              href="/login?redirect=/join"
              className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Sign In to Join
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center shadow-2xl shadow-orange-400/30 mx-auto mb-6">
            <span className="text-4xl">🤝</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join a Tournament</h1>
          <p className="text-white/60">
            Enter an invite code to join and collaborate on a tournament
          </p>
        </div>

        {/* Join Form */}
        <div className="glass rounded-3xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block text-white/70 text-sm font-medium mb-2">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., ABC123)"
                maxLength={8}
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-mono tracking-widest placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-transparent transition-all uppercase"
              />
              <p className="text-white/40 text-xs mt-2 text-center">
                Ask the tournament host for the invite code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="w-full px-6 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "🤝 Join Tournament"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-sm">
              Want to create your own tournament instead?
            </p>
            <Link href="/" className="text-lime-400 hover:underline text-sm mt-1 inline-block">
              Create a Tournament →
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="text-white/40 hover:text-white/70 transition-colors text-sm inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

