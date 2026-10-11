import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ETSY_CLIENT_ID = Deno.env.get("ETSY_CLIENT_ID")!;
const ETSY_REDIRECT_URI = Deno.env.get("ETSY_REDIRECT_URI") || "https://hdsqwkydgruyfbqqwhdk.supabase.co/functions/v1/etsy-connect";
const SITE_URL = Deno.env.get("NARATIVA_SITE_URL") || "https://yudi8377.github.io/NARATIVA";
const SITE_ORIGIN = SITE_URL ? new URL(SITE_URL).origin : "";
const ENCRYPTION_KEY = Deno.env.get("ETSY_TOKEN_ENCRYPTION_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const corsHeaders = { "Access-Control-Allow-Origin": SITE_ORIGIN, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Vary": "Origin" };
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function base64url(bytes: Uint8Array) { let binary = ""; bytes.forEach((b) => binary += String.fromCharCode(b)); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function decodeSecret(value: string): Uint8Array {
  if (/^[a-f0-9]{64}$/i.test(value)) return new Uint8Array(value.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)), (c) => c.charCodeAt(0));
}
async function cryptoKey() { const raw = decodeSecret(ENCRYPTION_KEY); if (raw.length !== 32) throw new Error("ETSY_TOKEN_ENCRYPTION_KEY harus 32 byte (base64 atau 64 karakter hex)."); return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]); }
async function encrypt(value: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await cryptoKey(), new TextEncoder().encode(value)); return base64url(new Uint8Array([...iv, ...new Uint8Array(cipher)])); }
async function decrypt(value: string) { const normalized = value.replace(/-/g, "+").replace(/_/g, "/"); const bytes = Uint8Array.from(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)), (c) => c.charCodeAt(0)); const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, await cryptoKey(), bytes.slice(12)); return new TextDecoder().decode(plain); }
async function sha256(value: string) { return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
function siteRedirect(status: "connected" | "error", reason?: string) { if (!SITE_URL) return new Response("NARATIVA_SITE_URL belum dikonfigurasi.", { status: 503 }); const target = new URL(SITE_URL.replace(/\/+$/, "") + "/commerce.html"); target.searchParams.set("etsy", status); if (reason) target.searchParams.set("reason", reason); return Response.redirect(target.toString(), 302); }
function allowedOrigin(req: Request) { const origin = req.headers.get("Origin"); return !origin || origin === SITE_ORIGIN; }
async function requireUser(req: Request) { const bearer = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]; if (!bearer) throw new Error("Sesi NARATIVA tidak ditemukan. Silakan masuk kembali."); const { data, error } = await supabase.auth.getUser(bearer); if (error || !data.user) throw new Error("Sesi tidak valid atau telah berakhir."); return data.user; }
function ready() { return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY && ETSY_CLIENT_ID && ETSY_REDIRECT_URI && SITE_URL && ENCRYPTION_KEY); }
async function refreshIfNeeded(userId: string) {
  const { data: row, error } = await supabase.from("narativa_etsy_connections").select("*").eq("user_id", userId).eq("vendor", "etsy").maybeSingle();
  if (error) throw error; if (!row) return { status: "not_connected" }; if (row.status !== "connected") return { status: "action_required", updated_at: row.updated_at };
  if (new Date(row.token_expires_at).getTime() > Date.now() + 5 * 60 * 1000) return { status: "connected", updated_at: row.updated_at, token_expires_at: row.token_expires_at };
  try {
    const refreshToken = await decrypt(row.encrypted_refresh_token);
    const response = await fetch("https://api.etsy.com/v3/public/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", client_id: ETSY_CLIENT_ID, refresh_token: refreshToken }) });
    if (!response.ok) throw new Error("Refresh token ditolak Etsy.");
    const token = await response.json(); if (!token.access_token || !token.refresh_token) throw new Error("Respons refresh Etsy tidak lengkap.");
    const expiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000).toISOString();
    const { error: updateError } = await supabase.from("narativa_etsy_connections").update({ encrypted_access_token: await encrypt(token.access_token), encrypted_refresh_token: await encrypt(token.refresh_token), token_expires_at: expiresAt, updated_at: new Date().toISOString(), status: "connected", last_error: null }).eq("id", row.id);
    if (updateError) throw updateError; return { status: "connected", updated_at: new Date().toISOString(), token_expires_at: expiresAt };
  } catch (_) { await supabase.from("narativa_etsy_connections").update({ status: "action_required", last_error: "Token refresh failed", updated_at: new Date().toISOString() }).eq("id", row.id); return { status: "action_required", updated_at: new Date().toISOString() }; }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") { if (!allowedOrigin(req)) return new Response("Origin tidak diizinkan", { status: 403 }); return new Response("ok", { headers: corsHeaders }); }
  if (!ready()) return req.method === "GET" ? siteRedirect("error", "backend_not_configured") : json({ error: "Backend Etsy belum dikonfigurasi." }, 503);
  try {
    if (req.method === "GET") {
      const url = new URL(req.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
      if (!code || !state) return siteRedirect("error", "missing_callback_parameters");
      const stateHash = await sha256(state);
      // Consume the state atomically: concurrent/replayed callbacks cannot both exchange the same code verifier.
      const { data: pending, error: pendingError } = await supabase.from("narativa_etsy_oauth_states")
        .delete()
        .eq("state_hash", stateHash)
        .gt("expires_at", new Date().toISOString())
        .select("user_id, encrypted_code_verifier")
        .maybeSingle();
      if (pendingError || !pending) return siteRedirect("error", "invalid_or_expired_state");
      const verifier = await decrypt(pending.encrypted_code_verifier);
      const tokenResponse = await fetch("https://api.etsy.com/v3/public/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: ETSY_CLIENT_ID, redirect_uri: ETSY_REDIRECT_URI, code, code_verifier: verifier }) });
      if (!tokenResponse.ok) return siteRedirect("error", "etsy_token_exchange_failed");
      const token = await tokenResponse.json(); if (!token.access_token || !token.refresh_token) return siteRedirect("error", "invalid_token_response");
      const expiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000).toISOString();
      const { error: saveError } = await supabase.from("narativa_etsy_connections").upsert({ user_id: pending.user_id, vendor: "etsy", status: "connected", encrypted_access_token: await encrypt(token.access_token), encrypted_refresh_token: await encrypt(token.refresh_token), token_expires_at: expiresAt, scopes: ["shops_r", "listings_r"], connected_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_error: null }, { onConflict: "user_id,vendor" });
      if (saveError) return siteRedirect("error", "token_storage_failed"); return siteRedirect("connected");
    }
    if (req.method !== "POST") return json({ error: "Metode tidak didukung." }, 405);
    if (!allowedOrigin(req)) return json({ error: "Origin tidak diizinkan." }, 403);
    const user = await requireUser(req); const body = await req.json().catch(() => ({}));
    if (body.action === "start") {
      const state = base64url(crypto.getRandomValues(new Uint8Array(32))); const verifier = base64url(crypto.getRandomValues(new Uint8Array(48))); const challenge = await sha256(verifier);
      const { error } = await supabase.from("narativa_etsy_oauth_states").insert({ state_hash: await sha256(state), user_id: user.id, encrypted_code_verifier: await encrypt(verifier), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
      if (error) throw error;
      const authorization = new URL("https://www.etsy.com/oauth/connect");
      authorization.searchParams.set("response_type", "code"); authorization.searchParams.set("client_id", ETSY_CLIENT_ID); authorization.searchParams.set("redirect_uri", ETSY_REDIRECT_URI); authorization.searchParams.set("scope", "shops_r listings_r"); authorization.searchParams.set("state", state); authorization.searchParams.set("code_challenge", challenge); authorization.searchParams.set("code_challenge_method", "S256");
      return json({ authorization_url: authorization.toString() });
    }
    if (body.action === "status") return json(await refreshIfNeeded(user.id));
    if (body.action === "disconnect") { const { error } = await supabase.from("narativa_etsy_connections").delete().eq("user_id", user.id).eq("vendor", "etsy"); if (error) throw error; return json({ status: "not_connected" }); }
    return json({ error: "Aksi tidak dikenal." }, 400);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan internal." }, 400); }
});
