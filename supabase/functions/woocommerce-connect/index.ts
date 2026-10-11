import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("CONNECTOR_TOKEN_ENCRYPTION_KEY") || "";
const SITE_ORIGIN = new URL(Deno.env.get("NARATIVA_SITE_URL") || "https://yudi8377.github.io/NARATIVA").origin;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const cors = { "Access-Control-Allow-Origin": SITE_ORIGIN, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function b64u(bytes: Uint8Array) { let s = ""; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromB64u(s: string) { const n=s.replace(/-/g,"+").replace(/_/g,"/"); return Uint8Array.from(atob(n+"=".repeat((4-n.length%4)%4)),c=>c.charCodeAt(0)); }
function keyBytes() {
  if (!ENCRYPTION_KEY) throw new Error("connector_encryption_not_configured");
  if (/^[a-f0-9]{64}$/i.test(ENCRYPTION_KEY)) return new Uint8Array(ENCRYPTION_KEY.match(/.{2}/g)!.map(x=>parseInt(x,16)));
  const n=ENCRYPTION_KEY.replace(/-/g,"+").replace(/_/g,"/");
  const b=Uint8Array.from(atob(n+"=".repeat((4-n.length%4)%4)),c=>c.charCodeAt(0));
  if (b.length!==32) throw new Error("connector_encryption_key_invalid");
  return b;
}
async function cryptoKey() { const raw=keyBytes(); if(raw.length!==32) throw new Error("connector_encryption_key_invalid"); return crypto.subtle.importKey("raw",raw,"AES-GCM",false,["encrypt","decrypt"]); }
async function encrypt(s:string) { const iv=crypto.getRandomValues(new Uint8Array(12)); const c=await crypto.subtle.encrypt({name:"AES-GCM",iv},await cryptoKey(),new TextEncoder().encode(s)); return b64u(new Uint8Array([...iv,...new Uint8Array(c)])); }
async function decrypt(s:string) { const b=fromB64u(s); const p=await crypto.subtle.decrypt({name:"AES-GCM",iv:b.slice(0,12)},await cryptoKey(),b.slice(12)); return new TextDecoder().decode(p); }
async function requireUser(req:Request) { const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]; if(!token) throw new Error("authentication_required"); const {data,error}=await db.auth.getUser(token); if(error||!data.user) throw new Error("authentication_invalid"); return data.user; }
function normalizeStoreUrl(raw:unknown) {
  if(typeof raw!=="string"||raw.length>300) throw new Error("store_url_invalid");
  let u:URL; try { u=new URL(raw.trim()); } catch { throw new Error("store_url_invalid"); }
  const host=u.hostname.toLowerCase();
  if(u.protocol!=="https:"||u.username||u.password||u.port && u.port!=="443"||u.search||u.hash) throw new Error("store_url_must_be_https_origin");
  if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal")||host==="metadata.google.internal"||/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||host.includes(":")) throw new Error("store_host_not_allowed");
  if(!host.includes(".")||host==="example.com") throw new Error("store_host_invalid");
  u.pathname=u.pathname.replace(/\/+$/,"");
  return u.toString().replace(/\/$/,"");
}
async function verifyWoo(creds:{store_url:string;consumer_key:string;consumer_secret:string}) {
  const endpoint=creds.store_url+"/wp-json/wc/v3/products?per_page=1&context=view";
  const auth=btoa(creds.consumer_key+":"+creds.consumer_secret);
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),10000);
  let response:Response;
  try { response=await fetch(endpoint,{method:"GET",headers:{Authorization:"Basic "+auth,Accept:"application/json"},redirect:"manual",signal:controller.signal}); }
  catch { clearTimeout(timer); throw new Error("provider_unreachable"); }
  clearTimeout(timer);
  if(response.status>=300&&response.status<400) throw new Error("provider_redirect_blocked");
  if(response.status===401||response.status===403) throw new Error("provider_credentials_rejected");
  if(!response.ok) throw new Error("provider_api_error");
  const data=await response.json().catch(()=>null);
  if(!Array.isArray(data)) throw new Error("provider_response_invalid");
  return {capabilities:["catalog_read"],sample_count:data.length,verified_at:new Date().toISOString()};
}
function safeCode(e:unknown) { const m=e instanceof Error?e.message:"internal_error"; return /^[a-z0-9_]+$/.test(m)?m:"internal_error"; }
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return req.headers.get("Origin") && req.headers.get("Origin")!==SITE_ORIGIN ? new Response("Origin tidak diizinkan",{status:403}) : new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"method_not_allowed"},405);
  if(req.headers.get("Origin") && req.headers.get("Origin")!==SITE_ORIGIN) return json({error:"origin_not_allowed"},403);
  try {
    const user=await requireUser(req);
    const body=await req.json().catch(()=>({}));
    const action=body?.action;
    if(!["configure","status","disconnect"].includes(action)) return json({error:"action_not_supported"},400);
    if(action==="disconnect") {
      const {error}=await db.from("narativa_connector_connections").delete().eq("user_id",user.id).eq("vendor","woocommerce");
      if(error) throw new Error("database_error");
      return json({vendor:"woocommerce",status:"not_connected"});
    }
    if(action==="configure") {
      const store_url=normalizeStoreUrl(body.store_url);
      const consumer_key=typeof body.consumer_key==="string"?body.consumer_key.trim():"";
      const consumer_secret=typeof body.consumer_secret==="string"?body.consumer_secret.trim():"";
      if(!/^ck_[a-f0-9]{32,}$/i.test(consumer_key)||!/^cs_[a-f0-9]{32,}$/i.test(consumer_secret)) return json({error:"woocommerce_key_format_invalid"},400);
      const credentials={store_url,consumer_key,consumer_secret};
      const verification=await verifyWoo(credentials);
      const encrypted_credentials=await encrypt(JSON.stringify(credentials));
      const host=new URL(store_url).hostname;
      const now=new Date().toISOString();
      const {error}=await db.from("narativa_connector_connections").upsert({user_id:user.id,vendor:"woocommerce",status:"connected",account_label:host,encrypted_credentials,capabilities:verification.capabilities,last_verified_at:verification.verified_at,last_error_code:null,updated_at:now},{onConflict:"user_id,vendor"});
      if(error) throw new Error("database_error");
      return json({vendor:"woocommerce",status:"connected",account_label:host,capabilities:verification.capabilities,last_verified_at:verification.verified_at,verified_resource:"products_read",sample_count:verification.sample_count});
    }
    const {data:row,error}=await db.from("narativa_connector_connections").select("encrypted_credentials,account_label,status,capabilities,last_verified_at").eq("user_id",user.id).eq("vendor","woocommerce").maybeSingle();
    if(error) throw new Error("database_error");
    if(!row) return json({vendor:"woocommerce",status:"not_connected",capabilities:[]});
    try {
      const creds=JSON.parse(await decrypt(row.encrypted_credentials));
      const verification=await verifyWoo(creds);
      await db.from("narativa_connector_connections").update({status:"connected",capabilities:verification.capabilities,last_verified_at:verification.verified_at,last_error_code:null,updated_at:new Date().toISOString()}).eq("user_id",user.id).eq("vendor","woocommerce");
      return json({vendor:"woocommerce",status:"connected",account_label:row.account_label,capabilities:verification.capabilities,last_verified_at:verification.verified_at,verified_resource:"products_read",sample_count:verification.sample_count});
    } catch(e) {
      const code=safeCode(e);
      await db.from("narativa_connector_connections").update({status:"action_required",last_error_code:code,updated_at:new Date().toISOString()}).eq("user_id",user.id).eq("vendor","woocommerce");
      return json({vendor:"woocommerce",status:"action_required",account_label:row.account_label,capabilities:[],error:code});
    }
  } catch(e) {
    const code=safeCode(e);
    const status=code.startsWith("authentication")?401:code==="connector_encryption_not_configured"||code==="connector_encryption_key_invalid"?503:400;
    return json({error:code},status);
  }
});