"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Bracket from "../components/Bracket";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ShareTournament from "../components/ShareTournament";
import { useTournament } from "../context/TournamentContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function BracketPageContent() {
  const { tournament, loading, error, resetTournament, loadTournamentById, clearError } = useTournament();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [loadingFromUrl, setLoadingFromUrl] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Clear any previous errors when the page loads
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, []);

  // Check if current user is the owner of the tournament
  const isOwner = tournament && user && tournament.userId === user.id;

  // Handle ?tournament=<id> query parameter (e.g., from Round Robin playoffs)
  useEffect(() => {
    const tournamentId = searchParams.get("tournament");
    if (tournamentId && (!tournament || tournament.id !== tournamentId)) {
      setLoadingFromUrl(true);
      loadTournamentById(tournamentId).finally(() => {
        setLoadingFromUrl(false);
        // Remove the query parameter from URL after loading
        window.history.replaceState({}, "", "/bracket");
      });
    }
  }, [searchParams, tournament, loadTournamentById]);

  // Auto-detect owned or collaborated tournaments when no tournament is loaded
  useEffect(() => {
    const autoDetectTournament = async () => {
      // Skip if already loading, already have a tournament, or URL has tournament param
      if (loading || loadingFromUrl || tournament || authLoading || !user) return;
      if (searchParams.get("tournament")) return;

      try {
        setLoadingFromUrl(true);
        
        // First check for owned tournaments (most recent active one)
        const { data: ownedTournaments, error: ownedError } = await supabase
          .from("tournaments")
          .select("id, name, is_complete")
          .eq("user_id", user.id)
          .eq("is_complete", false)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (ownedError) {
          console.error("Error checking owned tournaments:", ownedError);
        }
        
        if (ownedTournaments && ownedTournaments.length > 0) {
          console.log("Auto-loading owned bracket tournament:", ownedTournaments[0].name);
          await loadTournamentById(ownedTournaments[0].id);
          setLoadingFromUrl(false);
          return;
        }
        
        // If not an owner, check if user has joined any tournaments as collaborator
        const { data: collaborations, error: collabError } = await supabase
          .from("tournament_collaborators")
          .select("tournament_id")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(1);
        
        if (collabError) {
          console.error("Error checking collaborations:", collabError);
          setLoadingFromUrl(false);
          return;
        }
        
        if (collaborations && collaborations.length > 0) {
          // Verify the tournament is still active
          const { data: tournamentData, error: tournamentError } = await supabase
            .from("tournaments")
            .select("id, name, is_complete")
            .eq("id", collaborations[0].tournament_id)
            .eq("is_complete", false)
            .single();
          
          if (tournamentError) {
            console.error("Error checking collaborated tournament:", tournamentError);
            setLoadingFromUrl(false);
            return;
          }
          
          if (tournamentData) {
            console.log("Auto-loading collaborated bracket tournament:", tournamentData.name);
            await loadTournamentById(tournamentData.id);
          }
        }
      } catch (err) {
        console.error("Error auto-detecting tournament:", err);
      } finally {
        setLoadingFromUrl(false);
      }
    };
    
    autoDetectTournament();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, tournament, loading, loadingFromUrl]);

  if (loading || loadingFromUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message={loadingFromUrl ? "Loading tournament from Round Robin..." : "Loading bracket..."} />
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

  // No active tournament - prompt user to create one or sign in
  if (!tournament) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6">
              <span className="text-4xl">🏆</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">No Active Bracket Tournament</h1>
            
            {!user && !authLoading ? (
              // Not logged in - prompt to sign in
              <>
                <p className="text-white/60 mb-8">
                  Sign in to create and manage your bracket tournaments.
                </p>
                <Link
                  href="/login?redirect=/bracket"
                  className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  🔐 Sign In to Create Tournament
                </Link>
              </>
            ) : (
              // Logged in - show create/load options
              <>
                <p className="text-white/60 mb-8">
                  Start a new bracket-style tournament or load an existing one from history.
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
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {!tournament?.isStarted && (
            <p className="text-white/40 text-sm mt-2">
              ⚙️ Remember to <Link href="/settings" className="text-lime-400 hover:underline">adjust your settings</Link> before generating the bracket!
            </p>
          )}
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
            {/* Share Button */}
            {user && (
              <button
                onClick={() => setShowShareModal(true)}
                className="glass rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-all border border-orange-400/30 hover:border-orange-400/50"
              >
                <span className="text-orange-400">🤝</span>
                <span className="text-white/70 text-sm">Share</span>
              </button>
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

      {/* Share Modal */}
      {showShareModal && tournament && (
        <ShareTournament
          tournamentId={tournament.id}
          tournamentType="bracket"
          isOwner={isOwner || false}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

export default function BracketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading bracket..." />
      </div>
    }>
      <BracketPageContent />
    </Suspense>
  );
}
