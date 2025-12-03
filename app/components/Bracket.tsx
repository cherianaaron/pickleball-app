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
    if (round === totalRounds) return "🏆 Finals";
    if (round === totalRounds - 1) return "Semifinals";
    if (round === totalRounds - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  return (
    <>
      <div className="w-full overflow-x-auto pb-8">
        <div className="flex gap-8 min-w-max px-4">
          {Object.entries(matchesByRound).map(([round, matches]) => (
            <div key={round} className="flex flex-col gap-4">
              <h3 className="text-center text-white/60 font-semibold text-sm uppercase tracking-wider mb-2">
                {roundNames(parseInt(round), tournament.rounds)}
              </h3>
              <div 
                className="flex flex-col justify-around gap-4"
                style={{ 
                  minHeight: `${matches.length * 120}px`,
                }}
              >
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onScoreClick={setSelectedMatch}
                    gameTimerMinutes={tournament.settings.gameTimerMinutes}
                  />
                ))}
              </div>
            </div>
          ))}
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

