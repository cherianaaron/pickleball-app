"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

interface Collaborator {
  id: string;
  user_email: string;
  user_name: string;
  joined_at: string;
}

interface ShareTournamentProps {
  tournamentId: string;
  tournamentType: "bracket" | "round-robin";
  isOwner: boolean;
  onClose: () => void;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded I, O, 0, 1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function ShareTournament({ tournamentId, tournamentType, isOwner, onClose }: ShareTournamentProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const tableName = tournamentType === "bracket" ? "tournaments" : "round_robin_tournaments";
  const collabTableName = tournamentType === "bracket" ? "tournament_collaborators" : "round_robin_collaborators";

  useEffect(() => {
    loadShareData();
  }, [tournamentId]);

  const loadShareData = async () => {
    setLoading(true);
    try {
      // Get invite code
      const { data: tournament, error: tournamentError } = await supabase
        .from(tableName)
        .select("invite_code")
        .eq("id", tournamentId)
        .maybeSingle();

      if (tournamentError) {
        console.error("Error loading tournament for share:", tournamentError);
      }

      setInviteCode(tournament?.invite_code || null);

      // Get collaborators
      const { data: collabs, error: collabsError } = await supabase
        .from(collabTableName)
        .select("id, user_email, user_name, joined_at")
        .eq("tournament_id", tournamentId)
        .order("joined_at", { ascending: true });

      if (collabsError) {
        console.error("Error loading collaborators:", collabsError);
      }

      setCollaborators(collabs || []);
    } catch (err) {
      console.error("Error loading share data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!isOwner) return;
    setGenerating(true);

    try {
      const newCode = generateInviteCode();
      const { error } = await supabase
        .from(tableName)
        .update({ invite_code: newCode, allow_collaborators: true })
        .eq("id", tournamentId);

      if (error) {
        console.error("Error updating invite code:", error);
        alert(`Failed to generate code: ${error.message}`);
        return;
      }
      setInviteCode(newCode);
    } catch (err) {
      console.error("Error generating invite code:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join?code=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="glass rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-orange-400/30">
              <span className="text-2xl">🤝</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Share Tournament</h2>
              <p className="text-white/50 text-sm">Invite others to collaborate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invite Code Section */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-3">
                Invite Code
              </label>
              {inviteCode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="text-2xl font-mono font-bold text-lime-400 tracking-widest">
                        {inviteCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        copied
                          ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      {copied ? "✓" : "📋"}
                    </button>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm transition-all"
                  >
                    📎 Copy Join Link
                  </button>
                </div>
              ) : isOwner ? (
                <button
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="w-full px-6 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "🔗 Generate Invite Code"}
                </button>
              ) : (
                <p className="text-white/40 text-sm text-center py-4">
                  Only the tournament owner can generate invite codes
                </p>
              )}
            </div>

            {/* Collaborators Section */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-3">
                Collaborators ({collaborators.length})
              </label>
              {collaborators.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400/20 to-emerald-400/20 flex items-center justify-center border border-lime-400/30">
                        <span className="text-lg">
                          {collab.user_name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {collab.user_name || "Anonymous"}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          {collab.user_email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm text-center py-4 bg-white/5 rounded-xl border border-white/10">
                  No collaborators yet. Share the invite code to get started!
                </p>
              )}
            </div>

            {/* How it works */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs text-center">
                Collaborators can view the tournament and enter scores in real-time
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

