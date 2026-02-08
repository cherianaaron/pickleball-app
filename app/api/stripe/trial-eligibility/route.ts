import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client that can read the auth cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
        },
      }
    );

    // Get the current user from the session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in - assume eligible for trial
      return NextResponse.json({ eligible: true, reason: null });
    }

    // Check subscription record
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id, trial_end, status, tier")
      .eq("user_id", user.id)
      .maybeSingle();

    // If user has a trial_end date, they've had a trial
    if (subscription?.trial_end) {
      return NextResponse.json({ 
        eligible: false, 
        reason: "You have already used your free trial." 
      });
    }

    // Check Stripe subscription history if customer exists
    if (subscription?.stripe_customer_id) {
      try {
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: subscription.stripe_customer_id,
          status: "all",
          limit: 100,
        });

        for (const sub of stripeSubscriptions.data) {
          if (sub.trial_end || sub.trial_start) {
            return NextResponse.json({ 
              eligible: false, 
              reason: "You have already used your free trial." 
            });
          }
        }
      } catch (stripeError) {
        console.error("Error checking Stripe history:", stripeError);
      }
    }

    // User is eligible for a trial
    return NextResponse.json({ eligible: true, reason: null });
  } catch (error) {
    console.error("Trial eligibility check error:", error);
    // Default to eligible on error to not block legitimate users
    return NextResponse.json({ eligible: true, reason: null });
  }
}
