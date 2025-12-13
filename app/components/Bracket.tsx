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

function MatchCard({ match, onScoreClick, gameTimerMinutes }: { match: Match; onScoreClick: (match: Match) => void; gameTimerMinutes: number | null }) {
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
          {match.round === 1 ? "Round 1" : match.round === 2 ? "Semifinals" : "Finals"}
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
function BracketConnectorSVG({ 
  matchCount, 
  slotHeight 
}: { 
  matchCount: number; 
  slotHeight: number;
}) {
  const connectorWidth = 40;
  const totalHeight = matchCount * slotHeight;
  const connectorCount = Math.floor(matchCount / 2);
  
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
      {Array.from({ length: connectorCount }).map((_, i) => {
        // Top match center Y
        const topMatchY = (i * 2) * slotHeight + slotHeight / 2;
        // Bottom match center Y  
        const bottomMatchY = (i * 2 + 1) * slotHeight + slotHeight / 2;
        // Middle point (where they connect)
        const midY = (topMatchY + bottomMatchY) / 2;
        
        return (
          <g key={i}>
            {/* Line from top match to vertical bar */}
            <line 
              x1="0" 
              y1={topMatchY} 
              x2={connectorWidth / 2} 
              y2={topMatchY}
              stroke="url(#lineGradient)"
              strokeWidth="2"
            />
            {/* Line from bottom match to vertical bar */}
            <line 
              x1="0" 
              y1={bottomMatchY} 
              x2={connectorWidth / 2} 
              y2={bottomMatchY}
              stroke="url(#lineGradient)"
              strokeWidth="2"
            />
            {/* Vertical connecting bar */}
            <line 
              x1={connectorWidth / 2} 
              y1={topMatchY} 
              x2={connectorWidth / 2} 
              y2={bottomMatchY}
              stroke="rgba(163, 230, 53, 0.5)"
              strokeWidth="2"
            />
            {/* Line to next round match */}
            <line 
              x1={connectorWidth / 2} 
              y1={midY} 
              x2={connectorWidth} 
              y2={midY}
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

  // Group matches by round
  const matchesByRound: { [key: number]: Match[] } = {};
  tournament.matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  const roundNames = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "🏆 FINALS";
    if (round === totalRounds - 1) return "SEMIFINALS";
    if (round === totalRounds - 2) return "QUARTERFINALS";
    return `ROUND ${round}`;
  };

  const rounds = Object.entries(matchesByRound).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  
  // Find the first round to determine base height
  const firstRoundMatches = matchesByRound[1]?.length || rounds[0]?.[1]?.length || 1;
  // Each match slot height - card is ~110px tall, plus 50px gap for comfortable spacing
  const matchSlotHeight = 160;
  const baseHeight = firstRoundMatches * matchSlotHeight;

  return (
    <>
      <div className="w-full overflow-x-auto pb-8">
        <div className="flex items-stretch min-w-max px-4">
          {rounds.map(([round, matches], roundIndex) => {
            const roundNum = parseInt(round);
            const isLastRound = roundIndex === rounds.length - 1;
            // Each round's slot height doubles to center between previous round's matches
            const slotHeight = matchSlotHeight * Math.pow(2, roundIndex);
            
            return (
              <div key={round} className="flex items-stretch">
                {/* Round column */}
                <div className="flex flex-col min-w-[220px]">
                  <h3 className="text-center text-white/60 font-semibold text-sm uppercase tracking-wider mb-4 h-6">
                    {roundNames(roundNum, tournament.rounds)}
                  </h3>
                  <div 
                    className="flex flex-col justify-around"
                    style={{ minHeight: `${baseHeight}px` }}
                  >
                    {matches.map((match) => (
                      <div 
                        key={match.id}
                        className="flex items-center justify-center py-2"
                        style={{ minHeight: `${slotHeight}px` }}
                      >
                        <MatchCard
                          match={match}
                          onScoreClick={setSelectedMatch}
                          gameTimerMinutes={tournament.settings.gameTimerMinutes}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Connector lines to next round */}
                {!isLastRound && matches.length >= 1 && (
                  <div className="flex flex-col justify-around" style={{ minHeight: `${baseHeight}px`, paddingTop: '40px' }}>
                    <BracketConnectorSVG 
                      matchCount={matches.length} 
                      slotHeight={slotHeight}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

