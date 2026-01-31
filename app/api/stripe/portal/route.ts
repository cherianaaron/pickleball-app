import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

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

    if (authError) {
      console.error("Auth error:", authError);
    }

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user's Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let stripeCustomerId = subscription?.stripe_customer_id;

    // If no customer ID in database, try to find by email in Stripe
    if (!stripeCustomerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        
        // Update database with the found customer ID
        if (subscription) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("user_id", userId);
        } else {
          await supabaseAdmin
            .from("user_subscriptions")
            .insert({
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
              tier: "free",
              status: "active",
            });
        }
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: "No Stripe customer found. Please subscribe first." },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://picklebracket.app"}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { message: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
