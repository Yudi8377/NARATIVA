# NARATIVA Collective Intelligence — Engineering Blueprint

**Status:** Foundation deployed; production launch gates remain.  
**Hosting:** Hatchable project `narativa-one-story`, release v4.  
**Backend:** Supabase project `hdsqwkydgruyfbqqwhdk` (ap-southeast-1).

## Architecture boundaries

- **Personal identity:** Supabase Auth identifies the owner of each private workspace.
- **Personal agents:** `collective_agents` stores agent profiles and declared capabilities. Registration does not imply an autonomous model is running.
- **Task queue:** `collective_tasks` stores task objective, type, budget, agent limit, status, and private result metadata. New tasks enter `queued`.
- **Skill exchange:** `collective_skills` stores versioned workflow/skill descriptions. Network submissions begin as `pending`; only verified network entries are discoverable.
- **Knowledge exchange:** `collective_knowledge` stores summaries, provenance, evidence, confidence, license, visibility, review status, and optional expiry. Network contributions are not visible to other members until verified.
- **Evaluation:** `collective_evaluations` stores owner-scoped quality/factuality/privacy/safety/utility evaluations.
- **Audit:** `collective_audit_events` records owner-scoped events without storing raw manuscript content.

## Deployed endpoint

`POST https://hdsqwkydgruyfbqqwhdk.supabase.co/functions/v1/collective-orchestrator`

JWT verification is enabled. The handler also resolves the caller with Supabase Auth and uses the caller's JWT for database access so row-level security remains enforced.

Supported actions:
- `health`
- `create_task`
- `list_tasks`
- `register_agent`
- `submit_knowledge`
- `submit_skill`
- `discover`

## Privacy and trust model

1. Tasks and agents are owner-scoped by RLS.
2. Private knowledge and skills remain visible to their owner only.
3. Shared knowledge/skills are discoverable only when `visibility = 'network'` and `review_status = 'verified'`.
4. Sharing is explicit opt-in; network contributions remain pending review.
5. Manuscripts are not automatically sent to another user's agent.
6. Public clients must use only the publishable/anon key. Never expose service-role or provider secrets.
7. Treat evidence and imported content as untrusted input; sanitize and validate before downstream agent use.

## Current limitations (do not overstate)

- The task queue persists work items but **does not yet execute agents automatically**.
- No provider/model API has been wired to the collective task runner.
- No moderator UI or role provisioning workflow has been shipped; pending contributions require a controlled review process before promotion to verified.
- No federated model training or cross-user weight sharing is implemented.
- Supabase Auth redirect allow-list and the final public visibility setting require owner configuration.
- The Creator Studio scene planner remains a deterministic browser-side prototype; its manuscript text is not sent to the server by that local planner.

## Next engineering phases

1. Configure Supabase Auth Site URL and Redirect URLs for the final public domain.
2. Provision and test a moderator role; add a server-side review endpoint that cannot be invoked by ordinary members.
3. Implement an idempotent task dispatcher, bounded fan-out, retries, cancellation, and budget accounting.
4. Connect an approved model provider using server-side secrets and structured outputs.
5. Add task-result evaluation, evidence/provenance capture, and a safe knowledge-promotion workflow.
6. Add automated tests for anonymous, owner, unrelated user, moderator, and service-role access.
7. Add rate limiting, retention/deletion, incident logging, abuse handling, and cost alerts before wider rollout.

## Schema migration history

- `narativa_core_foundation`
- `narativa_foreign_key_indexes`
- `narativa_publication_guard_and_knowledge_integrity`
- `narativa_collective_intelligence_foundation`
- `narativa_collective_rls_and_indexes`
