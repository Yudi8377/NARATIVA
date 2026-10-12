import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const check = (name, ok, detail) => {
  if (ok) console.log('PASS ' + name);
  else failures.push('FAIL ' + name + ': ' + detail);
};
const read = p => readFileSync(join(root, p), 'utf8');
const requiredFunctions = [
  ['supabase/functions/ai-mentor/index.ts', 'AI Mentor'],
  ['supabase/functions/publish-work/index.ts', 'Publish Work'],
  ['supabase/functions/production-engine/index.ts', 'Production Engine'],
  ['supabase/functions/admin-console/index.ts', 'Admin Console']
];
for (const [path, label] of requiredFunctions) {
  const src = read(path);
  check(label + ' authenticates bearer tokens', /Authorization.*Bearer|Bearer/.test(src) && /auth\.getUser/.test(src), 'Expected bearer token validation and auth.getUser call');
  check(label + ' uses server-side secrets', /Deno\.env\.get\(["']SUPABASE_SERVICE_ROLE_KEY["']\)/.test(src), 'Expected service role key to be read from server environment');
  check(label + ' has bounded request method handling', /req\.method\s*!==?\s*["']POST["']/.test(src) || /req\.method\s*===?\s*["']POST["']/.test(src), 'Expected explicit HTTP method handling');
}
const migrationsDir = join(root, 'supabase/migrations');
const migrations = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
const production = read('supabase/migrations/20261012020535_narativa_production_jobs.sql');
check('Production jobs table enables RLS', /alter table public\.production_jobs enable row level security/i.test(production), 'RLS must be enabled');
check('Production jobs limited to owner reads', /create policy production_jobs_read_owner[\s\S]*?for select to authenticated using \(owner_id = \(select auth\.uid\(\)\)\)/i.test(production), 'Expected owner-scoped authenticated select policy');
check('Production jobs deny browser writes', /revoke all on table public\.production_jobs from anon, authenticated, public/i.test(production), 'Expected grants revoked from public browser roles');
check('Migration history exists', migrations.length > 0, 'No SQL migrations found');
const sqlAll = migrations.map(f => readFileSync(join(migrationsDir, f), 'utf8')).join('\n');
check('No migration embeds common privileged key literals', !/(?:sb_secret_[A-Za-z0-9_-]{12,}|sk_live_[A-Za-z0-9]{12,})/.test(sqlAll), 'Possible credential literal found in SQL migrations');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Supabase security contract checks passed. These static checks do not replace live authorization tests or a penetration test.');
