"use client";

import { useState } from "react";
import { useTournament, Match } from "../context/TournamentContext";
import ScoreEntry from "./ScoreEntry";

function MatchCard({ match, onScoreClick }: { match: Match; onScoreClick: (match: Match) => void }) {
  const canEnterScore = match.player1 && match.player2 && !match.isComplete;
  const isBye = (match.player1 === null || match.player2 === null) && match.isComplete;

  return (
    <div
      className={`
        relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm
        rounded-xl border transition-all duration-300 min-w-[200px]
        ${match.isComplete ? "border-lime-400/50 shadow-lg shadow-lime-400/10" : "border-white/10"}
        ${canEnterScore ? "hover:border-lime-400 cursor-pointer hover:shadow-lg hover:shadow-lime-400/20" : ""}
      `}
      onClick={() => canEnterScore && onScoreClick(match)}
    >
      {/* Match header */}
      <div className="px-3 py-1.5 bg-white/5 rounded-t-xl border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-medium text-white/40">
          {match.round === 1 ? "Round 1" : match.round === 2 ? "Semifinals" : "Finals"}
        </span>
        {match.isComplete && !isBye && (
          <span className="text-xs font-bold text-lime-400">✓ Complete</span>
        )}
        {isBye && (
          <span className="text-xs font-medium text-yellow-400">BYE</span>
        )}
        {canEnterScore && (
          <span className="text-xs font-medium text-lime-400 animate-pulse">Click to score</span>
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

