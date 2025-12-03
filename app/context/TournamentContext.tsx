"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const DEFAULT_SETTINGS: TournamentSettings = {
  scoreLimit: 11,
  winByTwo: true,
  gameTimerMinutes: null,
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

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false); // Start as false - no auto-loading
  const [error, setError] = useState<string | null>(null);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);

  const dismissWinnerCelebration = useCallback(() => {
    setShowWinnerCelebration(false);
  }, []);

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
      const bracketSize = nextPowerOf2(tournament.players.length);
      const rounds = Math.log2(bracketSize);
      const shuffledPlayers = shuffleArray(tournament.players);
      const scoreLimit = tournament.settings.scoreLimit;

      // Create byes for players that don't have opponents
      const playersWithByes: (Player | null)[] = [...shuffledPlayers];
      while (playersWithByes.length < bracketSize) {
        playersWithByes.push(null);
      }

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

      // Generate first round matches
      for (let i = 0; i < bracketSize / 2; i++) {
        const player1 = playersWithByes[i * 2];
        const player2 = playersWithByes[i * 2 + 1];
        const isBye = player1 === null || player2 === null;
        const winner = isBye ? (player1 || player2) : null;

        matchesToCreate.push({
          tournament_id: tournament.id,
          round: 1,
          match_number: matchNumber++,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          score1: isBye ? (player1 ? scoreLimit : 0) : null,
          score2: isBye ? (player2 ? scoreLimit : 0) : null,
          winner_id: winner?.id || null,
          is_complete: isBye,
        });
      }

      // Generate empty matches for subsequent rounds
      for (let round = 2; round <= rounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);
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
      }

      // Insert all matches
      const { data: insertedMatches, error: insertError } = await supabase
        .from("matches")
        .insert(matchesToCreate)
        .select();

      if (insertError) throw insertError;

      // Advance bye winners to next round
      const matchesByRound: { [key: number]: typeof insertedMatches } = {};
      insertedMatches?.forEach((m) => {
        if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
        matchesByRound[m.round].push(m);
      });

      // Process bye advancements
      for (let round = 1; round < rounds; round++) {
        const currentRoundMatches = matchesByRound[round] || [];
        const nextRoundMatches = matchesByRound[round + 1] || [];

        for (let i = 0; i < currentRoundMatches.length; i++) {
          const match = currentRoundMatches[i];
          if (match.winner_id) {
            const nextMatchIndex = Math.floor(i / 2);
            const nextMatch = nextRoundMatches[nextMatchIndex];
            if (nextMatch) {
              const updateField = i % 2 === 0 ? "player1_id" : "player2_id";
              await supabase
                .from("matches")
                .update({ [updateField]: match.winner_id })
                .eq("id", nextMatch.id);
            }
          }
        }
      }

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
        const nextMatchIndex = Math.floor(matchIndexInRound / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch) {
          const updateField = matchIndexInRound % 2 === 0 ? "player1_id" : "player2_id";
          await supabase
            .from("matches")
            .update({ [updateField]: winner.id })
            .eq("id", nextMatch.id);
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
    try {
      setError(null);
      setLoading(true);

      // Create a new tournament with default settings
      const { data: newTournament, error: createError } = await supabase
        .from("tournaments")
        .insert({ 
          name: "Pickleball Championship",
          score_limit: DEFAULT_SETTINGS.scoreLimit,
          win_by_two: DEFAULT_SETTINGS.winByTwo,
          game_timer_minutes: DEFAULT_SETTINGS.gameTimerMinutes,
        })
        .select()
        .single();

      if (createError) throw createError;

      setTournament({
        id: newTournament.id,
        name: newTournament.name,
        players: [],
        matches: [],
        rounds: 0,
        isStarted: false,
        isComplete: false,
        champion: null,
        settings: DEFAULT_SETTINGS,
      });
    } catch (err) {
      console.error("Error resetting tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to reset tournament");
    } finally {
      setLoading(false);
    }
  }, []);

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
