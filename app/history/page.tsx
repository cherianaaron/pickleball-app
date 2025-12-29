"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useTournament } from "../context/TournamentContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

interface TournamentSummary {
  id: string;
  name: string;
  isStarted: boolean;
  isComplete: boolean;
  rounds: number;
  playerCount: number;
  matchCount: number;
  championName: string | null;
  createdAt: string;
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
}

export default function HistoryPage() {
  const router = useRouter();
  const { tournament: currentTournament, loadTournamentById, resetTournament } = useTournament();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Ref for detail section to scroll to on mobile
  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleLoadTournament = async (tournamentId: string) => {
    await loadTournamentById(tournamentId);
    router.push("/");
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      setDeleting(true);

      // If deleting the current tournament, reset first
      if (currentTournament?.id === tournamentId) {
        await resetTournament();
      }

      // Delete tournament (cascade will delete players and matches)
      const { error: deleteError } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);

      if (deleteError) throw deleteError;

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
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all tournaments with a limit for performance
      const { data: tournamentsData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Limit to most recent 50 tournaments

      if (tournamentError) throw tournamentError;

      if (!tournamentsData || tournamentsData.length === 0) {
        setTournaments([]);
        return;
      }

      // Get all tournament IDs
      const tournamentIds = tournamentsData.map(t => t.id);

      // Batch fetch all players and matches in parallel (much faster than N+1 queries)
      const [playersResult, matchesResult] = await Promise.all([
        supabase
          .from("players")
          .select("id, tournament_id, name")
          .in("tournament_id", tournamentIds),
        supabase
          .from("matches")
          .select("id, tournament_id")
          .in("tournament_id", tournamentIds)
      ]);

      // Create lookup maps for counts
      const playerCountMap = new Map<string, number>();
      const playerNameMap = new Map<string, string>(); // player_id -> name
      
      (playersResult.data || []).forEach(p => {
        playerCountMap.set(p.tournament_id, (playerCountMap.get(p.tournament_id) || 0) + 1);
        playerNameMap.set(p.id, p.name);
      });

      const matchCountMap = new Map<string, number>();
      (matchesResult.data || []).forEach(m => {
        matchCountMap.set(m.tournament_id, (matchCountMap.get(m.tournament_id) || 0) + 1);
      });

      // Build summaries using the pre-fetched data
      const summaries: TournamentSummary[] = tournamentsData.map(t => ({
        id: t.id,
        name: t.name,
        isStarted: t.is_started,
        isComplete: t.is_complete,
        rounds: t.rounds || 0,
        playerCount: playerCountMap.get(t.id) || 0,
        matchCount: matchCountMap.get(t.id) || 0,
        championName: t.champion_id ? playerNameMap.get(t.champion_id) || null : null,
        createdAt: t.created_at,
      }));

      setTournaments(summaries);
    } catch (err) {
      console.error("Error loading tournaments:", err);
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetail = async (tournamentId: string) => {
    try {
      setDetailLoading(true);

      // Get tournament
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

  if (loading) {
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-3xl">📜</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tournament History</h1>
          <p className="text-white/50">View all past bracket tournaments and their results</p>
          <p className="text-white/40 text-sm mt-2">
            💡 Tip: Use Round Robin final standings to seed your bracket tournaments!
          </p>
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
                    key={t.id}
                    className={`group relative glass rounded-2xl p-4 transition-all hover:scale-[1.02] ${
                      selectedTournament?.id === t.id
                        ? "border-2 border-lime-400 shadow-lg shadow-lime-400/20"
                        : "border border-transparent hover:border-white/20"
                    }`}
                  >
                    <button
                      onClick={() => loadTournamentDetail(t.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{t.name}</h3>
                          <p className="text-white/40 text-xs mt-1">{formatDate(t.createdAt)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {t.isComplete ? (
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
                          👥 {t.playerCount}
                        </span>
                        <span className="text-white/60">
                          🎮 {t.matchCount}
                        </span>
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
                        setDeleteConfirm(t.id);
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-sm"
                      title="Delete tournament"
                    >
                      🗑️
                    </button>
                    {currentTournament?.id === t.id && (
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
                    <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                    <p className="text-white/40 text-sm mt-1">{formatDate(selectedTournament.createdAt)}</p>
                    {currentTournament?.id === selectedTournament.id && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full bg-lime-400/20 text-lime-400 text-xs font-medium">
                        ✓ Currently Active
                      </span>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {selectedTournament.isComplete ? (
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
                    {currentTournament?.id !== selectedTournament.id && (
                      <button
                        onClick={() => handleLoadTournament(selectedTournament.id)}
                        className="block w-full mt-2 px-4 py-2 rounded-xl text-sm font-semibold bg-lime-400 text-emerald-900 hover:bg-lime-300 transition-colors"
                      >
                        Load This Tournament
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(selectedTournament.id)}
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
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedTournament.players.length}</p>
                    <p className="text-white/50 text-sm">Players</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedTournament.rounds}</p>
                    <p className="text-white/50 text-sm">Rounds</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedTournament.matches.length}</p>
                    <p className="text-white/50 text-sm">Matches</p>
                  </div>
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

                {/* Players */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Players</h3>
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
                          <p className="text-white/40 text-xs">Seed #{player.seed}</p>
                        </div>
                        {player.name === selectedTournament.championName && (
                          <span className="text-lg">👑</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bracket/Matches */}
                {selectedTournament.matches.length > 0 && (
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
                <div className="text-6xl mb-4">📜</div>
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
              <h3 className="text-xl font-bold text-white mb-2">Delete Tournament?</h3>
              <p className="text-white/60 mb-6">
                This will permanently delete this tournament, including all players, matches, and scores. This action cannot be undone.
              </p>
              {currentTournament?.id === deleteConfirm && (
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
                  onClick={() => handleDeleteTournament(deleteConfirm)}
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

