# NARATIVA — One Story, Many Worlds

NARATIVA is a story-universe platform built around a Living Library and a Story Universe Engine. A canonical story can be adapted into multiple formats while preserving rights, provenance, continuity, accessibility, and editorial review.

## Product principles

- **Canon first:** adaptations reference approved manuscripts, universe facts, and source material.
- **Human review:** AI-assisted output remains a draft until reviewed and approved.
- **Rights and provenance:** track source, permission/license, contributor, derivative lineage, and publication status.
- **Privacy and safety:** private assets by default, role-based access, child-safety safeguards, and data minimization.
- **Provider adapters:** keep AI vendors replaceable; keep credentials server-side.
- **Cost controls:** asynchronous jobs, quotas, retries, cancellation, and usage tracking for expensive media generation.

## Roadmap

1. **P0 — Foundation and security:** schema, RLS, reviewer workflow, private asset storage, and access tests.
2. **P1 — Living Library and Story Universe:** catalog, manuscript versions, canon, rights, and source provenance.
3. **P2 — Creator Studio and Living Comics:** storyboard/panel editor, motion direction, dialogue, and audio plan.
4. **P3 — AI video/audio adapters:** provider abstraction, job queue, budgets, retries, cancellation, and status tracking.
5. **P4 — Companion, Mentor, and Knowledge Fabric:** grounded retrieval with citations and canon-aware responses.
6. **P5 — Living Page and XR:** expand into immersive formats after the core pipeline is reliable.

## Current backend foundation

The Supabase project currently includes core tables for profiles, books, versions, assets, knowledge sources/chunks, reading progress, AI sessions, and AI messages. The story-pipeline Edge Function currently creates a deterministic draft storyboard/production plan from manuscript text. It is not yet connected to an AI media provider and does not persist its output.

## Security status and next steps

- Publication guard currently blocks direct creator publication unless the request uses the service role. This is only a partial safeguard; implement a proper reviewer role and server-side publish action before production.
- Keep manuscript/media assets in private Storage buckets with explicit access policies.
- Allow client-side message creation only for user messages; assistant/system messages should be generated server-side.
- Test policies with anonymous, owner, unrelated user, reviewer, and service-role contexts.
- Keep service-role and AI provider secrets out of browser code.
- Add moderation, rate limits, budgets, retention/deletion controls, and child privacy/consent protections before production.

## Development status

This repository is being initialized with the product blueprint. Treat the roadmap as planned work, not as a claim that all listed features are implemented.
