import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's subscription record to find Stripe customer ID
    const { data: subRecord } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!subRecord?.stripe_customer_id) {
      return NextResponse.json({ synced: false, message: "No Stripe customer found" });
    }

    // Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: subRecord.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, ensure user is on free tier
      await supabaseAdmin
        .from("user_subscriptions")
        .update({
          tier: "free",
          status: "active",
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
          trial_end: null,
          cancel_at_period_end: false,
          billing_interval: null,
        })
        .eq("user_id", user.id);

      return NextResponse.json({ synced: true, tier: "free" });
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];

    // Determine tier from metadata or price
    let tier = subscription.metadata?.tier;
    if (!tier) {
      // Try to determine from price
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId?.includes("club")) {
        tier = "club";
      } else if (priceId?.includes("league")) {
        tier = "league";
      } else {
        // Check price metadata
        tier = subscription.items.data[0]?.price.metadata?.tier || "club";
      }
    }

    // Determine status
    let status: string;
    if (subscription.status === "trialing") {
      status = "trialing";
    } else if (subscription.status === "active") {
      status = "active";
    } else if (subscription.status === "past_due") {
      status = "past_due";
    } else if (subscription.status === "canceled") {
      status = "cancelled";
    } else {
      status = "inactive";
    }

    // Get billing interval
    const interval = subscription.items.data[0]?.price.recurring?.interval || "month";

    // Update the database
    await supabaseAdmin
      .from("user_subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        tier: tier,
        status: status,
        billing_interval: interval,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq("user_id", user.id);

    return NextResponse.json({ 
      synced: true, 
      tier, 
      status,
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null 
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { message: "Failed to sync subscription" },
      { status: 500 }
    );
  }
}
