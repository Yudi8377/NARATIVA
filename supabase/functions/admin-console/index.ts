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
  const actor = authData.user;

  const { data: role, error: roleError } = await db
    .from("platform_admin_roles")
    .select("role, active")
    .eq("user_id", actor.id)
    .eq("active", true)
    .maybeSingle();
  if (roleError) return json({ error: "admin_role_lookup_failed" }, 503);
  if (!role || role.role !== "platform_admin") {
    await db.from("platform_audit_events").insert({
      actor_user_id: actor.id,
      action: "admin_console.view",
      target_type: "platform",
      outcome: "denied",
      metadata: { reason: "platform_admin_role_required" },
    });
    return json({ error: "platform_admin_role_required" }, 403);
  }

  const [allBooks, publishedBooks, draftBooks, openReports] = await Promise.all([
    db.from("books").select("id", { count: "exact", head: true }),
    db.from("books").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("books").select("id", { count: "exact", head: true }).in("status", ["draft", "in_review"]),
    db.from("content_reports").select("id", { count: "exact", head: true }).in("status", ["open", "under_review"]),
  ]);
  if (allBooks.error || publishedBooks.error || draftBooks.error || openReports.error) {
    return json({ error: "admin_metrics_unavailable" }, 503);
  }

  const { error: auditError } = await db.from("platform_audit_events").insert({
    actor_user_id: actor.id,
    action: "admin_console.view",
    target_type: "platform",
    outcome: "success",
    metadata: { role: role.role },
  });
  if (auditError) return json({ error: "audit_write_failed" }, 503);

  return json({
    ok: true,
    role: role.role,
    metrics: {
      worksTotal: allBooks.count ?? 0,
      worksPublished: publishedBooks.count ?? 0,
      worksInDraftOrReview: draftBooks.count ?? 0,
      reportsOpen: openReports.count ?? 0,
    },
    capabilities: {
      moderationActions: false,
      userAdministration: false,
      rightsDisputes: false,
      vendorManagement: false,
      paymentOperations: false,
    },
    notice: "Read-only operational overview. Privileged actions remain disabled until their audited server workflows are implemented.",
  });
});
