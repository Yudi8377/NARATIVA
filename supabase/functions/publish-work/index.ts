import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_ORIGIN = new URL(Deno.env.get("NARATIVA_SITE_URL") || "https://yudi8377.github.io/NARATIVA").origin;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "authentication_required" }, 401);
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "authentication_invalid" }, 401);
  const user = authData.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (body.rights_confirmed !== true) return json({ error: "rights_confirmation_required" }, 403);
  const bookId = typeof body.book_id === "string" ? body.book_id.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookId)) {
    return json({ error: "invalid_book_id" }, 400);
  }

  const { data: book, error: bookError } = await db
    .from("books")
    .select("id,owner_id,title,status,rights_metadata")
    .eq("id", bookId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (bookError) return json({ error: "book_lookup_failed" }, 503);
  if (!book) return json({ error: "owned_book_required" }, 404);
  if (!["draft", "in_review", "published"].includes(book.status)) {
    return json({ error: "book_status_not_publishable", message: "Status karya ini belum dapat diterbitkan." }, 409);
  }

  const rights = book.rights_metadata && typeof book.rights_metadata === "object" ? book.rights_metadata as Record<string, unknown> : {};
  const rightsOwner = typeof rights.owner_name === "string" ? rights.owner_name.trim() : "";
  const license = typeof rights.license === "string" ? rights.license.trim() : "";
  if (!rightsOwner) return json({ error: "rights_owner_required", message: "Isi nama pemegang hak cipta atau pihak yang berwenang menerbitkan." }, 400);
  if (!license || license.toLowerCase() === "perlu pemeriksaan hak") {
    return json({ error: "rights_license_unresolved", message: "Pastikan hak distribusi telah diperiksa sebelum menerbitkan." }, 400);
  }

  const { data: version, error: versionError } = await db
    .from("book_versions")
    .select("version_number,canonical_content")
    .eq("book_id", book.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) return json({ error: "latest_version_lookup_failed" }, 503);
  const canonical = version?.canonical_content && typeof version.canonical_content === "object" ? version.canonical_content as Record<string, unknown> : {};
  if (!version || typeof canonical.body !== "string" || !canonical.body.trim()) {
    return json({ error: "publishable_version_required", message: "Simpan versi naskah yang berisi teks sebelum menerbitkan." }, 400);
  }

  const now = new Date().toISOString();
  const { error: requestedAuditError } = await db.from("platform_audit_events").insert({
    actor_user_id: user.id,
    action: "book.publish.authorized",
    target_type: "book",
    target_id: book.id,
    outcome: "success",
    metadata: { version_number: version.version_number, rights_confirmed: true },
  });
  if (requestedAuditError) return json({ error: "audit_unavailable", message: "Publikasi ditahan karena audit log tidak tersedia." }, 503);

  const nextRights = {
    ...rights,
    rights_confirmed: true,
    rights_confirmed_by: user.id,
    rights_confirmed_at: now,
  };
  const { error: publishError } = await db.from("books").update({
    status: "published",
    rights_metadata: nextRights,
    updated_at: now,
  }).eq("id", book.id).eq("owner_id", user.id);
  if (publishError) {
    await db.from("platform_audit_events").insert({
      actor_user_id: user.id,
      action: "book.publish.failed",
      target_type: "book",
      target_id: book.id,
      outcome: "failure",
      metadata: { version_number: version.version_number, reason: "status_update_failed" },
    });
    return json({ error: "publish_update_failed", message: "Database menolak perubahan status publikasi." }, 503);
  }

  const { error: completedAuditError } = await db.from("platform_audit_events").insert({
    actor_user_id: user.id,
    action: "book.publish.completed",
    target_type: "book",
    target_id: book.id,
    outcome: "success",
    metadata: { version_number: version.version_number, title: book.title },
  });
  return json({
    ok: true,
    bookId: book.id,
    status: "published",
    versionNumber: version.version_number,
    auditLogged: !completedAuditError,
    notice: completedAuditError
      ? "Karya berhasil diterbitkan, tetapi pencatatan audit akhir perlu diperiksa."
      : "Karya berhasil diterbitkan setelah pemeriksaan kepemilikan, versi, dan hak distribusi.",
  });
});
