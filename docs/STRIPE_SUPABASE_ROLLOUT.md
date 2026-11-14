# SONIQ Stripe + Supabase commerce rollout

## Branch
Implementation branch: `feature/stripe-supabase-commerce`  
Production branch `main` is intentionally untouched.

## What this foundation adds
- Per-account profile and credit ledger tables.
- Row Level Security for profile, song, playlist, and credit-history reads/writes.
- A server-only database function for applying paid credits.
- Idempotency keyed by Stripe Checkout Session ID, so Stripe webhook retries cannot credit the same purchase twice.
- A webhook event table for recording processed Stripe event IDs.

## Required Supabase setup
1. Review and run `supabase/migrations/20261114_commerce_foundation.sql` in the correct Supabase project.
2. Confirm the existing `songs` and `playlists` tables have the columns used by the app. This migration only adds `user_id`; it does not rename or remove existing columns.
3. Configure Supabase Auth providers and redirect URLs for the deployed SONIQ domain.
4. Configure Storage bucket policies separately before storing private audio. Do not make private user audio publicly readable.

## Required server secrets for the next integration step
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to browser or return from an API)
- `STRIPE_SECRET_KEY` (server only)
- `STRIPE_WEBHOOK_SECRET` (server only)
- `APP_URL` (canonical HTTPS application URL)

Never paste secret values into GitHub, client-side settings, chat, or source files. Add them only in the hosting provider's secret/environment-variable settings.

## Stripe configuration
Create Stripe Checkout products/prices for the three existing credit packages:
- `starter-pack`: 250 credits, EUR 4.99
- `pro-studio`: 1,000 credits, EUR 14.99
- `studio-vip`: 3,000 credits, EUR 29.99

The server must own the package-to-price mapping. The browser must send only a package ID; it must never be allowed to choose the amount, currency, credit count, or a Stripe price ID.

Configure a webhook endpoint at `/api/stripe/webhook` and subscribe to `checkout.session.completed`. The server must verify the Stripe signature against the raw request body, verify the session is paid, validate the expected currency and price, and then call `soniq_apply_paid_credit_purchase` using the authenticated user ID saved in Checkout Session metadata. Never credit from the success/return URL.

## Important rollout blockers before enabling live payments
The current app still has legacy global in-memory credits and JSON song storage, and it has no complete sign-in/session flow in the inspected frontend. This migration alone does not make those endpoints safe. Before enabling Stripe live mode, the next code changes must:
1. Add Supabase Auth UI and send the access token with protected API requests.
2. Verify the access token server-side on every account-specific route.
3. Replace global credits, purchase, bonus, and deduction routes with per-user database operations.
4. Replace global songs/playlists storage with user-scoped Supabase queries and enforce ownership.
5. Remove public mutation of `/api/settings`; admin-only configuration must come from server secrets.
6. Implement Stripe Checkout + raw-body webhook verification and return-to-app balance refresh.
7. Add tests for cross-account access, duplicate webhooks, failed payments, refunds, and insufficient credits.

## Legacy data
Existing in-memory/local JSON data is not automatically migrated by this SQL. Keep a backup before any migration or deployment. Seed/demo songs with no owner should not be exposed to authenticated customers unless intentionally re-created as public demo content.
