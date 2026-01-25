# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your PickleBracket Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 15.3+ approach)
- **Server-side tracking** using `posthog-node` for Stripe webhook events
- **Reverse proxy configuration** in `next.config.ts` to improve tracking reliability
- **User identification** on sign-in/sign-up with automatic PostHog `identify()` calls
- **Exception capture** using `posthog.captureException()` for error tracking
- **16 custom events** tracking key user actions across authentication, tournaments, payments, and collaboration

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User successfully signed up with email | `app/context/AuthContext.tsx` |
| `user_signed_in` | User successfully signed in (email or Google) | `app/context/AuthContext.tsx` |
| `user_signed_out` | User signed out of their account | `app/context/AuthContext.tsx` |
| `tournament_created` | User created a new bracket tournament | `app/context/TournamentContext.tsx` |
| `player_added` | User added a player to a tournament | `app/components/PlayerForm.tsx` |
| `bracket_generated` | User generated the tournament bracket | `app/context/TournamentContext.tsx` |
| `match_completed` | User entered score and completed a match | `app/components/ScoreEntry.tsx` |
| `tournament_completed` | Championship match completed, tournament has a winner | `app/context/TournamentContext.tsx` |
| `checkout_started` | User initiated subscription checkout (client-side) | `app/pricing/page.tsx` |
| `checkout_completed` | Stripe checkout session completed (server-side) | `app/api/stripe/webhook/route.ts` |
| `subscription_updated` | User subscription status changed (server-side) | `app/api/stripe/webhook/route.ts` |
| `subscription_cancelled` | User subscription was cancelled (server-side) | `app/api/stripe/webhook/route.ts` |
| `payment_failed` | Payment failed for a subscription (server-side) | `app/api/stripe/webhook/route.ts` |
| `invite_code_generated` | User generated an invite code to share tournament | `app/components/ShareTournament.tsx` |
| `tournament_joined` | User joined a tournament as collaborator | `app/join/page.tsx` |
| `bug_report_submitted` | User submitted a bug report | `app/settings/page.tsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization
- `app/lib/posthog-server.ts` - Server-side PostHog client singleton

### Modified Files
- `next.config.ts` - Added reverse proxy rewrites for `/ingest/*`
- `.env.local` - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
- `app/context/AuthContext.tsx` - User identification and auth events
- `app/context/TournamentContext.tsx` - Tournament lifecycle events
- `app/components/PlayerForm.tsx` - Player added event
- `app/components/ScoreEntry.tsx` - Match completed event
- `app/pricing/page.tsx` - Checkout started event
- `app/api/stripe/webhook/route.ts` - Server-side payment events
- `app/components/ShareTournament.tsx` - Invite code generated event
- `app/join/page.tsx` - Tournament joined event
- `app/settings/page.tsx` - Bug report submitted event

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/298230/dashboard/1127532) - Key business metrics and user behavior tracking

### Insights
- [User Sign-ups & Sign-ins](https://us.posthog.com/project/298230/insights/Vcb2JRuc) - Daily user authentication activity
- [Subscription Conversion Funnel](https://us.posthog.com/project/298230/insights/ZUx4XjlP) - User journey from sign-up to paid subscription
- [Tournament Activity](https://us.posthog.com/project/298230/insights/xtellx60) - Tournament creation, bracket generation, and completions
- [Subscription Health](https://us.posthog.com/project/298230/insights/Jfnib4ey) - Track subscription updates, cancellations, and payment failures
- [Collaboration & Sharing](https://us.posthog.com/project/298230/insights/ehtaUmfZ) - Invite codes generated and tournaments joined

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
