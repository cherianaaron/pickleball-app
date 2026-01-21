"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ShareTournament from "../components/ShareTournament";

interface Team {
  id: string;
  name: string;
  poolId: string | null;
}

interface PoolMatch {
  id: string;
  poolId: string;
  team1: Team;
  team2: Team;
  score1: number | null;
  score2: number | null;
  isComplete: boolean;
  matchNumber: number;
  round: number;
  court: number | null; // null means bye
}

interface Pool {
  id: string;
  name: string;
  teams: Team[];
  matches: PoolMatch[];
}

interface TeamStanding {
  team: Team;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  headToHead: Map<string, number>; // teamId -> 1 (won), -1 (lost), 0 (not played)
}

interface RoundRobinTournament {
  id: string;
  name: string;
  pools: Pool[];
  teams: Team[];
  isPoolPlayComplete: boolean;
  isPlayoffsStarted: boolean;
  playoffTeams: Team[];
  scoreLimit: number;
}

type Phase = "setup" | "pool-play" | "rankings" | "playoffs";

export default function RoundRobinPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { limits, loading: subLoading } = useSubscription();
  const [phase, setPhase] = useState<Phase>("setup");
  const [loading, setLoading] = useState(false); // Start false - no auto-loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to Round Robin
  const hasRoundRobinAccess = limits.hasRoundRobin;
  
  // Setup state
  const [tournamentName, setTournamentName] = useState("Round Robin Championship");
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [numCourts, setNumCourts] = useState(3);
  const [scoreLimit, setScoreLimit] = useState(11);
  
  // Pool play state
  const [pools, setPools] = useState<Pool[]>([]);
  const [activeRound, setActiveRound] = useState<number>(1);
  const [selectedMatch, setSelectedMatch] = useState<PoolMatch | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Rankings state
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffTeams, setPlayoffTeams] = useState<Team[]>([]);
  
  // Tournament ID for persistence
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [rrTournamentUserId, setRrTournamentUserId] = useState<string | null>(null);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // LocalStorage key for active round robin tournament
  const ACTIVE_RR_KEY = "activeRoundRobinTournamentId";

  const loadTournamentById = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: tournament, error: fetchError } = await supabase
        .from("round_robin_tournaments")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (tournament) {
        setTournamentId(tournament.id);
        setRrTournamentUserId(tournament.user_id || null);
        setTournamentName(tournament.name);
        setScoreLimit(tournament.score_limit || 11);
        setNumCourts(tournament.num_courts || 3);
        
        // Load teams
        const { data: teamsData } = await supabase
          .from("round_robin_teams")
          .select("*")
          .eq("tournament_id", tournament.id);
        
        if (teamsData) {
          setTeams(teamsData.map(t => ({
            id: t.id,
            name: t.name,
            poolId: t.pool_id,
          })));
        }
        
        // Load pools
        const { data: poolsData } = await supabase
          .from("round_robin_pools")
          .select("*")
          .eq("tournament_id", tournament.id);
        
        if (poolsData && poolsData.length > 0) {
          // Load pool matches
          const loadedPools: Pool[] = [];
          
          for (const pool of poolsData) {
            const { data: matchesData } = await supabase
              .from("round_robin_matches")
              .select("*")
              .eq("pool_id", pool.id)
              .order("match_number", { ascending: true });
            
            const poolTeams = teamsData?.filter(t => t.pool_id === pool.id) || [];
            const teamMap = new Map(poolTeams.map(t => [t.id, { id: t.id, name: t.name, poolId: t.pool_id }]));
            
            loadedPools.push({
              id: pool.id,
              name: pool.name,
              teams: poolTeams.map(t => ({ id: t.id, name: t.name, poolId: t.pool_id })),
              matches: (matchesData || []).map(m => ({
                id: m.id,
                poolId: m.pool_id,
                team1: teamMap.get(m.team1_id) || { id: m.team1_id, name: "Unknown", poolId: pool.id },
                team2: teamMap.get(m.team2_id) || { id: m.team2_id, name: "Unknown", poolId: pool.id },
                score1: m.score1,
                score2: m.score2,
                isComplete: m.is_complete,
                matchNumber: m.match_number,
                round: m.round || 1,
                court: m.court || null,
              })),
            });
          }
          
          setPools(loadedPools);
          setActiveRound(1);
          
          // Determine phase
          if (tournament.is_playoffs_started) {
            setPhase("playoffs");
          } else if (tournament.is_pool_play_complete) {
            calculateStandings(loadedPools);
            setPhase("rankings");
          } else {
            setPhase("pool-play");
          }
        } else if (teamsData && teamsData.length > 0) {
          setPhase("setup");
        }
      }
    } catch (err) {
      console.error("Error loading tournament:", err);
      // If tournament not found, clear localStorage
      localStorage.removeItem(ACTIVE_RR_KEY);
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load active tournament on mount (only if logged in)
  useEffect(() => {
    const autoLoadTournament = async () => {
      if (!user || authLoading) return;
      
      // First, try to load from localStorage
      const savedTournamentId = localStorage.getItem(ACTIVE_RR_KEY);
      if (savedTournamentId) {
        loadTournamentById(savedTournamentId);
        return;
      }
      
      // If no localStorage, check if user owns or has joined any active round robin tournaments
      try {
        // First check for owned tournaments
        const { data: ownedTournaments, error: ownedError } = await supabase
          .from("round_robin_tournaments")
          .select("id, name, is_playoffs_started")
          .eq("user_id", user.id)
          .eq("is_playoffs_started", false) // Only get tournaments that haven't moved to playoffs
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (ownedError) {
          console.error("Error checking owned tournaments:", ownedError);
        }
        
        // Auto-load the most recent active tournament owned by this user
        if (ownedTournaments && ownedTournaments.length > 0) {
          const mostRecent = ownedTournaments[0];
          console.log("Auto-loading owned tournament:", mostRecent.name);
          loadTournamentById(mostRecent.id);
          return;
        }
        
        // If not an owner, check if user has joined any tournaments as collaborator
        const { data: collaborations, error: collabError } = await supabase
          .from("round_robin_collaborators")
          .select("tournament_id")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(1);
        
        if (collabError) {
          console.error("Error checking collaborations:", collabError);
          return;
        }
        
        if (collaborations && collaborations.length > 0) {
          // Verify the tournament is still active (not in playoffs)
          const { data: tournament, error: tournamentError } = await supabase
            .from("round_robin_tournaments")
            .select("id, name, is_playoffs_started")
            .eq("id", collaborations[0].tournament_id)
            .eq("is_playoffs_started", false)
            .single();
          
          if (tournamentError) {
            console.error("Error checking collaborated tournament:", tournamentError);
            return;
          }
          
          if (tournament) {
            console.log("Auto-loading collaborated tournament:", tournament.name);
            loadTournamentById(tournament.id);
          }
        }
      } catch (err) {
        console.error("Error auto-loading tournament:", err);
      }
    };
    
    autoLoadTournament();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Clear state when user signs out
  useEffect(() => {
    if (!user && !authLoading) {
      // User signed out - clear tournament state
      setTournamentId(null);
      setTeams([]);
      setPools([]);
      setStandings([]);
      setPlayoffTeams([]);
      setPhase("setup");
      setActiveRound(1);
      setSelectedMatch(null);
      // Clear localStorage
      localStorage.removeItem(ACTIVE_RR_KEY);
    }
  }, [user, authLoading]);

  // Save tournament ID to localStorage when it changes
  useEffect(() => {
    if (tournamentId && phase !== "setup") {
      localStorage.setItem(ACTIVE_RR_KEY, tournamentId);
    }
  }, [tournamentId, phase]);

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    
    const newTeam: Team = {
      id: `temp-${Date.now()}`,
      name: newTeamName.trim(),
      poolId: null,
    };
    
    setTeams([...teams, newTeam]);
    setNewTeamName("");
  };

  const removeTeam = (teamId: string) => {
    setTeams(teams.filter(t => t.id !== teamId));
  };

  // Circle method for round-robin scheduling
  // This ensures each team plays exactly once per round
  const generateRoundRobinSchedule = (poolTeams: Team[], poolId: string): PoolMatch[] => {
    const n = poolTeams.length;
    const matches: PoolMatch[] = [];
    let matchNum = 1;
    
    // If odd number of teams, add a "bye" placeholder
    const teamsWithBye = n % 2 === 1 
      ? [...poolTeams, { id: "bye", name: "BYE", poolId } as Team]
      : [...poolTeams];
    
    const teamCount = teamsWithBye.length;
    const numRounds = teamCount - 1;
    const matchesPerRound = teamCount / 2;
    
    // Circle method: fix first team, rotate the rest
    for (let round = 0; round < numRounds; round++) {
      const roundMatches: PoolMatch[] = [];
      
      for (let match = 0; match < matchesPerRound; match++) {
        // Calculate team indices for this match using circle method
        let team1Index: number;
        let team2Index: number;
        
        if (match === 0) {
          // First team is always fixed at position 0
          team1Index = 0;
          team2Index = (round % (teamCount - 1)) + 1;
        } else {
          // Rotate the rest
          team1Index = ((round + match) % (teamCount - 1)) + 1;
          team2Index = ((round + teamCount - 1 - match) % (teamCount - 1)) + 1;
        }
        
        const team1 = teamsWithBye[team1Index];
        const team2 = teamsWithBye[team2Index];
        
        // Skip matches involving the bye
        if (team1.id === "bye" || team2.id === "bye") {
          continue;
        }
        
        roundMatches.push({
          id: `match-${poolId}-${matchNum}`,
          poolId,
          team1,
          team2,
          score1: null,
          score2: null,
          isComplete: false,
          matchNumber: matchNum,
          round: round + 1,
          court: null, // Will be assigned when interleaving
        });
        matchNum++;
      }
      
      matches.push(...roundMatches);
    }
    
    return matches;
  };

  const generatePools = useCallback(() => {
    if (teams.length < 4) {
      setError("Need at least 4 teams to create pools");
      return null;
    }
    
    // Shuffle teams for random assignment
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    // Split into two pools with these priorities:
    // 1. NO BYES when total is even (both pools must have even # of teams)
    // 2. Only 1 bye when total is odd (one pool odd, one pool even)
    // 3. Maximize court utilization (larger pool gets more teams)
    const total = shuffledTeams.length;
    let poolASize: number;
    
    if (total % 2 === 0) {
      // Even total: ensure both pools are even (NO BYES)
      const half = total / 2;
      if (half % 2 === 1) {
        // Half is odd, so 50/50 split would give two odd pools (bad - 2 byes)
        // Instead do (half+1)/(half-1) to get two even pools
        poolASize = half + 1; // e.g., 10 -> 6,4
      } else {
        // Half is even, 50/50 split gives two even pools (good)
        poolASize = half; // e.g., 8 -> 4,4 or 12 -> 6,6
      }
    } else {
      // Odd total: one pool must be odd (1 bye), make it the larger pool
      poolASize = Math.ceil(total / 2); // e.g., 11 -> 6,5 or 9 -> 5,4
    }
    
    const poolATeams = shuffledTeams.slice(0, poolASize);
    const poolBTeams = shuffledTeams.slice(poolASize);
    
    const poolATeamsWithId = poolATeams.map(t => ({ ...t, poolId: "pool-a" }));
    const poolBTeamsWithId = poolBTeams.map(t => ({ ...t, poolId: "pool-b" }));
    
    const poolAMatches = generateRoundRobinSchedule(poolATeamsWithId, "pool-a");
    const poolBMatches = generateRoundRobinSchedule(poolBTeamsWithId, "pool-b");
    
    // Now assign courts by interleaving Pool A and Pool B matches per round
    // Respect the numCourts limit - matches beyond limit get null court (bye/waiting)
    const poolARounds = poolATeams.length % 2 === 1 ? poolATeams.length : poolATeams.length - 1;
    const poolBRounds = poolBTeams.length % 2 === 1 ? poolBTeams.length : poolBTeams.length - 1;
    const maxRounds = Math.max(poolARounds, poolBRounds);
    
    // Assign court numbers within each round, respecting numCourts limit
    // IMPORTANT: Alternate which pool goes first each round to distribute waiting fairly
    for (let round = 1; round <= maxRounds; round++) {
      let courtNum = 1;
      
      // Get matches for this round from both pools
      const poolAMatchesInRound = poolAMatches.filter(m => m.round === round);
      const poolBMatchesInRound = poolBMatches.filter(m => m.round === round);
      
      // Alternate priority: odd rounds = Pool A first, even rounds = Pool B first
      // This ensures waiting matches are distributed fairly across both pools
      const allMatchesInRound = round % 2 === 1
        ? [...poolAMatchesInRound, ...poolBMatchesInRound]
        : [...poolBMatchesInRound, ...poolAMatchesInRound];
      
      // Assign courts up to numCourts limit
      for (const match of allMatchesInRound) {
        if (courtNum <= numCourts) {
          match.court = courtNum++;
        } else {
          // Matches beyond court limit get null (bye/waiting for this time slot)
          match.court = null;
        }
      }
    }
    
    const poolA: Pool = {
      id: "pool-a",
      name: "Pool A",
      teams: poolATeamsWithId,
      matches: poolAMatches,
    };
    
    const poolB: Pool = {
      id: "pool-b",
      name: "Pool B",
      teams: poolBTeamsWithId,
      matches: poolBMatches,
    };
    
    return [poolA, poolB];
  }, [teams]);

  const startPoolPlay = async () => {
    // Require login to create tournaments
    if (!user) {
      setError("Please sign in to create a tournament");
      router.push("/login?redirect=/round-robin");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const generatedPools = generatePools();
      if (!generatedPools) return;
      
      // Create tournament in database with user_id
      const { data: tournament, error: tournamentError } = await supabase
        .from("round_robin_tournaments")
        .insert({
          name: tournamentName,
          score_limit: scoreLimit,
          num_courts: numCourts,
          is_pool_play_complete: false,
          is_playoffs_started: false,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (tournamentError) throw tournamentError;
      
      setTournamentId(tournament.id);
      setRrTournamentUserId(user?.id || null);
      
      // Create pools
      for (const pool of generatedPools) {
        const { data: poolData, error: poolError } = await supabase
          .from("round_robin_pools")
          .insert({
            tournament_id: tournament.id,
            name: pool.name,
          })
          .select()
          .single();
        
        if (poolError) throw poolError;
        
        // Update pool ID
        pool.id = poolData.id;
        
        // Create teams
        for (const team of pool.teams) {
          const { data: teamData, error: teamError } = await supabase
            .from("round_robin_teams")
            .insert({
              tournament_id: tournament.id,
              pool_id: poolData.id,
              name: team.name,
            })
            .select()
            .single();
          
          if (teamError) throw teamError;
          
          team.id = teamData.id;
          team.poolId = poolData.id;
        }
        
        // Create matches
        for (const match of pool.matches) {
          const team1 = pool.teams.find(t => t.name === match.team1.name);
          const team2 = pool.teams.find(t => t.name === match.team2.name);
          
          const { data: matchData, error: matchError } = await supabase
            .from("round_robin_matches")
            .insert({
              pool_id: poolData.id,
              team1_id: team1?.id,
              team2_id: team2?.id,
              match_number: match.matchNumber,
              is_complete: false,
              round: match.round,
              court: match.court,
            })
            .select()
            .single();
          
          if (matchError) throw matchError;
          
          match.id = matchData.id;
          match.poolId = poolData.id;
          match.team1 = team1!;
          match.team2 = team2!;
        }
      }
      
      setPools(generatedPools);
      setActiveRound(1);
      setPhase("pool-play");
    } catch (err: unknown) {
      console.error("Error starting pool play:", err);
      // Extract detailed error message
      let errorMessage = "Failed to start pool play";
      if (err && typeof err === 'object') {
        if ('message' in err) {
          errorMessage = String((err as { message: string }).message);
        }
        if ('details' in err) {
          errorMessage += ` - ${String((err as { details: string }).details)}`;
        }
        if ('hint' in err) {
          errorMessage += ` (${String((err as { hint: string }).hint)})`;
        }
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const submitMatchScore = async () => {
    if (!selectedMatch || score1 === "" || score2 === "") return;
    
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("Invalid scores");
      return;
    }
    
    if (s1 === s2) {
      setError("Scores cannot be tied");
      return;
    }
    
    try {
      setSaving(true);
      
      const { error: updateError } = await supabase
        .from("round_robin_matches")
        .update({
          score1: s1,
          score2: s2,
          is_complete: true,
        })
        .eq("id", selectedMatch.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setPools(pools.map(pool => ({
        ...pool,
        matches: pool.matches.map(m =>
          m.id === selectedMatch.id
            ? { ...m, score1: s1, score2: s2, isComplete: true }
            : m
        ),
      })));
      
      setSelectedMatch(null);
      setScore1("");
      setScore2("");
      setIsEditing(false);
      
      // Check if all matches are complete
      const updatedPools = pools.map(pool => ({
        ...pool,
        matches: pool.matches.map(m =>
          m.id === selectedMatch.id
            ? { ...m, score1: s1, score2: s2, isComplete: true }
            : m
        ),
      }));
      
      // Only check matches with courts assigned (exclude waiting matches)
      const allComplete = updatedPools.every(pool =>
        pool.matches.every(m => m.court === null || m.isComplete || m.id === selectedMatch.id)
      );
      
      if (allComplete) {
        await supabase
          .from("round_robin_tournaments")
          .update({ is_pool_play_complete: true })
          .eq("id", tournamentId);
        
        calculateStandings(updatedPools);
        setPhase("rankings");
      }
    } catch (err) {
      console.error("Error saving score:", err);
      setError(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setSaving(false);
    }
  };

  const calculateStandings = (poolsData: Pool[]) => {
    const allStandings: TeamStanding[] = [];
    
    for (const pool of poolsData) {
      const poolStandings = new Map<string, TeamStanding>();
      
      // Initialize standings for each team
      for (const team of pool.teams) {
        poolStandings.set(team.id, {
          team,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDiff: 0,
          headToHead: new Map(),
        });
      }
      
      // Calculate stats from matches
      for (const match of pool.matches) {
        if (!match.isComplete || match.score1 === null || match.score2 === null) continue;
        
        const team1Standing = poolStandings.get(match.team1.id)!;
        const team2Standing = poolStandings.get(match.team2.id)!;
        
        team1Standing.pointsFor += match.score1;
        team1Standing.pointsAgainst += match.score2;
        team2Standing.pointsFor += match.score2;
        team2Standing.pointsAgainst += match.score1;
        
        if (match.score1 > match.score2) {
          team1Standing.wins++;
          team2Standing.losses++;
          team1Standing.headToHead.set(match.team2.id, 1);
          team2Standing.headToHead.set(match.team1.id, -1);
        } else {
          team2Standing.wins++;
          team1Standing.losses++;
          team2Standing.headToHead.set(match.team1.id, 1);
          team1Standing.headToHead.set(match.team2.id, -1);
        }
      }
      
      // Calculate point differential
      for (const standing of poolStandings.values()) {
        standing.pointDiff = standing.pointsFor - standing.pointsAgainst;
        allStandings.push(standing);
      }
    }
    
    // Sort by: wins, point differential, then random (coin flip)
    allStandings.sort((a, b) => {
      // First by wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      
      // Then by point differential
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      
      // Head-to-head
      const h2h = a.headToHead.get(b.team.id);
      if (h2h !== undefined && h2h !== 0) return -h2h;
      
      // Coin flip (random)
      return Math.random() - 0.5;
    });
    
    setStandings(allStandings);
    
    // Top 6 advance to playoffs
    const top6 = allStandings.slice(0, Math.min(6, allStandings.length));
    setPlayoffTeams(top6.map(s => s.team));
  };

  const startPlayoffs = async () => {
    if (playoffTeams.length < 2) {
      setError("Not enough teams for playoffs");
      return;
    }
    
    try {
      setSaving(true);
      
      // Mark tournament as playoffs started
      await supabase
        .from("round_robin_tournaments")
        .update({ is_playoffs_started: true })
        .eq("id", tournamentId);
      
      // Clear localStorage since we're moving to playoffs
      localStorage.removeItem(ACTIVE_RR_KEY);
      
      // Create a new bracket tournament with the playoff teams (with user_id)
      const { data: bracketTournament, error: createError } = await supabase
        .from("tournaments")
        .insert({
          name: `${tournamentName} - Playoffs`,
          rounds: 0,
          is_started: false,
          is_complete: false,
          score_limit: scoreLimit,
          win_by_two: true,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Add playoff teams as players
      for (let i = 0; i < playoffTeams.length; i++) {
        await supabase.from("players").insert({
          tournament_id: bracketTournament.id,
          name: playoffTeams[i].name,
          seed: i + 1,
        });
      }
      
      // Redirect to the players page to generate the bracket
      // The players are already added, user just needs to click "Generate Bracket"
      router.push(`/players?tournament=${bracketTournament.id}`);
    } catch (err) {
      console.error("Error starting playoffs:", err);
      setError(err instanceof Error ? err.message : "Failed to start playoffs");
    } finally {
      setSaving(false);
    }
  };

  const resetTournament = async () => {
    if (!confirm("Are you sure you want to reset this round robin tournament? All data will be lost.")) {
      return;
    }
    
    try {
      setSaving(true);
      
      if (tournamentId) {
        // Delete all related data
        await supabase.from("round_robin_matches").delete().eq("pool_id", pools[0]?.id || "");
        await supabase.from("round_robin_matches").delete().eq("pool_id", pools[1]?.id || "");
        await supabase.from("round_robin_teams").delete().eq("tournament_id", tournamentId);
        await supabase.from("round_robin_pools").delete().eq("tournament_id", tournamentId);
        await supabase.from("round_robin_tournaments").delete().eq("id", tournamentId);
      }
      
      // Clear localStorage
      localStorage.removeItem(ACTIVE_RR_KEY);
      
      // Reset state
      setTournamentId(null);
      setTeams([]);
      setPools([]);
      setStandings([]);
      setPlayoffTeams([]);
      setPhase("setup");
      setActiveRound(1);
      setSelectedMatch(null);
    } catch (err) {
      console.error("Error resetting:", err);
      setError(err instanceof Error ? err.message : "Failed to reset tournament");
    } finally {
      setSaving(false);
    }
  };

  const finishPoolPlay = async () => {
    try {
      setSaving(true);
      
      await supabase
        .from("round_robin_tournaments")
        .update({ is_pool_play_complete: true })
        .eq("id", tournamentId);
      
      calculateStandings(pools);
      setPhase("rankings");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to finish pool play");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading round robin..." />
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have Round Robin access and is in setup (not viewing existing)
  if (!hasRoundRobinAccess && phase === "setup" && !tournamentId) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Round Robin is a Pro Feature</h1>
            <p className="text-white/60 mb-8">
              Upgrade to Club or League to create Round Robin tournaments with multiple pools, 
              automatic scheduling, and playoff brackets.
            </p>
            
            <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
              <p className="text-lime-400 font-semibold mb-3">What you get with Round Robin:</p>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Create 2-pool tournaments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Automatic match scheduling
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Court assignments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Live standings and rankings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Automatic playoff bracket creation
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                🚀 Upgrade to Pro
              </Link>
              <Link
                href="/bracket"
                className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                🏆 Use Bracket Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated and in setup phase
  if (!user && phase === "setup") {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="glass rounded-3xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-orange-400/30 mx-auto mb-6">
              <span className="text-4xl">🔄</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Round Robin Tournament</h1>
            <p className="text-white/60 mb-8">
              Sign in to create and manage your Round Robin tournaments.
            </p>
            <Link
              href="/login?redirect=/round-robin"
              className="inline-block px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Sign In to Create Tournament
            </Link>
            <div className="mt-6">
              <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only count matches that have a court assigned (exclude waiting matches)
  const completedMatches = pools.reduce((acc, pool) => acc + pool.matches.filter(m => m.isComplete && m.court !== null).length, 0);
  const totalMatches = pools.reduce((acc, pool) => acc + pool.matches.filter(m => m.court !== null).length, 0);
  
  // Calculate total rounds (max rounds across both pools)
  const poolA = pools.find(p => p.name === "Pool A");
  const poolB = pools.find(p => p.name === "Pool B");
  const maxRoundPoolA = poolA ? Math.max(...poolA.matches.map(m => m.round), 0) : 0;
  const maxRoundPoolB = poolB ? Math.max(...poolB.matches.map(m => m.round), 0) : 0;
  const totalRounds = Math.max(maxRoundPoolA, maxRoundPoolB);
  
  // Get all matches for the active round (from both pools)
  const getMatchesForRound = (round: number) => {
    const allMatches: (PoolMatch & { poolName: string })[] = [];
    pools.forEach(pool => {
      pool.matches
        .filter(m => m.round === round)
        .forEach(m => allMatches.push({ ...m, poolName: pool.name }));
    });
    // Sort by court number
    return allMatches.sort((a, b) => (a.court || 99) - (b.court || 99));
  };
  
  const roundMatches = getMatchesForRound(activeRound);
  const roundCompletedMatches = roundMatches.filter(m => m.isComplete).length;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
                <span className="text-3xl">🔄</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Round Robin</h1>
            <p className="text-white/50">
              {phase === "setup" && "Set up your teams and pools"}
              {phase === "pool-play" && `Pool Play - ${completedMatches}/${totalMatches} matches complete`}
              {phase === "rankings" && "Final Rankings - Select playoff teams"}
              {phase === "playoffs" && "Playoffs"}
            </p>
            {phase === "setup" && (
              <p className="text-white/40 text-sm mt-2">
                Every team plays every other team in their pool.{" "}
                <Link href="/faq#round-robin" className="text-lime-400 hover:underline">
                  Learn more →
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Phase: Setup */}
        {phase === "setup" && (
          <div className="space-y-8">
            {/* Tournament Name */}
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Tournament Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Tournament Name</label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Points to Win</label>
                  <select
                    value={scoreLimit}
                    onChange={(e) => setScoreLimit(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  >
                    <option value={7} style={{ backgroundColor: '#134e4a', color: '#ffffff' }}>7 points</option>
                    <option value={11} style={{ backgroundColor: '#134e4a', color: '#ffffff' }}>11 points</option>
                    <option value={15} style={{ backgroundColor: '#134e4a', color: '#ffffff' }}>15 points</option>
                    <option value={21} style={{ backgroundColor: '#134e4a', color: '#ffffff' }}>21 points</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Number of Courts</label>
                  <select
                    value={numCourts}
                    onChange={(e) => setNumCourts(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n} style={{ backgroundColor: '#134e4a', color: '#ffffff' }}>{n} court{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Add Teams */}
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Teams ({teams.length})
              </h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()}
                  placeholder="Enter team name..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
                />
                <button
                  onClick={addTeam}
                  disabled={!newTeamName.trim()}
                  className="px-6 py-3 rounded-xl font-bold bg-orange-500 text-white disabled:opacity-50"
                >
                  Add Team
                </button>
              </div>
              
              {teams.length === 0 ? (
                <p className="text-white/40 text-center py-8">No teams added yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {teams.map((team, index) => (
                    <div
                      key={team.id}
                      className="bg-white/10 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300">
                          {index + 1}
                        </span>
                        <span className="text-white truncate">{team.name}</span>
                      </div>
                      <button
                        onClick={() => removeTeam(team.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pool Preview */}
            {teams.length >= 4 && (() => {
              // Calculate pool sizes using same logic as generatePools
              const total = teams.length;
              let poolASize: number;
              
              if (total % 2 === 0) {
                const half = total / 2;
                poolASize = half % 2 === 1 ? half + 1 : half;
              } else {
                poolASize = Math.ceil(total / 2);
              }
              
              const poolBSize = total - poolASize;
              const poolAMatches = poolASize * (poolASize - 1) / 2;
              const poolBMatches = poolBSize * (poolBSize - 1) / 2;
              const poolAHasBye = poolASize % 2 === 1;
              const poolBHasBye = poolBSize % 2 === 1;
              const poolARounds = poolASize % 2 === 1 ? poolASize : poolASize - 1;
              const poolBRounds = poolBSize % 2 === 1 ? poolBSize : poolBSize - 1;
              const matchesPerRoundA = poolASize % 2 === 1 ? (poolASize - 1) / 2 : poolASize / 2;
              const matchesPerRoundB = poolBSize % 2 === 1 ? (poolBSize - 1) / 2 : poolBSize / 2;
              const totalMatchesPerRound = matchesPerRoundA + matchesPerRoundB;
              
              // Calculate byes based on court limit
              const courtsUsed = Math.min(numCourts, totalMatchesPerRound);
              const matchesWithBye = totalMatchesPerRound - courtsUsed; // Matches that can't play simultaneously
              const teamsWithByePerRound = matchesWithBye * 2; // 2 teams per match that has to wait
              const hasByeDueToOddPool = poolAHasBye || poolBHasBye;
              const hasByeDueToCourtLimit = matchesWithBye > 0;
              
              return (
                <div className="glass rounded-3xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Pool Preview</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                      <h3 className="font-semibold text-blue-400 mb-2">Pool A</h3>
                      <p className="text-white/60 text-sm">
                        {poolASize} teams • {poolARounds} rounds
                      </p>
                      <p className="text-white/40 text-xs">
                        {matchesPerRoundA} matches/round • {poolAMatches} total
                      </p>
                      {poolAHasBye && (
                        <p className="text-yellow-400/70 text-xs mt-1">1 bye per round (odd pool)</p>
                      )}
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                      <h3 className="font-semibold text-green-400 mb-2">Pool B</h3>
                      <p className="text-white/60 text-sm">
                        {poolBSize} teams • {poolBRounds} rounds
                      </p>
                      <p className="text-white/40 text-xs">
                        {matchesPerRoundB} matches/round • {poolBMatches} total
                      </p>
                      {poolBHasBye && (
                        <p className="text-yellow-400/70 text-xs mt-1">1 bye per round (odd pool)</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-white/70 text-sm">
                      <span className="font-semibold text-orange-400">{courtsUsed} courts</span> used • 
                      <span className="font-semibold text-white"> {poolAMatches + poolBMatches} total matches</span>
                    </p>
                    {hasByeDueToCourtLimit ? (
                      <p className="text-yellow-400/70 text-xs mt-1">
                        ⚠️ {teamsWithByePerRound} teams wait per round ({numCourts} courts &lt; {totalMatchesPerRound} matches needed)
                      </p>
                    ) : hasByeDueToOddPool ? (
                      <p className="text-yellow-400/70 text-xs mt-1">
                        1 team sits out each round (bye)
                      </p>
                    ) : (
                      <p className="text-lime-400/70 text-xs mt-1">✓ No byes - all teams play every round!</p>
                    )}
                    {poolARounds !== poolBRounds && (
                      <p className="text-white/50 text-xs mt-1">
                        Pool A: {poolARounds} rounds • Pool B: {poolBRounds} rounds
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Start Button */}
            <button
              onClick={startPoolPlay}
              disabled={teams.length < 4 || saving}
              className="w-full py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Starting..." : `Start Pool Play (${teams.length} teams)`}
            </button>
          </div>
        )}

        {/* Phase: Pool Play */}
        {phase === "pool-play" && (
          <div className="space-y-6">
            {/* Tournament Progress */}
            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{tournamentName}</h3>
                  <p className="text-white/50 text-sm">
                    {completedMatches}/{totalMatches} matches complete • {totalRounds} rounds
                  </p>
                </div>
                {/* Share Button */}
                {user && tournamentId && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="glass rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-all border border-orange-400/30 hover:border-orange-400/50"
                  >
                    <span className="text-orange-400">🤝</span>
                    <span className="text-white/70 text-sm">Share</span>
                  </button>
                )}
                <div className="flex gap-2">
                  {poolA && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                      Pool A: {poolA.teams.length} teams
                    </span>
                  )}
                  {poolB && (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30">
                      Pool B: {poolB.teams.length} teams
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Round Navigation */}
            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setActiveRound(Math.max(1, activeRound - 1))}
                  disabled={activeRound === 1}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  ← Prev
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Round {activeRound}</h2>
                  <p className="text-white/50 text-sm">
                    {roundCompletedMatches}/{roundMatches.length} matches complete
                  </p>
                </div>
                <button
                  onClick={() => setActiveRound(Math.min(totalRounds, activeRound + 1))}
                  disabled={activeRound === totalRounds}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  Next →
                </button>
              </div>
              
              {/* Round Quick Nav */}
              <div className="flex gap-2 justify-center flex-wrap">
                {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => {
                  const roundComplete = getMatchesForRound(round).every(m => m.isComplete);
                  const roundHasMatches = getMatchesForRound(round).some(m => m.isComplete);
                  return (
                    <button
                      key={round}
                      onClick={() => setActiveRound(round)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${
                        activeRound === round
                          ? "bg-orange-500 text-white scale-110"
                          : roundComplete
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : roundHasMatches
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {round}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Round Matches - Court View */}
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Round {activeRound} Matches</h3>
                <span className="text-white/50 text-sm">
                  {roundMatches.filter(m => m.court).length} on courts
                  {roundMatches.filter(m => !m.court).length > 0 && (
                    <span className="text-yellow-400/70"> • {roundMatches.filter(m => !m.court).length} waiting</span>
                  )}
                </span>
              </div>
              
              {roundMatches.length === 0 ? (
                <p className="text-white/40 text-center py-8">No matches in this round</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundMatches.map(match => {
                    // Waiting matches (no court) cannot have scores entered
                    const isWaiting = !match.court;
                    const canEnterScore = !isWaiting;
                    
                    return (
                    <div
                      key={match.id}
                      className={`rounded-xl p-4 border transition-all ${
                        match.isComplete
                          ? "bg-green-500/10 border-green-500/30 hover:border-green-400/50 cursor-pointer"
                          : isWaiting
                            ? "bg-yellow-500/5 border-yellow-500/20 opacity-60"
                            : "bg-white/5 border-white/10 hover:border-orange-500/50 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!canEnterScore && !match.isComplete) return; // Don't allow click on waiting matches
                        setSelectedMatch(match);
                        setIsEditing(match.isComplete);
                        if (match.isComplete) {
                          setScore1(String(match.score1 ?? ""));
                          setScore2(String(match.score2 ?? ""));
                        } else {
                          setScore1("");
                          setScore2("");
                        }
                      }}
                    >
                      {/* Court Badge & Pool */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {match.court ? (
                            <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold">
                              Court {match.court}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                              ⏳ Waiting
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            match.poolName === "Pool A" 
                              ? "bg-blue-500/20 text-blue-400" 
                              : "bg-green-500/20 text-green-400"
                          }`}>
                            {match.poolName}
                          </span>
                        </div>
                        {match.isComplete ? (
                          <span className="text-green-400 text-xs">✓ Complete</span>
                        ) : (
                          <span className="text-orange-400 text-xs">• In Progress</span>
                        )}
                      </div>
                      
                      {/* Teams */}
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between p-2 rounded-lg ${
                          match.isComplete && match.score1! > match.score2! 
                            ? "bg-lime-400/10" 
                            : "bg-white/5"
                        }`}>
                          <span className={`font-medium ${
                            match.isComplete && match.score1! > match.score2! 
                              ? "text-lime-400" 
                              : "text-white"
                          }`}>
                            {match.team1.name}
                          </span>
                          {match.isComplete && (
                            <span className={`font-mono font-bold ${
                              match.score1! > match.score2! ? "text-lime-400" : "text-white/60"
                            }`}>
                              {match.score1}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center justify-between p-2 rounded-lg ${
                          match.isComplete && match.score2! > match.score1! 
                            ? "bg-lime-400/10" 
                            : "bg-white/5"
                        }`}>
                          <span className={`font-medium ${
                            match.isComplete && match.score2! > match.score1! 
                              ? "text-lime-400" 
                              : "text-white"
                          }`}>
                            {match.team2.name}
                          </span>
                          {match.isComplete && (
                            <span className={`font-mono font-bold ${
                              match.score2! > match.score1! ? "text-lime-400" : "text-white/60"
                            }`}>
                              {match.score2}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Click hint */}
                      {!match.isComplete ? (
                        isWaiting ? (
                          <p className="text-yellow-400/50 text-xs text-center mt-3">
                            ⏳ Waiting for court - no score needed
                          </p>
                        ) : (
                          <p className="text-orange-400/70 text-xs text-center mt-3">
                            Tap to enter score
                          </p>
                        )
                      ) : (
                        <p className="text-green-400/50 text-xs text-center mt-3">
                          Tap to edit score
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
              
              {/* Bye/Waiting indicator - show teams not playing or waiting for courts */}
              {(() => {
                // Find teams playing on courts vs waiting
                const teamsOnCourts = new Set<string>();
                const teamsWaiting = new Set<string>();
                
                roundMatches.forEach(m => {
                  if (m.court) {
                    teamsOnCourts.add(m.team1.id);
                    teamsOnCourts.add(m.team2.id);
                  } else {
                    teamsWaiting.add(m.team1.id);
                    teamsWaiting.add(m.team2.id);
                  }
                });
                
                // Find teams with actual byes (not in any match this round)
                const teamsWithByes: { team: Team; pool: string }[] = [];
                const waitingTeams: { team: Team; pool: string }[] = [];
                const poolsDone: string[] = [];
                
                pools.forEach(pool => {
                  // Check if this pool has any matches in this round
                  const poolHasMatchesThisRound = pool.matches.some(m => m.round === activeRound);
                  
                  if (!poolHasMatchesThisRound) {
                    // Pool is done with all their rounds
                    poolsDone.push(pool.name);
                  } else {
                    // Pool has matches this round, check for byes and waiting
                    pool.teams.forEach(team => {
                      if (teamsWaiting.has(team.id)) {
                        waitingTeams.push({ team, pool: pool.name });
                      } else if (!teamsOnCourts.has(team.id)) {
                        teamsWithByes.push({ team, pool: pool.name });
                      }
                    });
                  }
                });
                
                if (teamsWithByes.length === 0 && waitingTeams.length === 0 && poolsDone.length === 0) return null;
                
                return (
                  <div className="mt-4 space-y-2">
                    {waitingTeams.length > 0 && (
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                        <p className="text-orange-400 text-sm">
                          <span className="font-semibold">⏳ Waiting for court:</span>{" "}
                          {waitingTeams.map((t, i) => (
                            <span key={t.team.id}>
                              {t.team.name} <span className="text-orange-400/50">({t.pool})</span>
                              {i < waitingTeams.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    {teamsWithByes.length > 0 && (
                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-yellow-400 text-sm">
                          <span className="font-semibold">Bye this round:</span>{" "}
                          {teamsWithByes.map((t, i) => (
                            <span key={t.team.id}>
                              {t.team.name} <span className="text-yellow-400/50">({t.pool})</span>
                              {i < teamsWithByes.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    {poolsDone.length > 0 && (
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                        <p className="text-green-400 text-sm">
                          <span className="font-semibold">✓ {poolsDone.join(" & ")} complete</span> — all matches played
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetTournament}
                className="px-6 py-3 rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30"
              >
                Reset
              </button>
              <button
                onClick={finishPoolPlay}
                disabled={completedMatches < totalMatches}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white disabled:opacity-50"
              >
                {completedMatches < totalMatches
                  ? `Complete all matches (${completedMatches}/${totalMatches})`
                  : "Finish Pool Play →"}
              </button>
            </div>

            {/* Score Entry Modal */}
            {selectedMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="glass rounded-3xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {isEditing ? "Edit Score" : "Enter Score"}
                  </h3>
                  <p className="text-white/60 text-center mb-1">Game to {scoreLimit}</p>
                  <p className="text-lime-400/70 text-xs text-center mb-6">
                    ✓ Enter any score - games can end early due to time
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white/60 text-sm mb-2 text-center">
                        {selectedMatch.team1.name}
                      </label>
                      <input
                        type="number"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-bold"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2 text-center">
                        {selectedMatch.team2.name}
                      </label>
                      <input
                        type="number"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-bold"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        setScore1("");
                        setScore2("");
                        setIsEditing(false);
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold bg-white/10 text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitMatchScore}
                      disabled={score1 === "" || score2 === "" || saving}
                      className="flex-1 py-3 rounded-xl font-bold bg-orange-500 text-white disabled:opacity-50"
                    >
                      {saving ? "Saving..." : isEditing ? "Update Score" : "✓ Complete Game"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: Rankings */}
        {phase === "rankings" && (
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Final Standings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-white/60 text-sm border-b border-white/10">
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Team</th>
                      <th className="py-3 px-4 text-center">W</th>
                      <th className="py-3 px-4 text-center">L</th>
                      <th className="py-3 px-4 text-center">PF</th>
                      <th className="py-3 px-4 text-center">PA</th>
                      <th className="py-3 px-4 text-center">+/-</th>
                      <th className="py-3 px-4 text-center">Playoffs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => {
                      const makesPlayoffs = index < 6;
                      return (
                        <tr
                          key={standing.team.id}
                          className={`border-b border-white/5 ${
                            makesPlayoffs ? "bg-lime-400/10" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`font-bold ${makesPlayoffs ? "text-lime-400" : "text-white/60"}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{standing.team.name}</td>
                          <td className="py-3 px-4 text-center text-lime-400 font-bold">{standing.wins}</td>
                          <td className="py-3 px-4 text-center text-red-400">{standing.losses}</td>
                          <td className="py-3 px-4 text-center text-white/60">{standing.pointsFor}</td>
                          <td className="py-3 px-4 text-center text-white/60">{standing.pointsAgainst}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={standing.pointDiff >= 0 ? "text-lime-400" : "text-red-400"}>
                              {standing.pointDiff > 0 ? "+" : ""}{standing.pointDiff}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {makesPlayoffs ? (
                              <span className="text-lime-400">✓</span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Playoff Bracket Preview */}
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Playoff Bracket</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-2">Seed 1 - Bye to Semifinals</p>
                    <p className="text-white font-semibold">{playoffTeams[0]?.name || "TBD"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-2">Seed 2 - Bye to Semifinals</p>
                    <p className="text-white font-semibold">{playoffTeams[1]?.name || "TBD"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
                    <p className="text-orange-400 text-xs mb-2">Quarterfinal 1: Seed 3 vs Seed 6</p>
                    <p className="text-white">{playoffTeams[2]?.name || "TBD"} vs {playoffTeams[5]?.name || "TBD"}</p>
                  </div>
                  <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
                    <p className="text-orange-400 text-xs mb-2">Quarterfinal 2: Seed 4 vs Seed 5</p>
                    <p className="text-white">{playoffTeams[3]?.name || "TBD"} vs {playoffTeams[4]?.name || "TBD"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Playoffs Button */}
            <div className="flex gap-4">
              <button
                onClick={resetTournament}
                className="px-6 py-3 rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30"
              >
                Reset
              </button>
              <button
                onClick={startPlayoffs}
                disabled={playoffTeams.length < 2 || saving}
                className="flex-1 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white disabled:opacity-50"
              >
                {saving ? "Creating Playoffs..." : "Start Playoffs →"}
              </button>
            </div>
          </div>
        )}

        {/* Phase: Playoffs */}
        {phase === "playoffs" && (
          <div className="space-y-6">
            <div className="glass rounded-3xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30 mx-auto mb-6">
                <span className="text-4xl">🏆</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Playoffs Started!</h2>
              <p className="text-white/60 mb-8">
                The round robin pool play is complete. The playoff bracket has been created.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/bracket"
                  className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg"
                >
                  🏆 View Playoff Bracket
                </Link>
                <button
                  onClick={resetTournament}
                  disabled={saving}
                  className="px-8 py-4 rounded-2xl text-lg font-semibold bg-orange-500/20 text-orange-300 border border-orange-400/30 hover:bg-orange-500/30 transition-colors"
                >
                  🔄 Start New Round Robin
                </button>
              </div>
            </div>

            {/* Tournament Summary */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tournament Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{teams.length}</p>
                  <p className="text-white/50 text-sm">Teams</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{pools.length}</p>
                  <p className="text-white/50 text-sm">Pools</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{totalMatches}</p>
                  <p className="text-white/50 text-sm">Pool Matches</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-lime-400">6</p>
                  <p className="text-white/50 text-sm">Playoff Teams</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && tournamentId && (
        <ShareTournament
          tournamentId={tournamentId}
          tournamentType="round-robin"
          isOwner={rrTournamentUserId === user?.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

