import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/app/lib/stripe";
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

    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || 
      request.cookies.get("sb-access-token")?.value;

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      request.cookies.get("sb-oqgcbykzdlupfzktijex-auth-token")?.value?.replace(/^base64-/, "") || ""
    );

    // Try alternative method to get user
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (user) {
      userId = user.id;
      userEmail = user.email || null;
    } else {
      // Try to get user from the session cookie directly
      const cookieValue = request.cookies.get("sb-oqgcbykzdlupfzktijex-auth-token")?.value;
      if (cookieValue) {
        try {
          const decoded = JSON.parse(Buffer.from(cookieValue.replace(/^base64-/, ""), "base64").toString());
          if (decoded?.user?.id) {
            userId = decoded.user.id;
            userEmail = decoded.user.email;
          }
        } catch (e) {
          console.error("Error decoding auth cookie:", e);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
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

    // Create Stripe Checkout session with 7-day trial
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
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: userId,
          tier: tier,
        },
      },
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
