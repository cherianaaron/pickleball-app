"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";
import { useTournament } from "../context/TournamentContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { HistoryIcon, LockIcon } from "../components/Icons";

interface TournamentSummary {
  id: string;
  name: string;
  type: "bracket" | "round-robin";
  isStarted: boolean;
  isComplete: boolean;
  rounds: number;
  playerCount: number;
  matchCount: number;
  championName: string | null;
  createdAt: string;
  isCollaborator?: boolean;
}

interface Player {
  id: string;
  name: string;
  seed: number;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1Name: string | null;
  player2Name: string | null;
  score1: number | null;
  score2: number | null;
  winnerName: string | null;
  isComplete: boolean;
}

interface TournamentDetail {
  id: string;
  name: string;
  type: "bracket" | "round-robin";
  isStarted: boolean;
  isComplete: boolean;
  rounds: number;
  championName: string | null;
  scoreLimit: number;
  winByTwo: boolean;
  gameTimerMinutes: number | null;
  createdAt: string;
  players: Player[];
  matches: Match[];
  // Round-robin specific fields
  numCourts?: number;
  poolCount?: number;
  isPoolPlayComplete?: boolean;
  isPlayoffsStarted?: boolean;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tournament: currentTournament, loadTournamentById, resetTournament } = useTournament();
  
  // Use browser client that shares auth state
  const supabase = useMemo(() => createClient(), []);
  
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "bracket" | "round-robin" } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Ref for detail section to scroll to on mobile
  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleLoadTournament = async (tournamentId: string, type: "bracket" | "round-robin") => {
    if (type === "bracket") {
      await loadTournamentById(tournamentId);
      router.push("/bracket");
    } else {
      // For round-robin, navigate to the round-robin page
      // It will auto-load based on localStorage
      localStorage.setItem("activeRoundRobinTournamentId", tournamentId);
      router.push("/round-robin");
    }
  };

  const handleDeleteTournament = async (tournamentId: string, type: "bracket" | "round-robin") => {
    try {
      setDeleting(true);

      if (type === "bracket") {
        // If deleting the current bracket tournament, reset first
        if (currentTournament?.id === tournamentId) {
          await resetTournament();
        }

        // Delete bracket tournament (cascade will delete players and matches)
        const { error: deleteError } = await supabase
          .from("tournaments")
          .delete()
          .eq("id", tournamentId);

        if (deleteError) throw deleteError;
      } else {
        // Delete round-robin tournament
        // First get pool IDs to delete matches
        const { data: pools } = await supabase
          .from("round_robin_pools")
          .select("id")
          .eq("tournament_id", tournamentId);
        
        const poolIds = (pools || []).map((p: { id: string }) => p.id);
        
        // Delete matches, teams, pools, then tournament (in order due to foreign keys)
        if (poolIds.length > 0) {
          await supabase.from("round_robin_matches").delete().in("pool_id", poolIds);
        }
        await supabase.from("round_robin_teams").delete().eq("tournament_id", tournamentId);
        await supabase.from("round_robin_pools").delete().eq("tournament_id", tournamentId);
        await supabase.from("round_robin_collaborators").delete().eq("tournament_id", tournamentId);
        
        const { error: deleteError } = await supabase
          .from("round_robin_tournaments")
          .delete()
          .eq("id", tournamentId);

        if (deleteError) throw deleteError;
        
        // Clear localStorage if this was the active round-robin
        const activeRR = localStorage.getItem("activeRoundRobinTournamentId");
        if (activeRR === tournamentId) {
          localStorage.removeItem("activeRoundRobinTournamentId");
        }
      }

      // Clear selection if it was the deleted tournament
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null);
      }

      // Refresh the list
      setDeleteConfirm(null);
      await loadTournaments();
    } catch (err) {
      console.error("Error deleting tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to delete tournament");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // Wait for auth to load before fetching tournaments
    if (!authLoading) {
      loadTournaments();
    }
  }, [authLoading, user]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // If not logged in, show nothing (user must login to see their history)
        setTournaments([]);
        setLoading(false);
        return;
      }

      // Fetch bracket tournaments and round-robin tournaments in parallel
      const [bracketResult, roundRobinResult] = await Promise.all([
        supabase
          .from("tournaments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("round_robin_tournaments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (bracketResult.error) throw bracketResult.error;
      if (roundRobinResult.error) throw roundRobinResult.error;

      const bracketTournaments = (bracketResult.data || []).map(t => ({ ...t, tournamentType: "bracket" as const }));
      const roundRobinTournaments = (roundRobinResult.data || []).map(t => ({ ...t, tournamentType: "round-robin" as const }));

      // Get bracket tournament IDs for batch fetching players/matches
      const bracketIds = bracketTournaments.map(t => t.id);
      const roundRobinIds = roundRobinTournaments.map(t => t.id);

      // Batch fetch all players, matches, teams, and round-robin matches in parallel
      const [playersResult, matchesResult, teamsResult, rrMatchesResult] = await Promise.all([
        bracketIds.length > 0 ? supabase
          .from("players")
          .select("id, tournament_id, name")
          .in("tournament_id", bracketIds) : { data: [] },
        bracketIds.length > 0 ? supabase
          .from("matches")
          .select("id, tournament_id")
          .in("tournament_id", bracketIds) : { data: [] },
        roundRobinIds.length > 0 ? supabase
          .from("round_robin_teams")
          .select("id, tournament_id, name")
          .in("tournament_id", roundRobinIds) : { data: [] },
        roundRobinIds.length > 0 ? supabase
          .from("round_robin_matches")
          .select("id, pool_id")
          .in("pool_id", await getPoolIds(roundRobinIds)) : { data: [] }
      ]);

      // Create lookup maps for bracket tournaments
      const playerCountMap = new Map<string, number>();
      const playerNameMap = new Map<string, string>();
      
      (playersResult.data || []).forEach((p: { id: string; tournament_id: string; name: string }) => {
        playerCountMap.set(p.tournament_id, (playerCountMap.get(p.tournament_id) || 0) + 1);
        playerNameMap.set(p.id, p.name);
      });

      const matchCountMap = new Map<string, number>();
      (matchesResult.data || []).forEach((m: { id: string; tournament_id: string }) => {
        matchCountMap.set(m.tournament_id, (matchCountMap.get(m.tournament_id) || 0) + 1);
      });

      // Create lookup maps for round-robin tournaments
      const teamCountMap = new Map<string, number>();
      (teamsResult.data || []).forEach((t: { id: string; tournament_id: string; name: string }) => {
        teamCountMap.set(t.tournament_id, (teamCountMap.get(t.tournament_id) || 0) + 1);
      });

      // Build bracket summaries
      const bracketSummaries: TournamentSummary[] = bracketTournaments.map(t => ({
        id: t.id,
        name: t.name,
        type: "bracket" as const,
        isStarted: t.is_started,
        isComplete: t.is_complete,
        rounds: t.rounds || 0,
        playerCount: playerCountMap.get(t.id) || 0,
        matchCount: matchCountMap.get(t.id) || 0,
        championName: t.champion_id ? playerNameMap.get(t.champion_id) || null : null,
        createdAt: t.created_at,
        isCollaborator: false,
      }));

      // Build round-robin summaries
      const roundRobinSummaries: TournamentSummary[] = roundRobinTournaments.map(t => ({
        id: t.id,
        name: t.name,
        type: "round-robin" as const,
        isStarted: true, // Round-robin is always "started" once created
        isComplete: t.is_playoffs_started, // Complete when moved to playoffs
        rounds: 0,
        playerCount: teamCountMap.get(t.id) || 0,
        matchCount: 0, // We could count matches but it's complex
        championName: null,
        createdAt: t.created_at,
        isCollaborator: false,
      }));

      // Combine and sort by date
      const allSummaries = [...bracketSummaries, ...roundRobinSummaries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTournaments(allSummaries);
    } catch (err) {
      console.error("Error loading tournaments:", err);
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get pool IDs for round-robin tournaments
  const getPoolIds = async (tournamentIds: string[]): Promise<string[]> => {
    if (tournamentIds.length === 0) return [];
    const { data } = await supabase
      .from("round_robin_pools")
      .select("id")
      .in("tournament_id", tournamentIds);
    return (data || []).map((p: { id: string }) => p.id);
  };

  const loadTournamentDetail = async (tournamentId: string, type: "bracket" | "round-robin") => {
    try {
      setDetailLoading(true);

      if (type === "round-robin") {
        // Load round-robin tournament details
        const { data: tournament, error: tournamentError } = await supabase
          .from("round_robin_tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single();

        if (tournamentError) throw tournamentError;

        // Get teams
        const { data: teams, error: teamsError } = await supabase
          .from("round_robin_teams")
          .select("*")
          .eq("tournament_id", tournamentId)
          .order("name", { ascending: true });

        if (teamsError) throw teamsError;

        // Get pools
        const { data: pools, error: poolsError } = await supabase
          .from("round_robin_pools")
          .select("*")
          .eq("tournament_id", tournamentId);

        if (poolsError) throw poolsError;

        // Convert teams to players format for display
        const players: Player[] = (teams || []).map((t: { id: string; name: string }, index: number) => ({
          id: t.id,
          name: t.name,
          seed: index + 1,
        }));

        setSelectedTournament({
          id: tournament.id,
          name: tournament.name,
          type: "round-robin",
          isStarted: true,
          isComplete: tournament.is_playoffs_started,
          rounds: 0,
          championName: null,
          scoreLimit: tournament.score_limit || 11,
          winByTwo: true,
          gameTimerMinutes: null,
          createdAt: tournament.created_at,
          players,
          matches: [],
          numCourts: tournament.num_courts,
          poolCount: (pools || []).length,
          isPoolPlayComplete: tournament.is_pool_play_complete,
          isPlayoffsStarted: tournament.is_playoffs_started,
        });

        // Scroll on mobile
        if (window.innerWidth < 1024 && detailSectionRef.current) {
          setTimeout(() => {
            detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
        return;
      }

      // Load bracket tournament details
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      // Get players
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });

      if (playersError) throw playersError;

      // Get matches
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (matchesError) throw matchesError;

      // Create player map for lookups
      const playerMap = new Map(players?.map(p => [p.id, p.name]) || []);

      // Get champion name
      let championName = null;
      if (tournament.champion_id) {
        championName = playerMap.get(tournament.champion_id) || null;
      }

      // Transform matches
      const transformedMatches: Match[] = (matches || []).map(m => ({
        id: m.id,
        round: m.round,
        matchNumber: m.match_number,
        player1Name: m.player1_id ? playerMap.get(m.player1_id) || null : null,
        player2Name: m.player2_id ? playerMap.get(m.player2_id) || null : null,
        score1: m.score1,
        score2: m.score2,
        winnerName: m.winner_id ? playerMap.get(m.winner_id) || null : null,
        isComplete: m.is_complete,
      }));

      setSelectedTournament({
        id: tournament.id,
        name: tournament.name,
        type: "bracket",
        isStarted: tournament.is_started,
        isComplete: tournament.is_complete,
        rounds: tournament.rounds || 0,
        championName,
        scoreLimit: tournament.score_limit || 11,
        winByTwo: tournament.win_by_two ?? true,
        gameTimerMinutes: tournament.game_timer_minutes,
        createdAt: tournament.created_at,
        players: players?.map(p => ({ id: p.id, name: p.name, seed: p.seed })) || [],
        matches: transformedMatches,
      });
      
      // Scroll to detail section on mobile (screen width < 1024px which is lg breakpoint)
      if (window.innerWidth < 1024 && detailSectionRef.current) {
        setTimeout(() => {
          detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (err) {
      console.error("Error loading tournament detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Finals";
    if (round === totalRounds - 1) return "Semifinals";
    if (round === totalRounds - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading tournament history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={loadTournaments} />
      </div>
    );
  }

  // Show login prompt if not signed in
  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6 text-lime-400">
              <HistoryIcon size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Tournament History</h1>
            <p className="text-white/60 mb-8">
              Sign in to view your tournament history and past results.
            </p>
            <Link
              href="/login?redirect=/history"
              className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Sign In to View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 text-lime-400">
              <HistoryIcon size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tournament History</h1>
          <p className="text-white/50">View and manage all your tournaments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">All Tournaments</h2>
            <div className="space-y-3">
              {tournaments.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-white/50">No tournaments yet</p>
                  <Link
                    href="/players"
                    className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-lime-400 text-emerald-900"
                  >
                    Create Your First Tournament
                  </Link>
                </div>
              ) : (
                tournaments.map((t) => (
                  <div
                    key={`${t.type}-${t.id}`}
                    className={`group relative glass rounded-2xl p-4 transition-all hover:scale-[1.02] ${
                      selectedTournament?.id === t.id
                        ? "border-2 border-lime-400 shadow-lg shadow-lime-400/20"
                        : "border border-transparent hover:border-white/20"
                    }`}
                  >
                    <button
                      onClick={() => loadTournamentDetail(t.id, t.type)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white truncate">{t.name}</h3>
                            {/* Tournament type badge */}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              t.type === "round-robin" 
                                ? "bg-orange-400/20 text-orange-400 border border-orange-400/30"
                                : "bg-blue-400/20 text-blue-400 border border-blue-400/30"
                            }`}>
                              {t.type === "round-robin" ? "Round Robin" : "Bracket"}
                            </span>
                            {t.isCollaborator && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-400/20 text-purple-400 border border-purple-400/30">
                                Joined
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-1">{formatDate(t.createdAt)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {t.type === "round-robin" ? (
                            t.isComplete ? (
                              <span className="text-2xl">✅</span>
                            ) : (
                              <span className="text-2xl">🔄</span>
                            )
                          ) : t.isComplete ? (
                            <span className="text-2xl">🏆</span>
                          ) : t.isStarted ? (
                            <span className="text-2xl">⚡</span>
                          ) : (
                            <span className="text-2xl">📝</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <span className="text-white/60">
                          👥 {t.playerCount} {t.type === "round-robin" ? "teams" : ""}
                        </span>
                        {t.type === "bracket" && (
                          <span className="text-white/60">
                            🎮 {t.matchCount}
                          </span>
                        )}
                        {t.championName && (
                          <span className="text-lime-400 font-medium truncate">
                            👑 {t.championName}
                          </span>
                        )}
                      </div>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ id: t.id, type: t.type });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-sm"
                      title="Delete tournament"
                    >
                      🗑️
                    </button>
                    {currentTournament?.id === t.id && t.type === "bracket" && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold bg-lime-400 text-emerald-900 rounded-full shadow-lg">
                        Active
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tournament Detail */}
          <div ref={detailSectionRef} className="lg:col-span-2">
            {detailLoading ? (
              <div className="glass rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
                <LoadingSpinner message="Loading details..." />
              </div>
            ) : selectedTournament ? (
              <div className="glass rounded-3xl p-6 sm:p-8">
                {/* Tournament Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedTournament.type === "round-robin" 
                          ? "bg-orange-400/20 text-orange-400 border border-orange-400/30"
                          : "bg-blue-400/20 text-blue-400 border border-blue-400/30"
                      }`}>
                        {selectedTournament.type === "round-robin" ? "Round Robin" : "Bracket"}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm mt-1">{formatDate(selectedTournament.createdAt)}</p>
                    {currentTournament?.id === selectedTournament.id && selectedTournament.type === "bracket" && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full bg-lime-400/20 text-lime-400 text-xs font-medium">
                        ✓ Currently Active
                      </span>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {selectedTournament.type === "round-robin" ? (
                      selectedTournament.isPlayoffsStarted ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 text-lime-400 text-sm font-medium">
                          <span>✅</span> Moved to Playoffs
                        </span>
                      ) : selectedTournament.isPoolPlayComplete ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-sm font-medium">
                          <span>📊</span> Pool Play Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-400/20 text-orange-400 text-sm font-medium">
                          <span>🔄</span> Pool Play Active
                        </span>
                      )
                    ) : selectedTournament.isComplete ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 text-lime-400 text-sm font-medium">
                        <span>🏆</span> Complete
                      </span>
                    ) : selectedTournament.isStarted ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-sm font-medium">
                        <span>⚡</span> In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm font-medium">
                        <span>📝</span> Not Started
                      </span>
                    )}
                    {(currentTournament?.id !== selectedTournament.id || selectedTournament.type === "round-robin") && (
                      <button
                        onClick={() => handleLoadTournament(selectedTournament.id, selectedTournament.type)}
                        className="block w-full mt-2 px-4 py-2 rounded-xl text-sm font-semibold bg-lime-400 text-emerald-900 hover:bg-lime-300 transition-colors"
                      >
                        {selectedTournament.type === "round-robin" ? "Open Tournament" : "Load This Tournament"}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm({ id: selectedTournament.id, type: selectedTournament.type })}
                      className="block w-full mt-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      🗑️ Delete Tournament
                    </button>
                  </div>
                </div>

                {/* Champion */}
                {selectedTournament.championName && (
                  <div className="bg-gradient-to-r from-lime-400/20 to-yellow-300/20 rounded-2xl p-4 mb-6 border border-lime-400/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-yellow-300 flex items-center justify-center">
                        <span className="text-2xl">👑</span>
                      </div>
                      <div>
                        <p className="text-lime-400 text-sm font-medium">Tournament Champion</p>
                        <p className="text-white text-xl font-bold">{selectedTournament.championName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className={`grid gap-4 mb-6 ${selectedTournament.type === "round-robin" ? "grid-cols-3" : "grid-cols-3"}`}>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedTournament.players.length}</p>
                    <p className="text-white/50 text-sm">{selectedTournament.type === "round-robin" ? "Teams" : "Players"}</p>
                  </div>
                  {selectedTournament.type === "round-robin" ? (
                    <>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{selectedTournament.poolCount || 0}</p>
                        <p className="text-white/50 text-sm">Pools</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{selectedTournament.numCourts || 0}</p>
                        <p className="text-white/50 text-sm">Courts</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{selectedTournament.rounds}</p>
                        <p className="text-white/50 text-sm">Rounds</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{selectedTournament.matches.length}</p>
                        <p className="text-white/50 text-sm">Matches</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Settings Used */}
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-white/50 text-sm mb-2">Tournament Rules</p>
                  <p className="text-white">
                    Game to {selectedTournament.scoreLimit}
                    {selectedTournament.winByTwo && ", win by 2"}
                    {selectedTournament.gameTimerMinutes && ` • ${selectedTournament.gameTimerMinutes} min timer`}
                  </p>
                </div>

                {/* Players/Teams */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {selectedTournament.type === "round-robin" ? "Teams" : "Players"}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedTournament.players.map((player) => (
                      <div
                        key={player.id}
                        className={`bg-white/5 rounded-xl p-3 flex items-center gap-3 ${
                          player.name === selectedTournament.championName
                            ? "border border-lime-400/50 bg-lime-400/10"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border border-lime-400/30">
                          <span className="text-sm font-bold text-lime-400">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{player.name}</p>
                          {selectedTournament.type === "bracket" && (
                            <p className="text-white/40 text-xs">Seed #{player.seed}</p>
                          )}
                        </div>
                        {player.name === selectedTournament.championName && (
                          <span className="text-lg">👑</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bracket/Matches - only for bracket tournaments */}
                {selectedTournament.type === "bracket" && selectedTournament.matches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Bracket</h3>
                    <div className="space-y-4">
                      {Array.from({ length: selectedTournament.rounds }, (_, i) => i + 1).map((round) => {
                        const roundMatches = selectedTournament.matches.filter(m => m.round === round);
                        return (
                          <div key={round}>
                            <p className="text-white/50 text-sm font-medium mb-2">
                              {getRoundName(round, selectedTournament.rounds)}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {roundMatches.map((match) => (
                                <div
                                  key={match.id}
                                  className={`bg-white/5 rounded-xl p-3 ${
                                    match.isComplete ? "border border-lime-400/30" : "border border-white/10"
                                  }`}
                                >
                                  {/* Player 1 */}
                                  <div className={`flex items-center justify-between py-1 ${
                                    match.winnerName === match.player1Name ? "text-lime-400" : "text-white/70"
                                  }`}>
                                    <span className="text-sm truncate">
                                      {match.player1Name || "TBD"}
                                      {match.winnerName === match.player1Name && " 🏆"}
                                    </span>
                                    {match.score1 !== null && (
                                      <span className="font-bold ml-2">{match.score1}</span>
                                    )}
                                  </div>
                                  <div className="border-t border-white/10 my-1" />
                                  {/* Player 2 */}
                                  <div className={`flex items-center justify-between py-1 ${
                                    match.winnerName === match.player2Name ? "text-lime-400" : "text-white/70"
                                  }`}>
                                    <span className="text-sm truncate">
                                      {match.player2Name || "TBD"}
                                      {match.winnerName === match.player2Name && " 🏆"}
                                    </span>
                                    {match.score2 !== null && (
                                      <span className="font-bold ml-2">{match.score2}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="text-lime-400/50 mb-4"><HistoryIcon size={64} /></div>
                <p className="text-white/50 text-lg">Select a tournament to view details</p>
                <p className="text-white/30 text-sm mt-2">
                  Click on any tournament from the list
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 max-w-md w-full border border-red-500/30">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Delete {deleteConfirm.type === "round-robin" ? "Round Robin" : "Bracket"} Tournament?
              </h3>
              <p className="text-white/60 mb-6">
                This will permanently delete this tournament, including all {deleteConfirm.type === "round-robin" ? "teams, pools, and matches" : "players, matches, and scores"}. This action cannot be undone.
              </p>
              {currentTournament?.id === deleteConfirm.id && deleteConfirm.type === "bracket" && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 mb-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ This is your currently active tournament. Deleting it will create a new empty tournament.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTournament(deleteConfirm.id, deleteConfirm.type)}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

