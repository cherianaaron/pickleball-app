"use client";

import { useState } from "react";
import { useTournament } from "../context/TournamentContext";

interface PlayerFormProps {
  disabled?: boolean;
  onLimitReached?: () => void;
}

export default function PlayerForm({ disabled = false, onLimitReached }: PlayerFormProps) {
  const [name, setName] = useState("");
  const { addPlayer, tournament } = useTournament();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If disabled due to limit, show upgrade prompt
    if (disabled && onLimitReached) {
      onLimitReached();
      return;
    }
    
    if (name.trim()) {
      addPlayer(name);
      setName("");
    }
  };

  const isDisabled = tournament?.isStarted || disabled;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tournament?.isStarted ? "Tournament started" : disabled ? "Player limit reached" : "Enter player name..."}
            disabled={isDisabled}
            className={`
              w-full px-5 py-4 rounded-2xl text-lg font-medium
              bg-white/10 backdrop-blur-sm border-2 border-white/20
              text-white placeholder-white/40
              focus:outline-none focus:border-lime-400 focus:bg-white/15
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
            👤
          </div>
        </div>
        <button
          type="submit"
          disabled={isDisabled || !name.trim()}
          className={`
            px-8 py-4 rounded-2xl text-lg font-bold
            bg-gradient-to-r from-lime-400 to-yellow-300
            text-emerald-900 shadow-lg shadow-lime-400/30
            hover:shadow-lime-400/50 hover:scale-105
            active:scale-95 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          Add Player
        </button>
      </div>
    </form>
  );
}

