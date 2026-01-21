import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get user from the session cookie
    let userId: string | null = null;

    const cookieValue = request.cookies.get("sb-oqgcbykzdlupfzktijex-auth-token")?.value;
    if (cookieValue) {
      try {
        const decoded = JSON.parse(Buffer.from(cookieValue.replace(/^base64-/, ""), "base64").toString());
        if (decoded?.user?.id) {
          userId = decoded.user.id;
        }
      } catch (e) {
        console.error("Error decoding auth cookie:", e);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { message: "No subscription found" },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
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
