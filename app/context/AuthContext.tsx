"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase-browser";
import posthog from "posthog-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Identify user in PostHog on OAuth sign-in (e.g., Google)
        if (event === "SIGNED_IN" && session?.user) {
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
          });
          // Only capture if this is an OAuth sign-in (provider is not email)
          if (session.user.app_metadata?.provider !== "email") {
            posthog.capture("user_signed_in", {
              method: session.user.app_metadata?.provider || "oauth",
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      posthog.capture("user_sign_in_failed", {
        method: "email",
        error_message: error.message,
      });
      return { error: error.message };
    }

    // Identify user in PostHog
    if (data.user) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        created_at: data.user.created_at,
      });
      posthog.capture("user_signed_in", {
        method: "email",
      });
    }

    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      posthog.capture("user_sign_up_failed", {
        error_message: error.message,
      });
      return { error: error.message, needsConfirmation: false };
    }

    // Check if email confirmation is needed
    // If identities array is empty, email confirmation is required
    const needsConfirmation = !data.user?.identities?.length ||
      data.user?.identities?.length === 0 ||
      !data.session;

    // Track sign up event
    if (data.user) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        created_at: data.user.created_at,
      });
      posthog.capture("user_signed_up", {
        needs_confirmation: needsConfirmation,
      });
    }

    return { error: null, needsConfirmation };
  };

  const signOut = async () => {
    // Capture sign out event before resetting
    posthog.capture("user_signed_out");
    posthog.reset();

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

