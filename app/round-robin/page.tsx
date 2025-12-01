"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const [phase, setPhase] = useState<Phase>("setup");
  const [loading, setLoading] = useState(false); // Start false - no auto-loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Setup state
  const [tournamentName, setTournamentName] = useState("Round Robin Championship");
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [numCourts, setNumCourts] = useState(3);
  const [scoreLimit, setScoreLimit] = useState(11);
  
  // Pool play state
  const [pools, setPools] = useState<Pool[]>([]);
  const [activePool, setActivePool] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<PoolMatch | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  
  // Rankings state
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffTeams, setPlayoffTeams] = useState<Team[]>([]);
  
  // Tournament ID for persistence
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  // No auto-loading - always start fresh on setup phase
  // Users can load existing tournaments from History page

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
              })),
            });
          }
          
          setPools(loadedPools);
          setActivePool(loadedPools[0]?.id || null);
          
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
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

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

  const generatePools = useCallback(() => {
    if (teams.length < 4) {
      setError("Need at least 4 teams to create pools");
      return null;
    }
    
    // Shuffle teams for random assignment
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    // Split into two pools as evenly as possible
    const poolASize = Math.ceil(shuffledTeams.length / 2);
    const poolATeams = shuffledTeams.slice(0, poolASize);
    const poolBTeams = shuffledTeams.slice(poolASize);
    
    // Generate round robin matches for a pool
    const generatePoolMatches = (poolTeams: Team[], poolId: string): PoolMatch[] => {
      const matches: PoolMatch[] = [];
      let matchNum = 1;
      
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          matches.push({
            id: `match-${poolId}-${matchNum}`,
            poolId,
            team1: poolTeams[i],
            team2: poolTeams[j],
            score1: null,
            score2: null,
            isComplete: false,
            matchNumber: matchNum,
          });
          matchNum++;
        }
      }
      
      return matches;
    };
    
    const poolA: Pool = {
      id: "pool-a",
      name: "Pool A",
      teams: poolATeams.map(t => ({ ...t, poolId: "pool-a" })),
      matches: generatePoolMatches(poolATeams.map(t => ({ ...t, poolId: "pool-a" })), "pool-a"),
    };
    
    const poolB: Pool = {
      id: "pool-b",
      name: "Pool B",
      teams: poolBTeams.map(t => ({ ...t, poolId: "pool-b" })),
      matches: generatePoolMatches(poolBTeams.map(t => ({ ...t, poolId: "pool-b" })), "pool-b"),
    };
    
    return [poolA, poolB];
  }, [teams]);

  const startPoolPlay = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const generatedPools = generatePools();
      if (!generatedPools) return;
      
      // Create tournament in database
      const { data: tournament, error: tournamentError } = await supabase
        .from("round_robin_tournaments")
        .insert({
          name: tournamentName,
          score_limit: scoreLimit,
          num_courts: numCourts,
          is_pool_play_complete: false,
          is_playoffs_started: false,
        })
        .select()
        .single();
      
      if (tournamentError) throw tournamentError;
      
      setTournamentId(tournament.id);
      
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
      setActivePool(generatedPools[0].id);
      setPhase("pool-play");
    } catch (err) {
      console.error("Error starting pool play:", err);
      setError(err instanceof Error ? err.message : "Failed to start pool play");
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
      
      // Check if all matches are complete
      const updatedPools = pools.map(pool => ({
        ...pool,
        matches: pool.matches.map(m =>
          m.id === selectedMatch.id
            ? { ...m, score1: s1, score2: s2, isComplete: true }
            : m
        ),
      }));
      
      const allComplete = updatedPools.every(pool =>
        pool.matches.every(m => m.isComplete || m.id === selectedMatch.id)
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
      
      // Create a new bracket tournament with the playoff teams
      const { data: bracketTournament, error: createError } = await supabase
        .from("tournaments")
        .insert({
          name: `${tournamentName} - Playoffs`,
          rounds: 0,
          is_started: false,
          is_complete: false,
          score_limit: scoreLimit,
          win_by_two: true,
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
      
      // Redirect to the bracket page with this tournament
      router.push(`/bracket?tournament=${bracketTournament.id}`);
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
      
      // Reset state
      setTournamentId(null);
      setTeams([]);
      setPools([]);
      setStandings([]);
      setPlayoffTeams([]);
      setPhase("setup");
      setActivePool(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading round robin..." />
      </div>
    );
  }

  const activePoolData = pools.find(p => p.id === activePool);
  const completedMatches = pools.reduce((acc, pool) => acc + pool.matches.filter(m => m.isComplete).length, 0);
  const totalMatches = pools.reduce((acc, pool) => acc + pool.matches.length, 0);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-orange-400/30">
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
                    <option value={7}>7 points</option>
                    <option value={11}>11 points</option>
                    <option value={15}>15 points</option>
                    <option value={21}>21 points</option>
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
                      <option key={n} value={n}>{n} court{n > 1 ? "s" : ""}</option>
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
            {teams.length >= 4 && (
              <div className="glass rounded-3xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Pool Preview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                    <h3 className="font-semibold text-blue-400 mb-2">Pool A</h3>
                    <p className="text-white/60 text-sm">
                      {Math.ceil(teams.length / 2)} teams • {Math.ceil(teams.length / 2) * (Math.ceil(teams.length / 2) - 1) / 2} matches
                    </p>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                    <h3 className="font-semibold text-green-400 mb-2">Pool B</h3>
                    <p className="text-white/60 text-sm">
                      {Math.floor(teams.length / 2)} teams • {Math.floor(teams.length / 2) * (Math.floor(teams.length / 2) - 1) / 2} matches
                    </p>
                  </div>
                </div>
              </div>
            )}

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
            {/* Pool Tabs */}
            <div className="flex gap-2">
              {pools.map(pool => {
                const poolComplete = pool.matches.filter(m => m.isComplete).length;
                const poolTotal = pool.matches.length;
                return (
                  <button
                    key={pool.id}
                    onClick={() => setActivePool(pool.id)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      activePool === pool.id
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {pool.name} ({poolComplete}/{poolTotal})
                  </button>
                );
              })}
            </div>

            {/* Pool Teams */}
            {activePoolData && (
              <div className="glass rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Teams in {activePoolData.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {activePoolData.teams.map(team => (
                    <span
                      key={team.id}
                      className="px-3 py-1 rounded-full bg-white/10 text-white text-sm"
                    >
                      {team.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matches */}
            {activePoolData && (
              <div className="glass rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Matches</h3>
                <div className="space-y-3">
                  {activePoolData.matches.map(match => (
                    <div
                      key={match.id}
                      className={`rounded-xl p-4 border ${
                        match.isComplete
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-white/5 border-white/10 cursor-pointer hover:border-orange-500/50"
                      }`}
                      onClick={() => !match.isComplete && setSelectedMatch(match)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-white/40 text-sm">#{match.matchNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className={match.isComplete && match.score1! > match.score2! ? "text-lime-400 font-bold" : "text-white"}>
                              {match.team1.name}
                            </span>
                            <span className="text-white/40">vs</span>
                            <span className={match.isComplete && match.score2! > match.score1! ? "text-lime-400 font-bold" : "text-white"}>
                              {match.team2.name}
                            </span>
                          </div>
                        </div>
                        {match.isComplete ? (
                          <span className="font-mono font-bold text-white">
                            {match.score1} - {match.score2}
                          </span>
                        ) : (
                          <span className="text-orange-400 text-sm">Click to enter score</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetTournament}
                className="px-6 py-3 rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30"
              >
                Reset Tournament
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
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Enter Score</h3>
                  <p className="text-white/60 text-center mb-6">Game to {scoreLimit}</p>
                  
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
                      {saving ? "Saving..." : "Save Score"}
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
    </div>
  );
}

