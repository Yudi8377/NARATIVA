-- Supabase recommends wrapping auth.uid() in a scalar subquery to avoid per-row re-evaluation.
-- This migration changes only the evaluation plan; policy predicates and authorization semantics remain the same.
ALTER POLICY "ai_messages_insert_user_only" ON "public"."ai_messages" WITH CHECK (((user_id = (select auth.uid())) AND (role = 'user'::text) AND (EXISTS ( SELECT 1
   FROM ai_sessions s
  WHERE ((s.id = ai_messages.session_id) AND (s.user_id = (select auth.uid())))))));

ALTER POLICY "ai_messages_select_self" ON "public"."ai_messages" USING (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM ai_sessions s
  WHERE ((s.id = ai_messages.session_id) AND (s.user_id = (select auth.uid())))))));

ALTER POLICY "ai_sessions_delete_self" ON "public"."ai_sessions" USING ((user_id = (select auth.uid())));

ALTER POLICY "ai_sessions_insert_self" ON "public"."ai_sessions" WITH CHECK (((user_id = (select auth.uid())) AND ((book_id IS NULL) OR (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = ai_sessions.book_id) AND ((b.status = 'published'::text) OR (b.owner_id = (select auth.uid())))))))));

ALTER POLICY "ai_sessions_select_self" ON "public"."ai_sessions" USING ((user_id = (select auth.uid())));

ALTER POLICY "ai_sessions_update_self" ON "public"."ai_sessions" USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Creators manage assets for owned books" ON "public"."book_assets" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))) WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_assets_delete_owner" ON "public"."book_assets" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid()))))));

ALTER POLICY "book_assets_insert_owner" ON "public"."book_assets" WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_assets_read_owner" ON "public"."book_assets" USING (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_assets_update_owner" ON "public"."book_assets" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))) WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_assets.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_versions_delete_owner" ON "public"."book_versions" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_versions.book_id) AND (b.owner_id = (select auth.uid()))))));

ALTER POLICY "book_versions_insert_owner" ON "public"."book_versions" WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_versions.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_versions_read" ON "public"."book_versions" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_versions.book_id) AND ((b.status = 'published'::text) OR (b.owner_id = (select auth.uid())))))));

ALTER POLICY "book_versions_update_owner" ON "public"."book_versions" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_versions.book_id) AND (b.owner_id = (select auth.uid())))))) WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = book_versions.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "books_delete_owner" ON "public"."books" USING ((owner_id = (select auth.uid())));

ALTER POLICY "books_insert_owner" ON "public"."books" WITH CHECK ((owner_id = (select auth.uid())));

ALTER POLICY "books_read_published_or_owner" ON "public"."books" USING (((status = 'published'::text) OR (owner_id = (select auth.uid()))));

ALTER POLICY "books_update_owner" ON "public"."books" USING ((owner_id = (select auth.uid()))) WITH CHECK ((owner_id = (select auth.uid())));

ALTER POLICY "knowledge_chunks_delete_owner" ON "public"."knowledge_chunks" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_chunks.book_id) AND (b.owner_id = (select auth.uid()))))));

ALTER POLICY "knowledge_chunks_read_approved" ON "public"."knowledge_chunks" USING (((EXISTS ( SELECT 1
   FROM (knowledge_sources s
     JOIN books b ON ((b.id = s.book_id)))
  WHERE ((s.id = knowledge_chunks.source_id) AND (b.id = s.book_id) AND (s.verification_status = 'verified'::text) AND (knowledge_chunks.review_status = 'approved'::text) AND ((b.status = 'published'::text) OR (b.owner_id = (select auth.uid())))))) OR (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_chunks.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "knowledge_sources_delete_owner" ON "public"."knowledge_sources" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND (b.owner_id = (select auth.uid()))))));

ALTER POLICY "knowledge_sources_insert_owner" ON "public"."knowledge_sources" WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "knowledge_sources_read_verified" ON "public"."knowledge_sources" USING ((((verification_status = 'verified'::text) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND ((b.status = 'published'::text) OR (b.owner_id = (select auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "knowledge_sources_update_owner" ON "public"."knowledge_sources" USING ((EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND (b.owner_id = (select auth.uid())))))) WITH CHECK (((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = knowledge_sources.book_id) AND (b.owner_id = (select auth.uid())))))));

ALTER POLICY "profiles_insert_self" ON "public"."profiles" WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "profiles_select_self" ON "public"."profiles" USING ((user_id = (select auth.uid())));

ALTER POLICY "profiles_update_self" ON "public"."profiles" USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "reading_progress_delete_self" ON "public"."reading_progress" USING ((user_id = (select auth.uid())));

ALTER POLICY "reading_progress_insert_self" ON "public"."reading_progress" WITH CHECK (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = reading_progress.book_id) AND (b.status = 'published'::text))))));

ALTER POLICY "reading_progress_select_self" ON "public"."reading_progress" USING ((user_id = (select auth.uid())));

ALTER POLICY "reading_progress_update_self" ON "public"."reading_progress" USING ((user_id = (select auth.uid()))) WITH CHECK (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM books b
  WHERE ((b.id = reading_progress.book_id) AND (b.status = 'published'::text))))));
