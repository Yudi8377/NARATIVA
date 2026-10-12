import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const creator = read('../website/creator.html');
const reader = read('../website/reader.html');
const commerce = read('../website/commerce.html');
const admin = read('../website/admin.html');
const experiences = read('../website/experiences.js');
const storyPipeline = read('../supabase/functions/woocommerce-connect/index.ts');
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
check('Commerce labels metadata versus transactions',
  /transaksi dan vendor belum terhubung/i.test(experiences) && /Pesanan tersinkron/.test(commerce),
  'Commerce must not present metadata catalog as completed transaction processing.');
check('Admin console remains fail-closed',
  /PRIVILEGED ACCESS DISABLED/.test(admin) && /server-side/i.test(admin),
  'Admin UI must remain locked until server-side authorization exists.');
check('Production pipeline is not misrepresented as media generation',
  /deterministic-planning-scaffold/.test(read('../supabase/functions/story-pipeline/index.ts')) === false,
  'This check is intentionally a repository guard only when the story pipeline source is versioned locally.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('NARATIVA static production contracts passed.');
}
