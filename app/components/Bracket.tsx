"use client";

import { useState, useEffect, useCallback } from "react";
import { useTournament, Match } from "../context/TournamentContext";
import ScoreEntry from "./ScoreEntry";

// Timer display component that updates every second
function MatchTimer({ timerStartedAt, gameTimerMinutes }: { timerStartedAt: string; gameTimerMinutes: number }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const calculateTimeRemaining = useCallback(() => {
    const startTime = new Date(timerStartedAt).getTime();
    const totalDuration = gameTimerMinutes * 60 * 1000; // in milliseconds
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    return Math.floor(remaining / 1000); // convert to seconds
  }, [timerStartedAt, gameTimerMinutes]);

  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeRemaining <= 0;
  const isLow = timeRemaining > 0 && timeRemaining <= 60;

  return (
    <div className={`
      absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold
      flex items-center gap-1 shadow-lg z-10
      ${isExpired 
        ? "bg-red-500 text-white animate-pulse" 
        : isLow 
          ? "bg-yellow-400 text-emerald-900" 
          : "bg-lime-400 text-emerald-900"}
    `}>
      <span className="text-xs">⏱</span>
      <span className="font-mono">{isExpired ? "TIME!" : formatTime(timeRemaining)}</span>
    </div>
  );
}

// Paused timer indicator
function PausedTimerIndicator({ remainingSeconds }: { remainingSeconds: number }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg z-10 bg-yellow-400 text-emerald-900">
      <span className="text-xs">⏸</span>
      <span className="font-mono">{formatTime(remainingSeconds)}</span>
    </div>
  );
}

function MatchCard({ match, onScoreClick, gameTimerMinutes, isByePlayer1, isByePlayer2 }: { 
  match: Match; 
  onScoreClick: (match: Match) => void; 
  gameTimerMinutes: number | null;
  isByePlayer1?: boolean;
  isByePlayer2?: boolean;
}) {
  const canEnterScore = match.player1 && match.player2 && !match.isComplete;
  const canEditScore = match.player1 && match.player2 && match.isComplete;
  const isBye = (match.player1 === null || match.player2 === null) && match.isComplete;
  const isClickable = (canEnterScore || canEditScore) && !isBye;
  const hasRunningTimer = match.timerStartedAt && gameTimerMinutes && !match.isComplete;
  const hasPausedTimer = !match.timerStartedAt && match.timerPausedRemaining !== null && gameTimerMinutes && !match.isComplete;

  return (
    <div
      className={`
        relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm
        rounded-xl border transition-all duration-300 min-w-[200px]
        ${match.isComplete ? "border-lime-400/50 shadow-lg shadow-lime-400/10" : "border-white/10"}
        ${isClickable ? "hover:border-lime-400 cursor-pointer hover:shadow-lg hover:shadow-lime-400/20" : ""}
        ${hasRunningTimer || hasPausedTimer ? "mt-5" : ""}
      `}
      onClick={() => isClickable && onScoreClick(match)}
    >
      {/* Timer display above the card */}
      {hasRunningTimer && (
        <MatchTimer timerStartedAt={match.timerStartedAt!} gameTimerMinutes={gameTimerMinutes} />
      )}
      
      {/* Paused timer indicator */}
      {hasPausedTimer && (
        <PausedTimerIndicator remainingSeconds={match.timerPausedRemaining!} />
      )}

      {/* Match header */}
      <div className="px-3 py-1.5 bg-white/5 rounded-t-xl border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-medium text-white/40">
          {match.isBronzeMatch ? "3rd Place" : `Round ${match.round}`}
        </span>
        {match.isComplete && !isBye && (
          <span className="text-xs font-bold text-lime-400 flex items-center gap-1">
            ✓ Complete
            <span className="text-white/40 font-normal">(click to edit)</span>
          </span>
        )}
        {isBye && (
          <span className="text-xs font-medium text-yellow-400">BYE</span>
        )}
        {canEnterScore && !hasRunningTimer && !hasPausedTimer && (
          <span className="text-xs font-medium text-lime-400 animate-pulse">Click to score</span>
        )}
        {hasRunningTimer && (
          <span className="text-xs font-medium text-lime-400">⏱ In Progress</span>
        )}
        {hasPausedTimer && (
          <span className="text-xs font-medium text-yellow-400">⏸ Paused</span>
        )}
      </div>

      {/* Players */}
      <div className="divide-y divide-white/10">
        {/* Player 1 */}
        <div
          className={`
            px-4 py-3 flex items-center justify-between
            ${match.winner?.id === match.player1?.id ? "bg-lime-400/10" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            {match.player1 ? (
              <>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${match.winner?.id === match.player1.id 
                    ? "bg-lime-400 text-emerald-900" 
                    : "bg-white/10 text-white/70"}
                `}>
                  {match.player1.name.charAt(0).toUpperCase()}
                </div>
                <span className={`font-medium ${match.winner?.id === match.player1.id ? "text-lime-400" : "text-white"}`}>
                  {match.player1.name}
                </span>
                {isByePlayer1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-medium">
                    BYE
                  </span>
                )}
              </>
            ) : (
              <span className="text-white/30 italic">TBD</span>
            )}
          </div>
          {match.score1 !== null && (
            <span className={`
              text-lg font-bold px-2 py-0.5 rounded
              ${match.winner?.id === match.player1?.id ? "text-lime-400 bg-lime-400/10" : "text-white/50"}
            `}>
              {match.score1}
            </span>
          )}
        </div>

        {/* Player 2 */}
        <div
          className={`
            px-4 py-3 flex items-center justify-between rounded-b-xl
            ${match.winner?.id === match.player2?.id ? "bg-lime-400/10" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            {match.player2 ? (
              <>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${match.winner?.id === match.player2.id 
                    ? "bg-lime-400 text-emerald-900" 
                    : "bg-white/10 text-white/70"}
                `}>
                  {match.player2.name.charAt(0).toUpperCase()}
                </div>
                <span className={`font-medium ${match.winner?.id === match.player2.id ? "text-lime-400" : "text-white"}`}>
                  {match.player2.name}
                </span>
                {isByePlayer2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-medium">
                    BYE
                  </span>
                )}
              </>
            ) : (
              <span className="text-white/30 italic">TBD</span>
            )}
          </div>
          {match.score2 !== null && (
            <span className={`
              text-lg font-bold px-2 py-0.5 rounded
              ${match.winner?.id === match.player2?.id ? "text-lime-400 bg-lime-400/10" : "text-white/50"}
            `}>
              {match.score2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// SVG Connector for bracket lines - connects matches between rounds
// Supports non-power-of-2 brackets with variable match counts per round
function BracketConnectorSVG({ 
  currentMatchCount,
  nextMatchCount,
  slotHeight,
  totalHeight
}: { 
  currentMatchCount: number;
  nextMatchCount: number;
  slotHeight: number;
  totalHeight: number;
}) {
  const connectorWidth = 40;
  
  // Calculate positions for current round matches
  const currentMatchPositions: number[] = [];
  for (let i = 0; i < currentMatchCount; i++) {
    const matchY = (i + 0.5) * (totalHeight / currentMatchCount);
    currentMatchPositions.push(matchY);
  }
  
  // Calculate positions for next round matches
  const nextMatchPositions: number[] = [];
  for (let i = 0; i < nextMatchCount; i++) {
    const matchY = (i + 0.5) * (totalHeight / nextMatchCount);
    nextMatchPositions.push(matchY);
  }
  
  // Create connections - pair current matches to next round
  const connections: { top: number; bottom: number; target: number }[] = [];
  
  for (let i = 0; i < nextMatchCount; i++) {
    const topMatchIdx = i * 2;
    const bottomMatchIdx = i * 2 + 1;
    
    if (topMatchIdx < currentMatchCount && bottomMatchIdx < currentMatchCount) {
      // Both matches exist - standard connection
      connections.push({
        top: currentMatchPositions[topMatchIdx],
        bottom: currentMatchPositions[bottomMatchIdx],
        target: nextMatchPositions[i]
      });
    } else if (topMatchIdx < currentMatchCount) {
      // Only top match exists (odd number case)
      connections.push({
        top: currentMatchPositions[topMatchIdx],
        bottom: currentMatchPositions[topMatchIdx], // Same as top - single line
        target: nextMatchPositions[i]
      });
    }
  }
  
  return (
    <svg 
      width={connectorWidth} 
      height={totalHeight} 
      className="flex-shrink-0"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(163, 230, 53, 0.6)" />
          <stop offset="100%" stopColor="rgba(163, 230, 53, 0.3)" />
        </linearGradient>
      </defs>
      {connections.map((conn, i) => {
        const midY = (conn.top + conn.bottom) / 2;
        const isSingleMatch = conn.top === conn.bottom;
        
        return (
          <g key={i}>
            {/* Line from top match to vertical bar */}
            <line 
              x1="0" 
              y1={conn.top} 
              x2={connectorWidth / 2} 
              y2={conn.top}
              stroke="url(#lineGradient)"
              strokeWidth="2"
            />
            {!isSingleMatch && (
              <>
                {/* Line from bottom match to vertical bar */}
                <line 
                  x1="0" 
                  y1={conn.bottom} 
                  x2={connectorWidth / 2} 
                  y2={conn.bottom}
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                />
                {/* Vertical connecting bar */}
                <line 
                  x1={connectorWidth / 2} 
                  y1={conn.top} 
                  x2={connectorWidth / 2} 
                  y2={conn.bottom}
                  stroke="rgba(163, 230, 53, 0.5)"
                  strokeWidth="2"
                />
              </>
            )}
            {/* Line to next round match */}
            <line 
              x1={connectorWidth / 2} 
              y1={midY} 
              x2={connectorWidth} 
              y2={conn.target}
              stroke="url(#lineGradient)"
              strokeWidth="2"
            />
            {/* Glowing dot at connection point */}
            <circle 
              cx={connectorWidth / 2} 
              cy={midY} 
              r="3"
              fill="rgba(163, 230, 53, 0.8)"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function Bracket() {
  const { tournament } = useTournament();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (!tournament || !tournament.isStarted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">🏆</div>
        <p className="text-white/50 text-lg">No bracket generated yet</p>
        <p className="text-white/30 text-sm mt-2">Add players and generate a bracket to start</p>
      </div>
    );
  }

  // Group matches by round - filter out any BYE matches (where one player is null and match is complete)
  // Also separate bronze matches from regular final round matches
  const matchesByRound: { [key: number]: Match[] } = {};
  const bronzeMatches: Match[] = [];
  
  tournament.matches.forEach((match) => {
    // Skip BYE matches - they have one null player and are already complete
    const isByeMatch = (match.player1 === null || match.player2 === null) && match.isComplete;
    if (isByeMatch) return;
    
    // Separate bronze matches
    if (match.isBronzeMatch) {
      bronzeMatches.push(match);
      return;
    }
    
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  // Check if this is a 6-player playoff bracket (has bronze match)
  const hasBronzeMatch = tournament.matches.some(m => m.isBronzeMatch);
  const bronzeMatch = tournament.matches.find(m => m.isBronzeMatch);

  const roundNames = (round: number, totalRounds: number, matchCount: number, isBronze: boolean = false) => {
    if (isBronze) return "🥉 BRONZE MATCH";
    if (round === totalRounds && !isBronze) return "🏆 CHAMPIONSHIP";
    if (round === totalRounds - 1 && hasBronzeMatch) return "SEMIFINALS";
    if (matchCount === 2) return "SEMIFINALS";
    if (matchCount === 4) return "QUARTERFINALS";
    if (hasBronzeMatch && round === 1) return "QUARTERFINALS"; // 6-player bracket
    return `ROUND ${round}`;
  };

  const rounds = Object.entries(matchesByRound).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  
  // Find the first round to determine base height
  const firstRoundMatches = rounds[0]?.[1]?.length || 1;
  // Each match slot height - card is ~110px tall, plus gap for comfortable spacing
  const matchSlotHeight = 170; // Increased from 140 for more spacing between cards
  const baseHeight = Math.max(firstRoundMatches * matchSlotHeight, 400);
  
  // Calculate which players got a bye (appear in a round without winning in previous round)
  // A bye player is someone who appears in round N but didn't win any match in round N-1
  const getByePlayers = (roundNum: number): Set<string> => {
    if (roundNum <= 1) return new Set(); // No byes possible in round 1
    
    const byePlayers = new Set<string>();
    const currentRoundMatches = matchesByRound[roundNum] || [];
    const prevRoundMatches = matchesByRound[roundNum - 1] || [];
    
    // Get all winners from previous round
    const prevRoundWinners = new Set<string>();
    prevRoundMatches.forEach(m => {
      if (m.winner?.id) prevRoundWinners.add(m.winner.id);
    });
    
    // Check each player in current round - if they weren't a winner in prev round, they got a bye
    currentRoundMatches.forEach(m => {
      if (m.player1?.id && !prevRoundWinners.has(m.player1.id)) {
        // Check if they won any earlier round (skip-round bye)
        const wonAnyPrevRound = tournament.matches.some(
          pm => pm.round < roundNum && pm.winner?.id === m.player1?.id
        );
        // Only mark as bye if they won a round but skipped the immediate previous round
        // OR if they never played before (from round 1 bye)
        const round1Player = tournament.matches.some(
          pm => pm.round === 1 && (pm.player1?.id === m.player1?.id || pm.player2?.id === m.player1?.id)
        );
        if (!round1Player || wonAnyPrevRound) {
          byePlayers.add(m.player1.id);
        }
      }
      if (m.player2?.id && !prevRoundWinners.has(m.player2.id)) {
        const wonAnyPrevRound = tournament.matches.some(
          pm => pm.round < roundNum && pm.winner?.id === m.player2?.id
        );
        const round1Player = tournament.matches.some(
          pm => pm.round === 1 && (pm.player1?.id === m.player2?.id || pm.player2?.id === m.player2?.id)
        );
        if (!round1Player || wonAnyPrevRound) {
          byePlayers.add(m.player2.id);
        }
      }
    });
    
    return byePlayers;
  };

  return (
    <>
      <div className="w-full overflow-x-auto pb-8">
        <div className="flex items-stretch min-w-max px-4">
          {rounds.map(([round, matches], roundIndex) => {
            const roundNum = parseInt(round);
            const isLastRound = roundIndex === rounds.length - 1;
            const nextRoundMatches = !isLastRound ? rounds[roundIndex + 1]?.[1]?.length || 0 : 0;
            
            // Calculate slot height based on how matches need to be distributed in the total height
            const slotHeight = baseHeight / matches.length;
            
            // Get bye players for this round
            const byePlayers = getByePlayers(roundNum);
            
            return (
              <div key={round} className="flex items-stretch">
                {/* Round column */}
                <div className="flex flex-col min-w-[220px]">
                  <h3 className="text-center text-white/60 font-semibold text-sm uppercase tracking-wider mb-4 h-6">
                    {roundNames(roundNum, tournament.rounds, matches.length)}
                  </h3>
                  <div 
                    className="flex flex-col justify-around"
                    style={{ height: `${baseHeight}px` }}
                  >
                    {matches.map((match) => (
                      <div 
                        key={match.id}
                        className="flex items-center justify-center"
                        style={{ height: `${slotHeight}px` }}
                      >
                        <MatchCard
                          match={match}
                          onScoreClick={setSelectedMatch}
                          gameTimerMinutes={tournament.settings.gameTimerMinutes}
                          isByePlayer1={match.player1?.id ? byePlayers.has(match.player1.id) : false}
                          isByePlayer2={match.player2?.id ? byePlayers.has(match.player2.id) : false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Connector lines to next round */}
                {!isLastRound && matches.length >= 1 && nextRoundMatches > 0 && (
                  <div className="flex items-center" style={{ height: `${baseHeight}px`, paddingTop: '40px' }}>
                    <BracketConnectorSVG 
                      currentMatchCount={matches.length}
                      nextMatchCount={nextRoundMatches}
                      slotHeight={slotHeight}
                      totalHeight={baseHeight}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Bronze Match Section - displayed below if present */}
        {bronzeMatches.length > 0 && (
          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center">
              <h3 className="text-center text-orange-400 font-semibold text-sm uppercase tracking-wider mb-4">
                🥉 3RD PLACE MATCH
              </h3>
              <p className="text-white/40 text-xs mb-4">Semifinal losers compete for bronze</p>
              {bronzeMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onScoreClick={setSelectedMatch}
                  gameTimerMinutes={tournament.settings.gameTimerMinutes}
                  isByePlayer1={false}
                  isByePlayer2={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMatch && (
        <ScoreEntry
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </>
  );
}

