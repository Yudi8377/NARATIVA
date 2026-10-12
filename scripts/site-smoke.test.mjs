import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.cwd();
const site = join(root, 'website');
const htmlFiles = [];
const allFiles = [];
function walk(dir) {
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) walk(full);
    else {
      allFiles.push(full);
      if (extname(full).toLowerCase() === '.html') htmlFiles.push(full);
    }
  }
}
walk(site);
const known = new Set(allFiles.map(f => '/' + relative(site, f).replaceAll('\\', '/')));
const failures = [];
let checkedLinks = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const source = '/' + relative(site, file).replaceAll('\\', '/');
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"'#]+)["']/gi)) {
    const raw = m[1].trim();
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(raw)) continue;
    const pathPart = raw.split(/[?#]/, 1)[0];
    if (!pathPart) continue;
    let resolved;
    if (pathPart.startsWith('/')) resolved = pathPart;
    else resolved = source.slice(0, source.lastIndexOf('/') + 1) + pathPart;
    const pieces = [];
    for (const p of resolved.split('/')) {
      if (!p || p === '.') continue;
      if (p === '..') pieces.pop();
      else pieces.push(p);
    }
    resolved = '/' + pieces.join('/');
    const options = [resolved];
    if (resolved.endsWith('/')) options.push(resolved + 'index.html');
    if (!/\.[a-z0-9]+$/i.test(resolved)) options.push(resolved + '/index.html', resolved + '.html');
    checkedLinks++;
    if (!options.some(p => known.has(p))) failures.push(source + ' -> ' + raw + ' (not found: ' + options.join(', ') + ')');
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(source + ': missing title');
  if (!/<meta\s+name=["']description["']/i.test(html)) failures.push(source + ': missing description');
  if (/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi.test(html)) {
    // External script availability is intentionally not tested by this offline smoke test.
  }
}
const sitemap = readFileSync(join(site, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const url = m[1];
  const path = new URL(url).pathname.replace(/^\/NARATIVA/, '') || '/';
  const relativePath = path.startsWith('/') ? path.slice(1) : path;
  const candidate = relativePath ? join(site, relativePath) : join(site, 'index.html');
  const asDirectory = join(candidate, 'index.html');
  try { if (!statSync(candidate).isFile() && !statSync(asDirectory).isFile()) failures.push('Sitemap URL does not map to a local file: ' + url); }
  catch { failures.push('Sitemap URL does not map to a local file: ' + url); }
}
console.log('NARATIVA site smoke test: ' + htmlFiles.length + ' HTML pages, ' + checkedLinks + ' internal asset/page references checked.');
if (failures.length) {
  console.error(failures.map(f => 'FAIL ' + f).join('\n'));
  process.exitCode = 1;
} else console.log('PASS internal references, page titles/descriptions, and sitemap mapping.');
