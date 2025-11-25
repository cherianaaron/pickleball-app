"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
}

interface TournamentContextType {
  tournament: Tournament | null;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  generateBracket: () => void;
  updateMatchScore: (matchId: string, score1: number, score2: number) => void;
  resetTournament: () => void;
  setTournamentName: (name: string) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

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
  const [tournament, setTournament] = useState<Tournament>({
    id: generateId(),
    name: "Pickleball Championship",
    players: [],
    matches: [],
    rounds: 0,
    isStarted: false,
    isComplete: false,
    champion: null,
  });

  const addPlayer = useCallback((name: string) => {
    if (!name.trim()) return;
    
    setTournament((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { id: generateId(), name: name.trim(), seed: prev.players.length + 1 },
      ],
    }));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setTournament((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  }, []);

  const setTournamentName = useCallback((name: string) => {
    setTournament((prev) => ({
      ...prev,
      name,
    }));
  }, []);

  const generateBracket = useCallback(() => {
    setTournament((prev) => {
      if (prev.players.length < 2) return prev;

      const bracketSize = nextPowerOf2(prev.players.length);
      const rounds = Math.log2(bracketSize);
      const shuffledPlayers = shuffleArray(prev.players);
      
      // Create byes for players that don't have opponents
      const playersWithByes: (Player | null)[] = [...shuffledPlayers];
      while (playersWithByes.length < bracketSize) {
        playersWithByes.push(null);
      }

      const matches: Match[] = [];
      let matchNumber = 0;

      // Generate first round matches
      for (let i = 0; i < bracketSize / 2; i++) {
        const player1 = playersWithByes[i * 2];
        const player2 = playersWithByes[i * 2 + 1];
        
        // Handle byes - if one player is null, the other automatically advances
        const isBye = player1 === null || player2 === null;
        const winner = isBye ? (player1 || player2) : null;
        
        matches.push({
          id: generateId(),
          round: 1,
          matchNumber: matchNumber++,
          player1,
          player2,
          score1: isBye ? (player1 ? 11 : 0) : null,
          score2: isBye ? (player2 ? 11 : 0) : null,
          winner,
          isComplete: isBye,
        });
      }

      // Generate empty matches for subsequent rounds
      for (let round = 2; round <= rounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);
        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            id: generateId(),
            round,
            matchNumber: matchNumber++,
            player1: null,
            player2: null,
            score1: null,
            score2: null,
            winner: null,
            isComplete: false,
          });
        }
      }

      // Advance bye winners to next round
      const advanceWinners = (matchList: Match[]) => {
        const updatedMatches = [...matchList];
        
        for (let round = 1; round < rounds; round++) {
          const currentRoundMatches = updatedMatches.filter((m) => m.round === round);
          const nextRoundMatches = updatedMatches.filter((m) => m.round === round + 1);

          currentRoundMatches.forEach((match, index) => {
            if (match.winner) {
              const nextMatchIndex = Math.floor(index / 2);
              const nextMatch = nextRoundMatches[nextMatchIndex];
              if (nextMatch) {
                if (index % 2 === 0) {
                  nextMatch.player1 = match.winner;
                } else {
                  nextMatch.player2 = match.winner;
                }
              }
            }
          });
        }

        return updatedMatches;
      };

      const finalMatches = advanceWinners(matches);

      return {
        ...prev,
        matches: finalMatches,
        rounds,
        isStarted: true,
        isComplete: false,
        champion: null,
      };
    });
  }, []);

  const updateMatchScore = useCallback((matchId: string, score1: number, score2: number) => {
    setTournament((prev) => {
      const matchIndex = prev.matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return prev;

      const match = prev.matches[matchIndex];
      if (!match.player1 || !match.player2) return prev;

      const winner = score1 > score2 ? match.player1 : match.player2;
      const updatedMatches = [...prev.matches];
      
      updatedMatches[matchIndex] = {
        ...match,
        score1,
        score2,
        winner,
        isComplete: true,
      };

      // Find and update next round match
      const nextRoundMatches = updatedMatches.filter((m) => m.round === match.round + 1);
      if (nextRoundMatches.length > 0) {
        const currentRoundMatches = updatedMatches.filter((m) => m.round === match.round);
        const matchIndexInRound = currentRoundMatches.findIndex((m) => m.id === matchId);
        const nextMatchIndex = Math.floor(matchIndexInRound / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        
        if (nextMatch) {
          const nextMatchGlobalIndex = updatedMatches.findIndex((m) => m.id === nextMatch.id);
          if (matchIndexInRound % 2 === 0) {
            updatedMatches[nextMatchGlobalIndex] = {
              ...updatedMatches[nextMatchGlobalIndex],
              player1: winner,
            };
          } else {
            updatedMatches[nextMatchGlobalIndex] = {
              ...updatedMatches[nextMatchGlobalIndex],
              player2: winner,
            };
          }
        }
      }

      // Check if tournament is complete (final match has a winner)
      const finalMatch = updatedMatches.find((m) => m.round === prev.rounds);
      const isComplete = finalMatch?.isComplete || false;
      const champion = isComplete ? finalMatch?.winner || null : null;

      return {
        ...prev,
        matches: updatedMatches,
        isComplete,
        champion,
      };
    });
  }, []);

  const resetTournament = useCallback(() => {
    setTournament({
      id: generateId(),
      name: "Pickleball Championship",
      players: [],
      matches: [],
      rounds: 0,
      isStarted: false,
      isComplete: false,
      champion: null,
    });
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        addPlayer,
        removePlayer,
        generateBracket,
        updateMatchScore,
        resetTournament,
        setTournamentName,
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

