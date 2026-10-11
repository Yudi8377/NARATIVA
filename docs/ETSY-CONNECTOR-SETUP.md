# NARATIVA — Etsy OAuth Connector

## Scope and honest status

This package provides the server-side OAuth foundation: account-bound state, PKCE, short-lived state, callback validation, encrypted token storage, refresh, status, and disconnect. A successful OAuth grant means the seller account authorized NARATIVA; it does **not** yet publish listings or synchronize orders. Those capabilities require separate approved scopes and tested API operations.

The GitHub Pages site must never contain Etsy secrets, refresh tokens, or a Supabase service-role key. Do not mark Etsy connected until the function is deployed and a real seller account completes OAuth successfully.

## Prerequisites and deployment

1. Use the existing NARATIVA Supabase project whose URL is referenced by the website JavaScript: hdsqwkydgruyfbqqwhdk.supabase.co. Do not deploy this migration to an unrelated project.
2. Register an Etsy application at https://www.etsy.com/developers/ and ensure API access is approved for the intended use.
3. Set the exact Etsy OAuth callback URL to: https://hdsqwkydgruyfbqqwhdk.supabase.co/functions/v1/etsy-connect
4. Apply migration supabase/migrations/202610110001_etsy_connector.sql.
5. Deploy supabase/functions/etsy-connect/index.ts as function etsy-connect with gateway JWT verification disabled **only because** this function validates the bearer JWT itself for POST requests and uses state-validated public OAuth callback handling for GET. Never remove the in-function bearer validation.
6. Configure Edge Function secrets (never commit values):
   - ETSY_CLIENT_ID: Etsy API keystring/client ID.
   - ETSY_REDIRECT_URI: exact callback URL above.
   - ETSY_TOKEN_ENCRYPTION_KEY: random 32-byte key encoded as base64 or 64 hex characters. Keep it stable; changing it makes existing tokens unreadable.
   - NARATIVA_SITE_URL: https://yudi8377.github.io/NARATIVA
   - SUPABASE_URL: NARATIVA project URL.
   - SUPABASE_SERVICE_ROLE_KEY: NARATIVA service-role secret, stored only as an Edge Function secret.
7. Initial scopes are read-only shops_r and listings_r. Request broader scopes only after the listing/order workflow is designed and approved.
8. Verify an authenticated action=status call, then test OAuth with a real seller account. If Etsy rejects the callback, verify exact URL and app access in Etsy Developer Portal.

## Actions

- POST { "action": "start" } — valid Supabase user JWT required; returns an Etsy authorization URL.
- POST { "action": "status" } — valid Supabase user JWT required; returns not_connected, connected, or action_required without exposing tokens. Refreshes an expiring access token server-side.
- POST { "action": "disconnect" } — deletes the stored connection record for the signed-in account.
- GET ?code=...&state=... — public OAuth callback; state is hashed, expires after 10 minutes, is consumed before token exchange, and is bound to the initiating account.

## Security and limitations

- Access token, refresh token, and PKCE verifier use AES-256-GCM with a server-only key and random nonce.
- RLS is enabled; privileges are revoked from anon, authenticated, and public. Only service_role can access connector records.
- OAuth callback uses state plus PKCE and stores no raw OAuth state.
- This foundation does not fetch or publish listings, access orders, or claim transaction sync. Build and test those separately, with rights checks and explicit user action.
- Expired OAuth state rows are unusable after expiry; periodically clean them up.

## Official references

- https://www.etsy.com/developers/
- https://developer.etsy.com/documentation/essentials/authentication/
- https://developer.etsy.com/documentation/tutorials/quickstart/
