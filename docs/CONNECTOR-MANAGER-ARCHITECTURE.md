# NARATIVA Connector Manager — Architecture & Delivery Plan

## Current deployment boundary

- Frontend: GitHub Pages at https://yudi8377.github.io/NARATIVA/
- Backend: the existing NARATIVA Supabase project referenced by the app; no production domain or paid hosting is required for this development stage.
- Etsy: the only connector with an implemented OAuth backend. It uses authorization code + PKCE, short-lived single-use state, server-side token encryption, status/refresh, and disconnect.
- Vendor directory: 31 channels are listed for planning and documentation. A directory entry is not an active integration.
- Etsy listing publication, order synchronization, payments, inventory writes, and other vendor adapters are not implemented yet.

## Connector contract

Each adapter should implement the same server-side lifecycle and return a normalized result. Never put provider secrets, refresh tokens, private API keys, or service-role keys in browser JavaScript.

```ts
type ConnectorStatus =
  | "not_configured"
  | "not_connected"
  | "pending_authorization"
  | "connected"
  | "action_required"
  | "error";

type ConnectorCapability =
  | "catalog_read"
  | "listing_create"
  | "listing_update"
  | "inventory_read"
  | "inventory_write"
  | "orders_read"
  | "orders_write"
  | "payouts_read"
  | "analytics_read";

type ConnectorStatusResult = {
  vendor: string;
  status: ConnectorStatus;
  capabilities: ConnectorCapability[];
  checked_at: string;
  account_label?: string;
  expires_at?: string;
  action_url?: string;
  message_code?: string; // Stable code; no token, secret, or raw provider response.
};
```

All adapter actions must bind to the authenticated NARATIVA user. Authorization callbacks must validate a cryptographically random, expiring, single-use state value; use PKCE wherever supported; validate the exact callback URL; and protect tokens at rest. Normalize errors before returning them to the browser.

## Connector lifecycle

1. **Discover** — display provider name, official documentation, region/access prerequisites, and capability status.
2. **Configure** — server-side secrets only; report missing configuration without exposing secret values.
3. **Authorize** — user explicitly starts OAuth; use state + PKCE and exact registered callback.
4. **Verify** — fetch a minimal read-only provider resource after OAuth. Only this step may mark an account connected.
5. **Operate** — implement each capability as a separate, tested server action with least-privilege scopes and explicit user intent for writes.
6. **Observe** — store safe timestamps and stable error codes; never log credentials, authorization codes, token payloads, or personal order details.
7. **Disconnect** — revoke provider credentials when supported, then delete encrypted tokens and account linkage.

## Vendor onboarding order

1. **Etsy** — finish real seller OAuth and add a read-only shop/listing verification call before showing the connector as operational.
2. **Shopify / WooCommerce** — store and catalog integrations; verify official app/OAuth requirements per merchant.
3. **Gumroad / Ko-fi / Patreon** — creator monetization and membership; only use officially supported API/webhook features.
4. **Printful / Printify / Gelato** — print-on-demand product mapping and fulfillment lifecycle.
5. **Books and stock media** — investigate official publisher/contributor API access before implementation.
6. **Marketplace-specific adapters** — Amazon, Shopee, Tokopedia, Lazada, TikTok Shop and eBay require their own eligibility, partner approvals, scopes, and operational checks.

Do not implement scraping, password-based vendor login, or unofficial private endpoints. Some directory providers may have no public seller API or may restrict access; leave them as documented/manual channels until official access is confirmed.

## Acceptance gates

- [ ] Missing credentials yield a truthful `not_configured` state.
- [ ] Unauthenticated actions fail; one user's connection cannot be queried, refreshed, or disconnected by another user.
- [ ] OAuth state expires and cannot be reused, including concurrent callback attempts.
- [ ] Tokens are encrypted with a stable server-only key and never returned to the browser.
- [ ] Status is marked `connected` only after a real provider authorization and a successful provider verification call.
- [ ] Disconnect removes NARATIVA's stored connection and revokes the provider grant where supported.
- [ ] Each read/write capability has a separate test and least-privilege scope review.
- [ ] Frontend count reflects verified live connections only; directory entries are never counted as connected.
- [ ] Deployment tests verify GitHub Pages and Supabase function versions independently.

## Etsy-specific current blocker

The OAuth implementation and migration are in the repository, and the function was previously deployed. A real seller connection still requires the Etsy app/client ID and a stable random 32-byte `ETSY_TOKEN_ENCRYPTION_KEY` configured as Supabase Edge Function secrets. Never paste these values into chat or commit them to Git. Register this exact callback:

`https://hdsqwkydgruyfbqqwhdk.supabase.co/functions/v1/etsy-connect`

Required setup guide: [ETSY-CONNECTOR-SETUP.md](./ETSY-CONNECTOR-SETUP.md).

The callback handler consumes the OAuth state atomically, preventing two concurrent/replayed callbacks from both exchanging the same state. This hardening was deployed to the NARATIVA Supabase project as Edge Function version 3; verify the deployed function independently during release checks.
