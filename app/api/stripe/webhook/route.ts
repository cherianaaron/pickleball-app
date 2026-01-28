import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getPostHogClient } from "@/app/lib/posthog-server";

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing for webhook
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { message: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Update user subscription
  await supabaseAdmin
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      tier: tier,
      status: "trialing", // 7-day trial
      trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  // Track checkout completion in PostHog
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: userId,
    event: "checkout_completed",
    properties: {
      tier,
      stripe_customer_id: session.customer as string,
      amount_total: session.amount_total,
      currency: session.currency,
    },
  });

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    console.log("Processing subscription update for customer:", customerId);

    // Get user ID from customer metadata
    const customer = await stripe.customers.retrieve(customerId);
    let userId = (customer as Stripe.Customer).metadata?.user_id;

    if (!userId) {
      // Try to find user by customer ID in our database
      const { data: existingSub, error: findError } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (findError || !existingSub) {
        console.error("Could not find user for customer:", customerId, findError);
        return;
      }
      userId = existingSub.user_id;
    }

    console.log("Found user:", userId);

    // Determine tier from metadata or default
    const tier = subscription.metadata?.tier || 
      (subscription.items.data[0]?.price.metadata?.tier as string) ||
      "club"; // Default to club if not specified
    
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

  // Access subscription properties (cast to any for older API compatibility)
  const subData = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    trial_end: number | null;
    cancel_at_period_end: boolean;
  };

  const { error: updateError } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      tier: tier,
      status: status,
      billing_interval: interval,
      current_period_start: subData.current_period_start 
        ? new Date(subData.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subData.current_period_end
        ? new Date(subData.current_period_end * 1000).toISOString()
        : null,
      trial_end: subData.trial_end
        ? new Date(subData.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subData.cancel_at_period_end || false,
    })
    .eq("stripe_customer_id", customerId);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
    throw updateError;
  }

  console.log("Successfully updated subscription in database");

  // Track subscription update in PostHog (get user_id from existing subscription record)
  const { data: subRecord } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subRecord?.user_id) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: subRecord.user_id,
      event: "subscription_updated",
      properties: {
        tier,
        status,
        billing_interval: interval,
        cancel_at_period_end: subData.cancel_at_period_end,
      },
    });
  }

  console.log(`Subscription updated for customer ${customerId}, status: ${status}`);
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user_id before updating
  const { data: subRecord } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id, tier")
    .eq("stripe_customer_id", customerId)
    .single();

  const previousTier = subRecord?.tier;

  // Downgrade to free tier
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
    .eq("stripe_customer_id", customerId);

  // Track subscription cancellation in PostHog
  if (subRecord?.user_id) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: subRecord.user_id,
      event: "subscription_cancelled",
      properties: {
        previous_tier: previousTier,
      },
    });
  }

  console.log(`Subscription deleted for customer ${customerId}, downgraded to free`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_customer_id", customerId);

  // Track payment failure in PostHog
  const { data: subRecord } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id, tier")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subRecord?.user_id) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: subRecord.user_id,
      event: "payment_failed",
      properties: {
        tier: subRecord.tier,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
      },
    });
  }

  console.log(`Payment failed for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // If payment succeeded after being past due, restore to active
  const { data: subscription } = await supabaseAdmin
    .from("user_subscriptions")
    .select("status")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subscription?.status === "past_due") {
    await supabaseAdmin
      .from("user_subscriptions")
      .update({
        status: "active",
      })
      .eq("stripe_customer_id", customerId);

    console.log(`Payment succeeded for customer ${customerId}, restored to active`);
  }
}
