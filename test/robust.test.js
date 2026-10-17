import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanHtml, scanProject, renderHtml } from '../src/index.js';

test('handles markup without <html>/<body> and empty input', async () => {
  const frag = await scanHtml('<h1>Bakery on Moda Street</h1><p>Sourdough from 7am. Closed Mondays.</p>');
  assert.ok(frag.words >= 8, `fragment words: ${frag.words}`);
  const empty = await scanHtml('');
  assert.equal(typeof empty.total, 'number');
});

test('long single-line blobs scan quickly (no regex backtracking)', async () => {
  const blob = '<p>' + 'a'.repeat(200000) + ' ' + 'x.'.repeat(50000) + ' ' + 'Ab'.repeat(40000) + '</p>';
  const t0 = Date.now();
  await scanHtml(blob);
  assert.ok(Date.now() - t0 < 4000, `took ${Date.now() - t0}ms`);
});

test('a label containing </script> cannot break out of the report script', async () => {
  const r = await scanHtml('<p>Hello</p>', { url: 'https://x.test/</script><script>alert(1)</script>' });
  const html = renderHtml({ ...r, id: 's1', display: 'x</script><img src=x onerror=alert(1)>' }, { lang: 'en' });
  const scripts = html.split('<script').length - 1;
  const closes = html.split('</script>').length - 1;
  assert.equal(scripts, closes);
  assert.ok(!html.includes('<img src=x onerror'));
});

test('form placeholders and a repeated brand word are not penalised', async () => {
  const r = await scanHtml('<form><input placeholder="[Your name]"><textarea placeholder="Your company"></textarea></form><p>Seamless Doors Ltd. Seamless Doors fits sliding doors in Leeds since 1998. Call 0113 496 0000.</p>');
  const ids = r.findings.map((f) => f.id);
  assert.ok(!ids.includes('placeholder'), ids.join(','));
  assert.ok(!ids.includes('lexicon'), ids.join(','));
});

test('project scans skip repo docs at the root and honour --ignore spellings', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aislopmeter-'));
  await mkdir(join(dir, 'docs'));
  await mkdir(join(dir, 'legacy'));
  await mkdir(join(dir, 'src'));
  const slop = '<h1>Unlock seamless synergy</h1><p>Elevate your workflow with our cutting-edge, game-changing platform. Delve into a robust tapestry of innovation.</p>';
  await writeFile(join(dir, 'README.md'), '# Unlock seamless synergy\n\nElevate your workflow with our cutting-edge, game-changing platform.');
  await writeFile(join(dir, 'docs', 'index.html'), slop);
  await writeFile(join(dir, 'legacy', 'old.html'), slop);
  await writeFile(join(dir, 'src', 'index.html'), '<h1>Kaya Bakery</h1><p>Sourdough from 7am at 14 Moda Street.</p>');
  const r = await scanProject(dir, { ignore: ['./legacy/'] });
  assert.equal(r.files, 1);
  assert.ok(!r.findings.some((f) => f.id === 'lexicon'));
});
