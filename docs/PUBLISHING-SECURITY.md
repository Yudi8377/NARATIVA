# Server-Side Publication Guard

## Why this exists

The live database trigger `guard_book_publication()` rejects a direct browser transition to `published` unless the database request runs with the trusted `service_role`. This is intentional: a browser button or client-side role label is not an authorized publication workflow.

## Workflow

1. Creator saves the work and a canonical version.
2. Creator confirms publication in the UI.
3. The `publish-work` Edge Function verifies the access token, checks that the signed-in user owns the book, requires an explicit rights confirmation, validates a non-empty rights holder/license and latest canonical body, and writes an audit event.
4. The function changes status using the server-side service role and records completion.
5. Reader Space exposes the work through the published-only query and RLS policy.

The function uses `verify_jwt=true`. It does not accept a user-supplied owner ID as authority; it derives identity from the verified access token. If the audit log is unavailable, publication is stopped before the status update.

## Test

Use the manual workflow described in [E2E Creator → Reader](E2E-CREATOR-READER.md). It creates a temporary draft, saves a canonical version, verifies draft invisibility, publishes through the Edge Function, verifies anonymous reading and product visibility, then deletes the temporary fixture.
