import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const creator = read('../website/creator.html');
const reader = read('../website/reader.html');
const commerce = read('../website/commerce.html');
const admin = read('../website/admin.html');
const adminClient = read('../website/admin-console.js');
const adminFunction = read('../supabase/functions/admin-console/index.ts');
const adminMigration = read('../supabase/migrations/20261012015258_narativa_secure_admin_console.sql');
const commerceMigration = read('../supabase/migrations/20261012015602_narativa_commerce_catalog_ledger.sql');
const experiences = read('../website/experiences.js');
const failures = [];

function check(name, condition, detail) {
  if (!condition) failures.push(`FAIL ${name}: ${detail}`);
  else console.log(`PASS ${name}`);
}

check('Creator loads Supabase SDK before app logic',
  creator.indexOf('vendor/supabase.js') >= 0 && creator.indexOf('vendor/supabase.js') < creator.indexOf('experiences.js'),
  'Creator Studio must load the Supabase browser SDK before experiences.js.');
check('Reader loads Supabase SDK before app logic',
  reader.indexOf('vendor/supabase.js') >= 0 && reader.indexOf('vendor/supabase.js') < reader.indexOf('experiences.js'),
  'Reader Space must load the Supabase browser SDK before experiences.js.');
check('Creator saves canonical versions',
  /from\(['"]book_versions['"]\)\.insert/.test(experiences) && /canonical_content:\s*canonical/.test(experiences),
  'Saving must create a version with canonical_content.');
check('Creator publication is owner-scoped',
  /update\(\{\s*status:\s*['"]published['"]\s*\}\)\.eq\(['"]id['"],\s*book\.id\)\.eq\(['"]owner_id['"],\s*signedInUser\.id\)/.test(experiences),
  'Publication status update must be constrained to the current owner.');
check('Reader only fetches published books',
  /from\(['"]books['"]\)\.select\([^;]+?\)\.eq\(['"]status['"],\s*['"]published['"]\)/s.test(experiences),
  'Reader catalogue query must filter status=published.');
check('Reader resolves latest canonical version',
  /from\(['"]book_versions['"]\)\.select\(['"]canonical_content,version_number['"]\)\.eq\(['"]book_id['"],\s*book\.id\)\.order\(['"]version_number['"],\s*\{\s*ascending:\s*false\s*\}\)/.test(experiences),
  'Reader must use the latest saved version for each published work.');
check('Commerce uses a dedicated product table and discloses missing checkout',
  /from\(['\"]commerce_products['\"]\)/.test(experiences) && /Checkout, pembayaran, dan royalti masih menunggu integrasi server/i.test(experiences) && /Pesanan tersinkron/.test(commerce),
  'Commerce must persist product records separately and not imply payment processing is live.');
check('Commerce ledger is server-write-only with owner-scoped product access',
  /create table if not exists public\.commerce_orders/i.test(commerceMigration) && /create table if not exists public\.royalty_ledger/i.test(commerceMigration) && /commerce_products_read_active_or_owner/i.test(commerceMigration) && /revoke all on table public\.commerce_orders from anon, authenticated, public/i.test(commerceMigration),
  'Orders and royalties must be server-written, while product access remains owner-scoped.');
check('Admin console remains fail-closed',
  /PRIVILEGED ACCESS DISABLED/.test(admin) && /server-side/i.test(admin),
  'Admin UI must remain locked until server-side authorization exists.');
check('Admin page loads the secure console client after Supabase SDK',
  admin.indexOf('vendor/supabase.js') >= 0 && admin.indexOf('admin-console.js') > admin.indexOf('vendor/supabase.js'),
  'The secure admin client must load after the Supabase SDK.');
check('Admin function checks server-owned role and writes audit events',
  /auth\.getUser\(token\)/.test(adminFunction) && /from\(['\"]platform_admin_roles['\"]\)/.test(adminFunction) && /from\(['\"]platform_audit_events['\"]\)/.test(adminFunction),
  'Privileged metrics must require a server-owned role and create audit events.');
check('Admin governance tables are inaccessible to browser roles',
  /enable row level security/i.test(adminMigration) && /revoke all on table public\.platform_admin_roles from anon, authenticated, public/i.test(adminMigration),
  'Admin role table must be RLS-enabled and inaccessible to browser roles.');
check('Story pipeline requires explicit consent and a session',
  /if\s*\(!\$\('aiPermission'\)\.checked\)/.test(experiences) &&
  /if\s*\(!sessionData\.session\)/.test(experiences) &&
  /functions\.invoke\(['"]story-pipeline['"]/.test(experiences) &&
  /manuscript_processing_consent:\s*true/.test(experiences),
  'Naskah must not be sent to the pipeline without consent and an authenticated session.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('NARATIVA static production contracts passed.');
}
