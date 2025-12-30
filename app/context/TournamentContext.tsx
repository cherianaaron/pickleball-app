"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Player {
  id: string;
  name: string;
  seed?: number;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  score1: number | null;
  score2: number | null;
  winner: Player | null;
  isComplete: boolean;
  timerStartedAt: string | null; // ISO timestamp when timer was started
  timerPausedRemaining: number | null; // Seconds remaining when paused
}

export interface TournamentSettings {
  scoreLimit: number;
  winByTwo: boolean;
  gameTimerMinutes: number | null; // null means no timer
}

export interface Tournament {
  id: string;
  name: string;
  userId: string | null;
  players: Player[];
  matches: Match[];
  rounds: number;
  isStarted: boolean;
  isComplete: boolean;
  champion: Player | null;
  settings: TournamentSettings;
}

interface TournamentContextType {
  tournament: Tournament | null;
  loading: boolean;
  error: string | null;
  showWinnerCelebration: boolean;
  dismissWinnerCelebration: () => void;
  addPlayer: (name: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  generateBracket: () => Promise<void>;
  updateMatchScore: (matchId: string, score1: number, score2: number) => Promise<void>;
  resetTournament: () => Promise<void>;
  setTournamentName: (name: string) => Promise<void>;
  updateSettings: (settings: Partial<TournamentSettings>) => Promise<void>;
  loadTournamentById: (id: string) => Promise<void>;
  startMatchTimer: (matchId: string) => Promise<void>;
  pauseMatchTimer: (matchId: string) => Promise<void>;
  resetMatchTimer: (matchId: string) => Promise<void>;
  getUserSettingsPreference: () => TournamentSettings;
  saveUserSettingsPreference: (settings: TournamentSettings) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const DEFAULT_SETTINGS: TournamentSettings = {
  scoreLimit: 11,
  winByTwo: true,
  gameTimerMinutes: null,
};

// LocalStorage key for persisting user's preferred settings across tournaments
const USER_SETTINGS_KEY = "picklebracket_user_settings";

// Helper to get user's preferred settings from localStorage
const getUserSettings = (): TournamentSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        scoreLimit: parsed.scoreLimit ?? DEFAULT_SETTINGS.scoreLimit,
        winByTwo: parsed.winByTwo ?? DEFAULT_SETTINGS.winByTwo,
        gameTimerMinutes: parsed.gameTimerMinutes ?? DEFAULT_SETTINGS.gameTimerMinutes,
      };
    }
  } catch (e) {
    console.error("Error reading user settings:", e);
  }
  return DEFAULT_SETTINGS;
};

// Helper to save user's preferred settings to localStorage
const saveUserSettings = (settings: TournamentSettings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving user settings:", e);
  }
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

// Calculate number of rounds needed for n players without forcing power of 2
function calculateRoundsForPlayers(n: number): number {
  if (n <= 1) return 0;
  let rounds = 0;
  let remaining = n;
  while (remaining > 1) {
    remaining = Math.ceil(remaining / 2);
    rounds++;
  }
  return rounds;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false); // Start as false - no auto-loading
  const [error, setError] = useState<string | null>(null);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);

  const dismissWinnerCelebration = useCallback(() => {
    setShowWinnerCelebration(false);
  }, []);

  // Real-time subscription for live score updates
  useEffect(() => {
    if (!tournament?.id) return;

    // Subscribe to match updates for the current tournament
    const channel = supabase
      .channel(`tournament-${tournament.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        () => {
          // Reload tournament data when any match is updated
          reloadCurrentTournament(tournament.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament?.id]);

  // Helper function to reload current tournament data
  const reloadCurrentTournament = async (tournamentId: string) => {
    try {
      // Load players for this tournament
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });

      if (playersError) throw playersError;

      // Load matches for this tournament
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (matchesError) throw matchesError;

      // Load tournament data
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      // Find champion player if exists
      let champion: Player | null = null;
      if (tournamentData.champion_id) {
        champion = players?.find((p: { id: string }) => p.id === tournamentData.champion_id) || null;
      }

      // Transform matches to include player objects
      const playerMap = new Map(players?.map((p: { id: string; name: string; seed: number }) => [p.id, { id: p.id, name: p.name, seed: p.seed }]) || []);
      
      const transformedMatches: Match[] = (matches || []).map((m: {
        id: string;
        round: number;
        match_number: number;
        player1_id: string | null;
        player2_id: string | null;
        score1: number | null;
        score2: number | null;
        winner_id: string | null;
        is_complete: boolean;
        timer_started_at: string | null;
        timer_paused_remaining: number | null;
      }) => ({
        id: m.id,
        round: m.round,
        matchNumber: m.match_number,
        player1: m.player1_id ? playerMap.get(m.player1_id) || null : null,
        player2: m.player2_id ? playerMap.get(m.player2_id) || null : null,
        score1: m.score1,
        score2: m.score2,
        winner: m.winner_id ? playerMap.get(m.winner_id) || null : null,
        isComplete: m.is_complete,
        timerStartedAt: m.timer_started_at,
        timerPausedRemaining: m.timer_paused_remaining,
      }));

      // Parse settings from tournament data
      const settings: TournamentSettings = {
        scoreLimit: tournamentData.score_limit ?? DEFAULT_SETTINGS.scoreLimit,
        winByTwo: tournamentData.win_by_two ?? DEFAULT_SETTINGS.winByTwo,
        gameTimerMinutes: tournamentData.game_timer_minutes ?? DEFAULT_SETTINGS.gameTimerMinutes,
      };

      setTournament({
        id: tournamentData.id,
        name: tournamentData.name,
        userId: tournamentData.user_id || null,
        players: players?.map((p: { id: string; name: string; seed: number }) => ({ id: p.id, name: p.name, seed: p.seed })) || [],
        matches: transformedMatches,
        rounds: tournamentData.rounds || 0,
        isStarted: tournamentData.is_started,
        isComplete: tournamentData.is_complete,
        champion,
        settings,
      });
    } catch (err) {
      console.error("Error reloading tournament:", err);
      throw err;
    }
  };

  const addPlayer = useCallback(async (name: string) => {
    if (!name.trim() || !tournament) return;

    try {
      setError(null);
      const newSeed = tournament.players.length + 1;

      const { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert({
          tournament_id: tournament.id,
          name: name.trim(),
          seed: newSeed,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, { id: newPlayer.id, name: newPlayer.name, seed: newPlayer.seed }],
        };
      });
    } catch (err) {
      console.error("Error adding player:", err);
      setError(err instanceof Error ? err.message : "Failed to add player");
    }
  }, [tournament]);

  const removePlayer = useCallback(async (id: string) => {
    if (!tournament) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== id),
        };
      });
    } catch (err) {
      console.error("Error removing player:", err);
      setError(err instanceof Error ? err.message : "Failed to remove player");
    }
  }, [tournament]);

  const setTournamentName = useCallback(async (name: string) => {
    if (!tournament) return;

    try {
      setError(null);
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ name })
        .eq("id", tournament.id);

      if (updateError) throw updateError;

      setTournament((prev) => {
        if (!prev) return prev;
        return { ...prev, name };
      });
    } catch (err) {
      console.error("Error updating tournament name:", err);
      setError(err instanceof Error ? err.message : "Failed to update name");
    }
  }, [tournament]);

  const updateSettings = useCallback(async (newSettings: Partial<TournamentSettings>) => {
    if (!tournament) return;

    try {
      setError(null);
      
      const updatedSettings = { ...tournament.settings, ...newSettings };
      
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({
          score_limit: updatedSettings.scoreLimit,
          win_by_two: updatedSettings.winByTwo,
          game_timer_minutes: updatedSettings.gameTimerMinutes,
        })
        .eq("id", tournament.id);

      if (updateError) throw updateError;

      // Also save to localStorage so settings persist across new tournaments
      saveUserSettings(updatedSettings);

      setTournament((prev) => {
        if (!prev) return prev;
        return { ...prev, settings: updatedSettings };
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      setError(err instanceof Error ? err.message : "Failed to update settings");
    }
  }, [tournament]);

  const generateBracket = useCallback(async () => {
    if (!tournament || tournament.players.length < 2) return;

    try {
      setError(null);
      const numPlayers = tournament.players.length;
      const scoreLimit = tournament.settings.scoreLimit;

      // Sort players by seed
      const seededPlayers = [...tournament.players].sort((a, b) => {
        const seedA = a.seed ?? Infinity;
        const seedB = b.seed ?? Infinity;
        return seedA - seedB;
      });

      // For standalone brackets: NO BYES in round 1
      // All players play in round 1, byes only happen in later rounds if odd number of players
      const rounds = calculateRoundsForPlayers(numPlayers);
      
      const matchesToCreate: {
        tournament_id: string;
        round: number;
        match_number: number;
        player1_id: string | null;
        player2_id: string | null;
        score1: number | null;
        score2: number | null;
        winner_id: string | null;
        is_complete: boolean;
      }[] = [];

      let matchNumber = 0;

      // Round 1: Pair all players, if odd number the last player gets a bye
      const round1PlayerCount = numPlayers;
      const round1Matches = Math.floor(round1PlayerCount / 2);
      const round1HasBye = round1PlayerCount % 2 === 1;
      
      // Create standard seeding for round 1: 1v(n), 2v(n-1), etc.
      // This ensures best plays worst, second best plays second worst, etc.
      for (let i = 0; i < round1Matches; i++) {
        const player1 = seededPlayers[i];
        const player2 = seededPlayers[numPlayers - 1 - i];
        
        matchesToCreate.push({
          tournament_id: tournament.id,
          round: 1,
          match_number: matchNumber++,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          score1: null,
          score2: null,
          winner_id: null,
          is_complete: false,
        });
      }

      // If odd number of players, the middle seed gets a bye
      // They advance directly but we don't create a "bye match"
      let byePlayerForRound2: Player | null = null;
      if (round1HasBye) {
        const byeIndex = Math.floor(numPlayers / 2);
        byePlayerForRound2 = seededPlayers[byeIndex];
      }

      // Calculate match counts for subsequent rounds
      // Round 2 has: floor(round1Winners/2) matches where round1Winners = round1Matches + (1 if bye)
      let playersInNextRound = round1Matches + (round1HasBye ? 1 : 0);
      
      // Track rounds that have an odd number of entering players (bye needed)
      const roundsWithByes: number[] = [];
      if (round1HasBye) roundsWithByes.push(1); // Round 1's bye advances to round 2
      
      for (let round = 2; round <= rounds; round++) {
        const matchesInRound = Math.floor(playersInNextRound / 2);
        const hasOddPlayers = playersInNextRound % 2 === 1;
        
        if (hasOddPlayers && round < rounds) {
          roundsWithByes.push(round); // This round's bye advances to next round
        }
        
        for (let i = 0; i < matchesInRound; i++) {
          matchesToCreate.push({
            tournament_id: tournament.id,
            round,
            match_number: matchNumber++,
            player1_id: null,
            player2_id: null,
            score1: null,
            score2: null,
            winner_id: null,
            is_complete: false,
          });
        }
        
        // For next round: this round's match winners + potential bye player from this round
        playersInNextRound = matchesInRound + (hasOddPlayers ? 1 : 0);
      }

      // Insert all matches
      const { data: insertedMatches, error: insertError } = await supabase
        .from("matches")
        .insert(matchesToCreate)
        .select();

      if (insertError) throw insertError;

      // If there was a bye player for round 2 (from odd round 1), place them in round 2
      if (byePlayerForRound2 && insertedMatches) {
        const round2Matches = insertedMatches.filter(m => m.round === 2);
        if (round2Matches.length > 0) {
          // Put bye player in the last position of round 2 (they'll be player 2 of last match)
          const lastMatch = round2Matches[round2Matches.length - 1];
          await supabase
            .from("matches")
            .update({ player2_id: byePlayerForRound2.id })
            .eq("id", lastMatch.id);
        }
      }
      
      // Note: For odd player counts in later rounds, bye advancement is handled dynamically
      // in updateMatchScore when the match is completed

      // Update tournament status
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ is_started: true, rounds })
        .eq("id", tournament.id);

      if (updateError) throw updateError;

      // Reload tournament to get fresh data
      await reloadCurrentTournament(tournament.id);
    } catch (err) {
      console.error("Error generating bracket:", err);
      setError(err instanceof Error ? err.message : "Failed to generate bracket");
    }
  }, [tournament]);

  const updateMatchScore = useCallback(async (matchId: string, score1: number, score2: number) => {
    if (!tournament) return;

    try {
      setError(null);
      const match = tournament.matches.find((m) => m.id === matchId);
      if (!match || !match.player1 || !match.player2) return;

      const winner = score1 > score2 ? match.player1 : match.player2;
      const loser = score1 > score2 ? match.player2 : match.player1;
      const previousWinner = match.winner;
      const isEditingScore = match.isComplete && previousWinner;
      const winnerChanged = isEditingScore && previousWinner.id !== winner.id;

      // Update the match
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          score1,
          score2,
          winner_id: winner.id,
          is_complete: true,
        })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Find and update next round match
      const nextRoundMatches = tournament.matches.filter((m) => m.round === match.round + 1);
      if (nextRoundMatches.length > 0) {
        const currentRoundMatches = tournament.matches.filter((m) => m.round === match.round);
        const matchIndexInRound = currentRoundMatches.findIndex((m) => m.id === matchId);
        
        // Check if this winner should get a bye (skip next round)
        const isOddCurrentRound = currentRoundMatches.length % 2 === 1;
        const isLastMatchInOddRound = isOddCurrentRound && matchIndexInRound === currentRoundMatches.length - 1;
        const roundAfterNext = tournament.matches.filter((m) => m.round === match.round + 2);
        
        const shouldGetBye = isLastMatchInOddRound && 
                             roundAfterNext.length > 0 && 
                             nextRoundMatches.length * 2 < currentRoundMatches.length;
        
        if (shouldGetBye) {
          const targetMatch = roundAfterNext[roundAfterNext.length - 1];
          
          // If editing and winner changed, remove the OLD winner from target match first
          if (winnerChanged) {
            const { data: freshTarget } = await supabase
              .from("matches")
              .select("player1_id, player2_id")
              .eq("id", targetMatch.id)
              .single();
            
            if (freshTarget?.player1_id === previousWinner.id) {
              await supabase.from("matches").update({ player1_id: null }).eq("id", targetMatch.id);
            } else if (freshTarget?.player2_id === previousWinner.id) {
              await supabase.from("matches").update({ player2_id: null }).eq("id", targetMatch.id);
            }
          }
          
          // Place new winner
          const { data: freshTargetMatch } = await supabase
            .from("matches")
            .select("player1_id, player2_id")
            .eq("id", targetMatch.id)
            .single();
          
          const slotToFill = freshTargetMatch?.player1_id === null ? "player1_id" : "player2_id";
          await supabase
            .from("matches")
            .update({ [slotToFill]: winner.id })
            .eq("id", targetMatch.id);
        } else {
          // Normal advancement
          const effectiveIndex = matchIndexInRound;
          const nextMatchIndex = Math.floor(effectiveIndex / 2);
          const nextMatch = nextRoundMatches[nextMatchIndex];
          
          if (nextMatch) {
            // If editing and winner changed, remove the OLD winner from next match first
            if (winnerChanged) {
              const { data: freshNext } = await supabase
                .from("matches")
                .select("player1_id, player2_id")
                .eq("id", nextMatch.id)
                .single();
              
              if (freshNext?.player1_id === previousWinner.id) {
                await supabase.from("matches").update({ player1_id: null }).eq("id", nextMatch.id);
              } else if (freshNext?.player2_id === previousWinner.id) {
                await supabase.from("matches").update({ player2_id: null }).eq("id", nextMatch.id);
              }
            }
            
            // Fetch fresh state and place new winner
            const { data: freshNextMatch } = await supabase
              .from("matches")
              .select("player1_id, player2_id")
              .eq("id", nextMatch.id)
              .single();
            
            const preferredField = effectiveIndex % 2 === 0 ? "player1_id" : "player2_id";
            const preferredSlotFilled = preferredField === "player1_id" 
              ? freshNextMatch?.player1_id !== null 
              : freshNextMatch?.player2_id !== null;
            
            const updateField = preferredSlotFilled 
              ? (preferredField === "player1_id" ? "player2_id" : "player1_id")
              : preferredField;
            
            await supabase
              .from("matches")
              .update({ [updateField]: winner.id })
              .eq("id", nextMatch.id);
          }
        }
      }

      // Check if this was the final match
      const isFinalMatch = match.round === tournament.rounds;
      if (isFinalMatch) {
        await supabase
          .from("tournaments")
          .update({ is_complete: true, champion_id: winner.id })
          .eq("id", tournament.id);
        
        // Show the winner celebration since tournament just completed
        setShowWinnerCelebration(true);
      }

      // Reload tournament to get fresh data
      await reloadCurrentTournament(tournament.id);
    } catch (err) {
      console.error("Error updating match score:", err);
      setError(err instanceof Error ? err.message : "Failed to update score");
    }
  }, [tournament]);

  const resetTournament = useCallback(async () => {
    // Require login to create tournaments
    if (!user) {
      setError("Please sign in to create a tournament");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Get user's saved settings (persisted across tournaments) or use defaults
      const userSettings = getUserSettings();

      // Create a new tournament with user's saved settings and user_id
      const { data: newTournament, error: createError } = await supabase
        .from("tournaments")
        .insert({ 
          name: "Pickleball Championship",
          score_limit: userSettings.scoreLimit,
          win_by_two: userSettings.winByTwo,
          game_timer_minutes: userSettings.gameTimerMinutes,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      setTournament({
        id: newTournament.id,
        name: newTournament.name,
        userId: user.id,
        players: [],
        matches: [],
        rounds: 0,
        isStarted: false,
        isComplete: false,
        champion: null,
        settings: userSettings,
      });
    } catch (err) {
      console.error("Error resetting tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to reset tournament");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startMatchTimer = useCallback(async (matchId: string) => {
    if (!tournament) return;

    try {
      setError(null);
      const match = tournament.matches.find(m => m.id === matchId);
      const gameTimerMinutes = tournament.settings.gameTimerMinutes;
      
      let now: string;
      
      // If there's paused remaining time, calculate the start time to account for it
      if (match?.timerPausedRemaining && gameTimerMinutes) {
        // Calculate what the start time would have been to have this much remaining
        const totalSeconds = gameTimerMinutes * 60;
        const elapsedSeconds = totalSeconds - match.timerPausedRemaining;
        const startTime = new Date(Date.now() - elapsedSeconds * 1000);
        now = startTime.toISOString();
      } else {
        now = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from("matches")
        .update({ timer_started_at: now, timer_paused_remaining: null })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Update local state immediately for responsiveness
      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === matchId ? { ...m, timerStartedAt: now, timerPausedRemaining: null } : m
          ),
        };
      });
    } catch (err) {
      console.error("Error starting match timer:", err);
      setError(err instanceof Error ? err.message : "Failed to start timer");
    }
  }, [tournament]);

  const pauseMatchTimer = useCallback(async (matchId: string) => {
    if (!tournament) return;

    try {
      setError(null);
      const match = tournament.matches.find(m => m.id === matchId);
      const gameTimerMinutes = tournament.settings.gameTimerMinutes;
      
      if (!match?.timerStartedAt || !gameTimerMinutes) return;
      
      // Calculate remaining time
      const startTime = new Date(match.timerStartedAt).getTime();
      const totalDuration = gameTimerMinutes * 60 * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((totalDuration - elapsed) / 1000));
      
      const { error: updateError } = await supabase
        .from("matches")
        .update({ timer_started_at: null, timer_paused_remaining: remaining })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Update local state immediately for responsiveness
      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === matchId ? { ...m, timerStartedAt: null, timerPausedRemaining: remaining } : m
          ),
        };
      });
    } catch (err) {
      console.error("Error pausing match timer:", err);
      setError(err instanceof Error ? err.message : "Failed to pause timer");
    }
  }, [tournament]);

  const resetMatchTimer = useCallback(async (matchId: string) => {
    if (!tournament) return;

    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from("matches")
        .update({ timer_started_at: null, timer_paused_remaining: null })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Update local state immediately for responsiveness
      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === matchId ? { ...m, timerStartedAt: null, timerPausedRemaining: null } : m
          ),
        };
      });
    } catch (err) {
      console.error("Error resetting match timer:", err);
      setError(err instanceof Error ? err.message : "Failed to reset timer");
    }
  }, [tournament]);

  const loadTournamentById = useCallback(async (tournamentId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the specific tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      // Load players for this tournament
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });

      if (playersError) throw playersError;

      // Load matches for this tournament
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (matchesError) throw matchesError;

      // Find champion player if exists
      let champion: Player | null = null;
      if (tournamentData.champion_id) {
        champion = players?.find((p: { id: string }) => p.id === tournamentData.champion_id) || null;
      }

      // Transform matches to include player objects
      const playerMap = new Map(players?.map((p: { id: string; name: string; seed: number }) => [p.id, { id: p.id, name: p.name, seed: p.seed }]) || []);
      
      const transformedMatches: Match[] = (matches || []).map((m: {
        id: string;
        round: number;
        match_number: number;
        player1_id: string | null;
        player2_id: string | null;
        score1: number | null;
        score2: number | null;
        winner_id: string | null;
        is_complete: boolean;
        timer_started_at: string | null;
        timer_paused_remaining: number | null;
      }) => ({
        id: m.id,
        round: m.round,
        matchNumber: m.match_number,
        player1: m.player1_id ? playerMap.get(m.player1_id) || null : null,
        player2: m.player2_id ? playerMap.get(m.player2_id) || null : null,
        score1: m.score1,
        score2: m.score2,
        winner: m.winner_id ? playerMap.get(m.winner_id) || null : null,
        isComplete: m.is_complete,
        timerStartedAt: m.timer_started_at,
        timerPausedRemaining: m.timer_paused_remaining,
      }));

      // Parse settings from tournament data
      const settings: TournamentSettings = {
        scoreLimit: tournamentData.score_limit ?? DEFAULT_SETTINGS.scoreLimit,
        winByTwo: tournamentData.win_by_two ?? DEFAULT_SETTINGS.winByTwo,
        gameTimerMinutes: tournamentData.game_timer_minutes ?? DEFAULT_SETTINGS.gameTimerMinutes,
      };

      setTournament({
        id: tournamentData.id,
        name: tournamentData.name,
        userId: tournamentData.user_id || null,
        players: players?.map((p: { id: string; name: string; seed: number }) => ({ id: p.id, name: p.name, seed: p.seed })) || [],
        matches: transformedMatches,
        rounds: tournamentData.rounds || 0,
        isStarted: tournamentData.is_started,
        isComplete: tournamentData.is_complete,
        champion,
        settings,
      });
    } catch (err) {
      console.error("Error loading tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        loading,
        error,
        showWinnerCelebration,
        dismissWinnerCelebration,
        addPlayer,
        removePlayer,
        generateBracket,
        updateMatchScore,
        resetTournament,
        setTournamentName,
        updateSettings,
        loadTournamentById,
        startMatchTimer,
        pauseMatchTimer,
        resetMatchTimer,
        getUserSettingsPreference: getUserSettings,
        saveUserSettingsPreference: saveUserSettings,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
