# Admin Console: Secure Foundation and Bootstrap

## Security model

- `platform_admin_roles`, `content_reports`, and `platform_audit_events` are server-only tables. Browser roles have no direct grants or RLS policies.
- The `admin-console` Edge Function requires a valid Supabase access token, checks the server-owned `platform_admin_roles` table, and only returns aggregate metrics to `platform_admin`.
- Role checks never use `user_metadata` or a browser-supplied role.
- The function records successful and denied console access in `platform_audit_events`.
- This first release is read-only. It does not let an admin delete works, suspend accounts, resolve disputes, change roles, or move money.

## Bootstrap the first platform administrator

Do not expose a bootstrap endpoint to the public internet. After the intended operator has created and verified their NARATIVA account, a trusted project owner should obtain that user's UUID from Supabase Auth and insert the role directly in the Supabase SQL Editor:

```sql
insert into public.platform_admin_roles (user_id, role, active)
values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID', 'platform_admin', true)
on conflict (user_id) do update
set role = excluded.role, active = true, updated_at = now();
```

Only run this after independently verifying the UUID belongs to the intended platform operator. Never paste service-role keys into the browser or a chat.

## Current boundaries

- Moderation report intake and review actions are not enabled.
- Role assignment/revocation workflow is not enabled; it must be a separately audited owner-only operation.
- Metrics are aggregate counts only; no email addresses or manuscript content are returned.
- The production deployment requires the migration to be applied and the `admin-console` function to be deployed with `verify_jwt=true`.
- Supabase Auth leaked-password protection was found disabled in the 2026-10-12 audit; enable it in Auth password/security settings before inviting general users.
