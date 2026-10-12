# RLS Performance Optimization

The migration `narativa_rls_initplan_optimization` wraps direct `auth.uid()` calls in scalar subqueries, for example `owner_id = (select auth.uid())`. Supabase recommends this form to avoid evaluating the same auth helper for each candidate row.

The migration is intentionally limited to the existing policy expressions. It does not grant new roles, change policy targets, or broaden access. It preserves existing `USING` and `WITH CHECK` predicates and changes only how the auth identity is evaluated.

After applying the migration, run the Supabase Performance Advisor again. If any findings remain, inspect them individually rather than broadening or deleting RLS policies.
