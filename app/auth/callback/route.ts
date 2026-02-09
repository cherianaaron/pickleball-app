import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Admin client for creating subscription records (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Ensure user has a subscription record (creates one if it doesn't exist)
        const { data: existingSubscription } = await supabaseAdmin
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingSubscription) {
          // Create a free tier subscription record for the new user
          await supabaseAdmin
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              tier: "free",
              status: "active",
              is_admin: false,
            });
          console.log("Created subscription record for new user:", user.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

