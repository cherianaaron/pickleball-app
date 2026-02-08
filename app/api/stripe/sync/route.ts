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
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // If no subscription record exists, we need to check if there's a Stripe customer
    // for this user by searching Stripe by email
    let stripeCustomerId = subRecord?.stripe_customer_id;
    
    if (!stripeCustomerId) {
      // Try to find customer in Stripe by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        
        // Create subscription record if it doesn't exist
        if (!subRecord) {
          const { error: insertError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              stripe_customer_id: stripeCustomerId,
              tier: "free",
              status: "active",
            });
          
          if (insertError) {
            console.error("Error creating subscription record:", insertError);
          }
        } else {
          // Update existing record with customer ID
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("user_id", user.id);
        }
      } else {
        return NextResponse.json({ synced: false, message: "No Stripe customer found" });
      }
    }

    // Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, ensure user is on free tier
      // NOTE: We intentionally do NOT reset trial_end to null here
      // This preserves trial history to prevent users from getting multiple trials
      await supabaseAdmin
        .from("user_subscriptions")
        .update({
          tier: "free",
          status: "active",
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
          // trial_end is intentionally NOT reset - preserves trial history
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

    // Log the raw subscription data for debugging
    console.log("Subscription raw data:", {
      current_period_start: subData.current_period_start,
      current_period_end: subData.current_period_end,
      trial_end: subData.trial_end,
      // Also check if they exist directly on subscription
      sub_current_period_start: (subscription as any).current_period_start,
      sub_current_period_end: (subscription as any).current_period_end,
    });

    // For trials, if current_period is missing, use trial dates
    // trial_start might be the subscription's start_date or created timestamp
    const periodStart = subData.current_period_start || (subscription as any).start_date || (subscription as any).created;
    const periodEnd = subData.current_period_end || subData.trial_end;

    console.log("Using period values:", { periodStart, periodEnd });

    // Update the database
    const { error: updateError } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        tier: tier,
        status: status,
        billing_interval: interval,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : null,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        trial_end: subData.trial_end
          ? new Date(subData.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subData.cancel_at_period_end || false,
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
