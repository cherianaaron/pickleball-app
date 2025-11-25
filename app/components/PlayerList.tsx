"use client";

import { useTournament } from "../context/TournamentContext";

export default function PlayerList() {
  const { tournament, removePlayer } = useTournament();

  if (!tournament || tournament.players.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">🎾</div>
        <p className="text-white/50 text-lg">No players added yet</p>
        <p className="text-white/30 text-sm mt-2">Add at least 2 players to start a tournament</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tournament.players.map((player, index) => (
        <div
          key={player.id}
          className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-lime-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-lime-400/10"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
              <span className="text-xl font-bold text-lime-400">
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">{player.name}</h3>
              <p className="text-white/40 text-sm">Seed #{player.seed}</p>
            </div>
            {!tournament.isStarted && (
              <button
                onClick={() => removePlayer(player.id)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all duration-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

