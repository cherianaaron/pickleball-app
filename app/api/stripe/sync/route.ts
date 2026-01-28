import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Check for required env vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { message: "Server configuration error", error: "Missing service role key" },
        { status: 500 }
      );
    }

    // Create a Supabase client with service role for server-side operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
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

    // Get the most recent active/trialing subscription
    const activeSubscription = subscriptions.data.find(
      s => s.status === "active" || s.status === "trialing"
    );
    const subscription = activeSubscription || subscriptions.data[0];

    console.log("Found subscription:", {
      id: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata,
      priceId: subscription.items.data[0]?.price.id,
    });

    // Determine tier from metadata or price
    let tier = subscription.metadata?.tier as string | undefined;
    if (!tier) {
      // Try to determine from price ID
      const priceId = (subscription.items.data[0]?.price.id || "").toLowerCase();
      const priceMetadata = subscription.items.data[0]?.price.metadata as Record<string, string> | undefined;
      
      if (priceId.includes("club")) {
        tier = "club";
      } else if (priceId.includes("league")) {
        tier = "league";
      } else if (priceMetadata?.tier) {
        tier = priceMetadata.tier;
      } else {
        // Last resort: check by price amount (in cents)
        const amount = subscription.items.data[0]?.price.unit_amount || 0;
        console.log("Price amount:", amount);
        // Club: $5/mo = 500 cents, $48/yr = 4800 cents
        // League: $10/mo = 1000 cents, $96/yr = 9600 cents
        if (amount <= 500 || amount === 4800) {
          tier = "club";
        } else {
          tier = "league";
        }
      }
    }
    
    console.log("Determined tier:", tier);

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

    // Cast subscription to access properties (Stripe API version compatibility)
    const subData = subscription as unknown as {
      current_period_start: number;
      current_period_end: number;
      trial_end: number | null;
      cancel_at_period_end: boolean;
    };

    // Update the database
    const { error: updateError } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        tier: tier,
        status: status,
        billing_interval: interval,
        current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
        trial_end: subData.trial_end
          ? new Date(subData.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subData.cancel_at_period_end,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { message: "Failed to update database", error: updateError.message },
        { status: 500 }
      );
    }

    console.log("Successfully updated subscription for user:", user.id);

    return NextResponse.json({ 
      synced: true, 
      tier, 
      status,
      trial_end: subData.trial_end 
        ? new Date(subData.trial_end * 1000).toISOString() 
        : null 
    });
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to sync subscription", error: errorMessage },
      { status: 500 }
    );
  }
}
