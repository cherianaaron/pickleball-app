import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all tournaments
    const { data: tournaments, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, name, is_started, created_at")
      .order("created_at", { ascending: false });

    if (tournamentError) {
      return NextResponse.json({
        success: false,
        error: "Tournament query failed",
        details: tournamentError.message,
      }, { status: 500 });
    }

    // Get all players with their tournament_id
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, name, tournament_id")
      .order("created_at", { ascending: false });

    if (playersError) {
      return NextResponse.json({
        success: false,
        error: "Players query failed", 
        details: playersError.message,
      }, { status: 500 });
    }

    // Analyze the data
    const mostRecentTournament = tournaments?.[0];
    const playersInMostRecent = players?.filter(p => p.tournament_id === mostRecentTournament?.id) || [];
    const playersInOtherTournaments = players?.filter(p => p.tournament_id !== mostRecentTournament?.id) || [];

    // Group players by tournament
    const playersByTournament: Record<string, string[]> = {};
    players?.forEach(p => {
      if (!playersByTournament[p.tournament_id]) {
        playersByTournament[p.tournament_id] = [];
      }
      playersByTournament[p.tournament_id].push(p.name);
    });

    return NextResponse.json({
      diagnosis: {
        totalTournaments: tournaments?.length || 0,
        totalPlayers: players?.length || 0,
        mostRecentTournamentId: mostRecentTournament?.id,
        mostRecentTournamentName: mostRecentTournament?.name,
        playersInMostRecentTournament: playersInMostRecent.length,
        playersInOtherTournaments: playersInOtherTournaments.length,
        problem: playersInOtherTournaments.length > 0 && playersInMostRecent.length === 0
          ? "⚠️ FOUND THE ISSUE: Players exist but are linked to older tournaments, not the most recent one!"
          : playersInMostRecent.length > 0 
            ? "✅ Players are correctly linked to the most recent tournament"
            : "ℹ️ No players in database",
      },
      tournaments: tournaments?.map(t => ({
        id: t.id,
        name: t.name,
        isStarted: t.is_started,
        createdAt: t.created_at,
        playerCount: playersByTournament[t.id]?.length || 0,
        players: playersByTournament[t.id] || [],
      })),
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
