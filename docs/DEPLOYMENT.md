# NARATIVA Deployment & Go-Live Checklist

## Current release state

- Hosting project: [NARATIVA — One Story, Many Worlds](https://hatchable.com/console/projects/narativa-one-story)
- Hosted URL: https://narativa-one-story.hatchable.site
- Latest deployment: **v4 — live on hosting**
- Hosting visibility: **Personal / private**; anonymous visitors still see the platform sign-in wall until the owner changes visibility.
- Supabase project: `hdsqwkydgruyfbqqwhdk`, status ACTIVE_HEALTHY.
- Collective backend: `collective-orchestrator` Edge Function v1, JWT verification enabled.
- Supabase migrations: five, including the collective schema and RLS/index hardening.
- Last Hatchable dry run: passed with no errors or warnings.
- Security advisor: no security lints reported for the current Supabase project at last check.
- Performance advisor still reports older RLS initialization-plan warnings in the pre-existing core tables; these are optimization notices, not a failed security check.

## Owner actions required for public launch

1. Open the [Hatchable project console](https://hatchable.com/console/projects/narativa-one-story).
2. Go to **Settings** and change visibility from **Personal/Private** to **Public**. This is a deliberate owner-only setting; it cannot be changed by the deployment agent.
3. In Supabase Dashboard → Authentication → URL Configuration, set the production **Site URL** and add the exact production origin to **Redirect URLs**. Include the Hatchable hostname; add any GitHub Pages/custom domain only if it is used.
4. Verify email confirmation settings and sender deliverability. The sign-up screen tells users to confirm email if confirmation is enabled.
5. Create an owner-controlled moderator identity/process before accepting shared knowledge or skills at scale.

## Post-change smoke tests

- Open the hosted base URL in a private/incognito window: no Hatchable sign-in wall.
- Confirm the Collective AI section loads and the locally hosted Supabase client has no console parse errors.
- Sign up with a test mailbox, complete email confirmation if required, then sign in and sign out.
- Register a personal agent and verify it appears only for its owner.
- Create a task and confirm it persists with `queued` status and does not claim execution has started.
- Submit knowledge and a skill privately; verify they remain private.
- Submit a network contribution; verify it remains pending and is not discoverable by another account until reviewed.
- Verify anonymous function calls are rejected and owner data cannot be read by another user.
- Confirm the Creator Studio still runs locally and does not send the manuscript text to the server.
- Check mobile layout, keyboard navigation, form errors, and the browser console.

## Shipped in v4

- Collective Intelligence landing/workspace section.
- Supabase email/password sign-up, sign-in, sign-out.
- Personal agent registration.
- Owner-scoped task queue with bounded agent-count and budget-unit fields.
- Knowledge and skill submissions with explicit network opt-in and pending-review defaults.
- Verified-only shared knowledge/skill discovery.
- Supabase schema with RLS, provenance/evidence metadata, evaluation records, audit events, and indexes.

## Not production-complete yet

- Autonomous AI agent execution and fan-out.
- Model provider integration, model budget enforcement, retry/cancellation worker.
- Moderator UI/role setup and server-side approval endpoint.
- Automated cross-account authorization tests and abuse/rate-limit controls.
- Public visibility and Auth URL configuration (owner actions above).

A deployed version is not equivalent to a public, production-complete service. Do not advertise autonomous AI execution until the dispatcher and provider integration have been implemented and tested.
