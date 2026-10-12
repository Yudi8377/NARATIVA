const origin = 'https://yudi8377.github.io/NARATIVA/';
const pages = [
  { path: '', title: 'NARATIVA' },
  { path: 'spaces.html', title: 'NARATIVA' },
  { path: 'video.html', title: 'Video' },
  { path: 'reader.html', title: 'Ruang Pembaca' },
  { path: 'library/', title: 'Pustaka Pilihan' },
  { path: 'creator.html', title: 'Creator Studio' },
  { path: 'learning.html', title: 'Pembelajaran' }
];
const results = [];
const slowThresholdMs = 2500;
for (const page of pages) {
  let result = { url: new URL(page.path, origin).href, status: 0, ok: false, slow: false, elapsedMs: 0, reason: '' };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const start = Date.now();
    try {
      const response = await fetch(result.url, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'NARATIVA-Health-Agent/1.0' } });
      const body = await response.text();
      result.status = response.status;
      result.elapsedMs = Date.now() - start;
      const titleOk = /<title>[^<]+<\/title>/i.test(body);
      result.ok = response.ok && titleOk;
      result.slow = result.elapsedMs > slowThresholdMs;
      result.reason = !response.ok ? 'HTTP ' + response.status : !titleOk ? 'HTML title missing' : '';
      if (result.ok) break;
    } catch (error) {
      result.elapsedMs = Date.now() - start;
      result.reason = String(error?.name || 'network_error');
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
  }
  results.push(result);
  console.log((result.ok ? (result.slow ? 'WARN SLOW ' : 'PASS ') : 'FAIL ') + result.url + ' status=' + result.status + ' elapsed=' + result.elapsedMs + 'ms' + (result.reason ? ' reason=' + result.reason : ''));
}
const report = {
  generatedAt: new Date().toISOString(),
  origin,
  healthy: results.filter(r => r.ok).length,
  total: results.length,
  results
};
const { mkdirSync, writeFileSync } = await import('node:fs');
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/narativa-live-health.json', JSON.stringify(report, null, 2) + '\n');
writeFileSync('artifacts/narativa-live-health.md', [
  '# NARATIVA Live Health Check',
  '',
  'Generated: ' + report.generatedAt,
  '',
  '| Page | HTTP | Response | Status |',
  '|---|---:|---:|---|',
  ...results.map(r => '| ' + r.url + ' | ' + r.status + ' | ' + r.elapsedMs + ' ms | ' + (r.ok ? 'PASS' : 'FAIL ' + r.reason) + ' |')
].join('\n') + '\n');
if (report.healthy !== report.total) process.exitCode = 1;
