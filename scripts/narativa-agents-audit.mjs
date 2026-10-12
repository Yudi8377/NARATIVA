import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.cwd();
const site = join(root, 'website');
const reportDir = join(root, 'artifacts');
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'vendor') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(site);
const htmlFiles = files.filter(f => extname(f) === '.html');
const jsFiles = files.filter(f => extname(f) === '.js' && !relative(root, f).includes('vendor/'));
const checks = [];
const add = (agent, level, message, file = '') => checks.push({ agent, level, message, file: file ? relative(root, file).replaceAll('\\', '/') : '' });
const read = f => readFileSync(f, 'utf8');
const base = 'https://yudi8377.github.io/NARATIVA/';
const sitemapPath = join(site, 'sitemap.xml');
const robotsPath = join(site, 'robots.txt');
const sitemap = readFileSync(sitemapPath, 'utf8');
const robots = readFileSync(robotsPath, 'utf8');

// Agent 1 — SEO and discoverability
for (const f of htmlFiles) {
  const html = read(f);
  const name = relative(site, f).replaceAll('\\', '/');
  if (!/<html[^>]+lang=["'][a-z]{2}/i.test(html)) add('SEO', 'WARN', 'HTML language is missing or unclear', f);
  if (!/<title>[^<]{8,100}<\/title>/i.test(html)) add('SEO', 'WARN', 'Missing or weak title tag', f);
  if (!/<meta\s+name=["']description["'][^>]+content=["'][^"']{50,170}["']/i.test(html)) add('SEO', 'WARN', 'Missing or non-ideal meta description (target 50–170 chars)', f);
  if (!/<meta\s+name=["']robots["'][^>]*noindex/i.test(html) && !/<link[^>]+rel=["']canonical["']/i.test(html)) add('SEO', 'WARN', 'Canonical URL not declared; duplicate URL risk', f);
  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) add('SEO', 'WARN', 'Open Graph title missing', f);
  if (!/<meta[^>]+property=["']og:description["']/i.test(html)) add('SEO', 'WARN', 'Open Graph description missing', f);
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html) && sitemap.includes(base + name)) add('SEO', 'FAIL', 'Noindex page must not be in sitemap', f);
}
if (!sitemap.includes('<urlset') || !sitemap.includes(base)) add('SEO', 'FAIL', 'Sitemap missing or malformed');
for (const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
  if (!match[1].startsWith(base)) add('SEO', 'FAIL', 'Sitemap contains a URL outside the canonical site: ' + match[1]);
}
if (!/Sitemap:\s*https:\/\/yudi8377\.github\.io\/NARATIVA\/sitemap\.xml/i.test(robots)) add('SEO', 'FAIL', 'robots.txt does not advertise sitemap');

// Agent 2 — security and privacy hygiene (static checks only; not a penetration test)
for (const f of files.filter(f => /\.(html|js|json|xml|txt|mjs)$/.test(f))) {
  const content = read(f);
  if (/(?:service_role|sb_secret_[A-Za-z0-9_-]{12,}|sk_live_[A-Za-z0-9]{12,})/.test(content)) add('SECURITY', 'FAIL', 'Possible privileged key/token literal detected', f);
  if (/https?:\/\/(?:github\.com\/Yudi8377\/NARATIVA\/(?:actions|blob|tree)|api\.github\.com\/repos\/Yudi8377\/NARATIVA)/i.test(content) && f.startsWith(site)) add('SECURITY', 'WARN', 'Internal source/workflow URL exposed in public site content', f);
  if (/<a\b(?![^>]*\brel=)[^>]*target=["']_blank["']/i.test(content)) add('SECURITY', 'WARN', 'target=_blank link without rel protection', f);
}
if (!/Disallow:\s*\/admin\.html/i.test(robots)) add('SECURITY', 'WARN', 'robots.txt should discourage crawling admin page');

// Agent 3 — performance and resilience
for (const f of htmlFiles) {
  const html = read(f);
  if (html.length > 250_000) add('PERFORMANCE', 'WARN', 'HTML document exceeds 250 KB; consider splitting/defering content', f);
  if (/<script(?![^>]*(?:defer|async|type=["']module["']))[^>]*src=/i.test(html)) add('PERFORMANCE', 'WARN', 'Render-blocking external script detected', f);
  if (/<img(?![^>]*\balt=)[^>]*>/i.test(html)) add('ACCESSIBILITY', 'WARN', 'Image missing alt attribute', f);
}

// Agent 4 — core functional assets
for (const f of jsFiles) if (read(f).trim().length === 0) add('FUNCTIONAL', 'WARN', 'Empty JavaScript asset', f);
if (!htmlFiles.some(f => f.endsWith('index.html'))) add('FUNCTIONAL', 'FAIL', 'Homepage index.html missing');
if (!files.some(f => f.endsWith('reader-catalog.js'))) add('FUNCTIONAL', 'FAIL', 'Reader catalog script missing');
if (!files.some(f => f.endsWith('library/index.html'))) add('FUNCTIONAL', 'FAIL', 'Public library page missing');

const summary = {
  generatedAt: new Date().toISOString(),
  mode: 'static multi-agent audit; no production mutation',
  agents: ['SEO', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY', 'FUNCTIONAL'],
  scanned: { html: htmlFiles.length, javascript: jsFiles.length, websiteFiles: files.length },
  totals: { warn: checks.filter(x => x.level === 'WARN').length, fail: checks.filter(x => x.level === 'FAIL').length },
  checks
};
const md = [
  '# NARATIVA Autonomous Quality Report',
  '',
  'Generated: ' + summary.generatedAt,
  '',
  'Scope: static checks only. This is not a live load test, full penetration test, or proof of production security.',
  '',
  '| Metric | Count |',
  '|---|---:|',
  '| HTML pages | ' + summary.scanned.html + ' |',
  '| JavaScript files | ' + summary.scanned.javascript + ' |',
  '| Website files | ' + summary.scanned.websiteFiles + ' |',
  '| Warnings | ' + summary.totals.warn + ' |',
  '| Failures | ' + summary.totals.fail + ' |',
  '',
  '## Findings',
  ...(checks.length ? checks.map(c => '- **' + c.level + ' · ' + c.agent + '** ' + c.message + (c.file ? ' — ' + c.file : '')) : ['- No findings from configured static checks.']),
  '',
  '## Safe autonomy policy',
  'Agents may scan, test, measure, and report. They do not auto-publish code, change permissions, run destructive database operations, or rewrite production content without a reviewed change.'
].join('\n');
mkdirSync(reportDir, { recursive: true });
writeFileSync(join(reportDir, 'narativa-quality-report.json'), JSON.stringify(summary, null, 2) + '\n');
writeFileSync(join(reportDir, 'narativa-quality-report.md'), md + '\n');
console.log(md);
if (summary.totals.fail > 0) process.exitCode = 1;
