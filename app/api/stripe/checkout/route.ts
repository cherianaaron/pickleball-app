import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/app/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { tier, interval } = await request.json();

    // Validate tier and interval
    if (!["club", "league"].includes(tier)) {
      return NextResponse.json(
        { message: "Invalid tier" },
        { status: 400 }
      );
    }
    if (!["month", "year"].includes(interval)) {
      return NextResponse.json(
        { message: "Invalid interval" },
        { status: 400 }
      );
    }

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

    if (authError) {
      console.error("Auth error:", authError);
    }

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (user) {
      userId = user.id;
      userEmail = user.email || null;
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    // Check if user already has a Stripe customer ID and trial history
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id, trial_end, status")
      .eq("user_id", userId)
      .maybeSingle();

    // Check if user has ever used a trial (trial_end being set means they had a trial)
    let hasUsedTrial = false;
    
    if (subscription?.trial_end) {
      // User has a trial_end date, meaning they've had a trial before
      hasUsedTrial = true;
    }

    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
      
      // Double-check with Stripe for any past subscriptions with trials
      if (!hasUsedTrial) {
        try {
          const stripeSubscriptions = await stripe.subscriptions.list({
            customer: subscription.stripe_customer_id,
            status: "all", // Include cancelled, past_due, etc.
            limit: 100,
          });
          
          // Check if any subscription ever had a trial
          for (const sub of stripeSubscriptions.data) {
            if (sub.trial_end || sub.trial_start) {
              hasUsedTrial = true;
              break;
            }
          }
        } catch (stripeError) {
          console.error("Error checking Stripe subscription history:", stripeError);
        }
      }
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: {
          user_id: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to database
      await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          tier: "free",
          status: "active",
        });
    }

    // Get the price ID
    const priceId = interval === "month"
      ? STRIPE_PRICES[tier as "club" | "league"].monthly
      : STRIPE_PRICES[tier as "club" | "league"].yearly;

    if (!priceId) {
      return NextResponse.json(
        { message: "Price not configured. Please set up Stripe prices." },
        { status: 500 }
      );
    }

    // Ensure we have a valid customer ID
    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: "Failed to create customer" },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    // Only include trial if user has never used one before
    const subscriptionData: {
      metadata: { user_id: string; tier: string };
      trial_period_days?: number;
    } = {
      metadata: {
        user_id: userId,
        tier: tier,
      },
    };

    // Only add trial for users who haven't used one before
    if (!hasUsedTrial) {
      subscriptionData.trial_period_days = 7;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://picklebracket.app"}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://picklebracket.app"}/pricing?cancelled=true`,
      metadata: {
        user_id: userId,
        tier: tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
