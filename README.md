# NARATIVA — One Story, Many Worlds

NARATIVA is a story-universe platform built around a Living Library and a Story Universe Engine. A canonical story can be adapted into multiple formats while preserving rights, provenance, continuity, accessibility, and editorial review.

## Product principles

- **Canon first:** adaptations reference approved manuscripts, universe facts, and source material.
- **Human review:** AI-assisted output remains a draft until reviewed and approved.
- **Rights and provenance:** track source, permission/license, contributor, derivative lineage, and publication status.
- **Privacy and safety:** private assets by default, role-based access, child-safety safeguards, and data minimization.
- **Provider adapters:** keep AI vendors replaceable; keep credentials server-side.
- **Cost controls:** asynchronous jobs, quotas, retries, cancellation, and usage tracking for expensive media generation.

## Current release

- Hosted preview: https://narativa-one-story.hatchable.site
- Hosting deployment: v4 live; project visibility remains private until the owner changes it in [Hatchable Settings](https://hatchable.com/console/projects/narativa-one-story).
- Backend: Supabase project `hdsqwkydgruyfbqqwhdk`, active and healthy.
- Collective Intelligence endpoint: `collective-orchestrator` v1 with JWT verification.
- Last hosting dry-run: no errors or warnings.
- The current Hatchable release includes a Collective AI workspace for account authentication, personal agent registration, private task creation, knowledge/skill submissions, and verified-only discovery.

## Collective Intelligence foundation

See [Collective Intelligence Engineering Blueprint](docs/COLLECTIVE-INTELLIGENCE.md) for the tables, endpoint, privacy boundaries, and phased next steps.

The collective backend currently **stores tasks but does not execute autonomous agents**. Shared knowledge/skills require review before discovery. The Creator Studio scene planner remains a deterministic browser-side prototype, not an LLM-driven production pipeline.

## Roadmap

1. **P0 — Foundation and security:** schema, RLS, reviewer workflow, private asset storage, and access tests.
2. **P1 — Living Library and Story Universe:** catalog, manuscript versions, canon, rights, and source provenance.
3. **P2 — Creator Studio and Living Comics:** storyboard/panel editor, motion direction, dialogue, and audio plan.
4. **P3 — AI video/audio adapters:** provider abstraction, job queue, budgets, retries, cancellation, and status tracking.
5. **P4 — Companion, Mentor, and Knowledge Fabric:** grounded retrieval with citations and canon-aware responses.
6. **P5 — Living Page and XR:** expand into immersive formats after the core pipeline is reliable.

## Security status

- Core content tables and collective tables have RLS enabled.
- Collective tasks and agents are owner-scoped.
- Shared knowledge and skills are discoverable only after verification.
- Service-role and provider secrets must never be placed in browser code.
- Before production scale, add a moderator role, server-side review actions, access tests, rate limits, retention/deletion controls, cost alerts, and child privacy/consent protections.

## Deployment

See [Go-Live Checklist](docs/DEPLOYMENT.md) for the remaining owner-only public visibility step, Supabase Auth URL configuration, and smoke tests.
