// the default suite runs without a browser so results do not depend on the machine
process.env.AISLOPMETER_BROWSER ??= 'off';
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

test('.aislopmeter.json turns checks off and sets the language', async () => {
  const { scanTarget, badgeJson } = await import('../src/index.js');
  const dir = await mkdtemp(join(tmpdir(), 'aislopmeter-cfg-'));
  await writeFile(join(dir, 'index.html'), '<h1>Supercharge your workflow</h1><p>Unlock seamless synergy and elevate your team with our cutting-edge platform.</p><button>Get started</button>');
  await writeFile(join(dir, '.aislopmeter.json'), JSON.stringify({ disable: ['headline-formula'], lang: 'tr', keep: 'logo' }));
  const r = await scanTarget(join(dir, 'index.html'));
  assert.ok(!r.findings.some((f) => f.id === 'headline-formula'));
  assert.equal(r.config.lang, 'tr');
  assert.deepEqual(r.config.disable, ['headline-formula']);
  assert.match(badgeJson(r).message, /^\d+\/100$/);
});

test('a Next.js project: no false alarms from repo notes, code comments, style values or spreads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aislopmeter-next-'));
  await mkdir(join(dir, 'src', 'app'), { recursive: true });
  await mkdir(join(dir, 'messages'));
  await writeFile(join(dir, 'BACKLOG.md'), '- [x] Hero — 460x650 mobile, 40% taller\n- [x] Player — 25% higher\n- [x] Cards — 3x faster');
  await writeFile(join(dir, 'PROJECT-ISSUES.md'), '- Search — 50% slower — 10x more requests');
  await writeFile(join(dir, 'next.config.ts'), '/**\n * Body images are rendered as a plain `<img>`, not next/image.\n */\nexport default {};\n// a plain <img> on purpose\n');
  await writeFile(join(dir, 'src', 'cache.ts'), 'export const key = (namespace: string, ...parts: string[]) => [namespace, ...parts].join(":");\nconst x = [name].length;\n');
  await writeFile(join(dir, 'src', 'app', 'robots.ts'), 'export default function robots() { return { rules: [{ userAgent: "*", allow: "/" }, { userAgent: ["AhrefsBot"], disallow: "/" }] }; }\n');
  await writeFile(join(dir, 'src', 'app', 'layout.tsx'), [
    'export async function generateMetadata() {',
    '  const description = t("tagline");',
    '  return { title: "Kaya Bakery: sourdough on Moda Street", description };',
    '}',
    'export default function Layout({ children }) {',
    '  return <div style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)" }}><h1>Kaya Bakery</h1><p>Sourdough from 7am at 14 Moda Street, closed Mondays.</p>{children}</div>;',
    '}',
  ].join('\n'));
  await writeFile(join(dir, 'messages', 'ru.json'), JSON.stringify({ a: 'Единственный способ входа — через Google.', b: 'Пусто — видео целиком.', c: 'Москва — столица России.', d: 'Хлеб — с семи утра.' }));
  const r = await scanProject(dir);
  const found = r.findings.map((f) => f.id);
  for (const id of ['vanity', 'missing-alt', 'placeholder', 'em-dash']) assert.ok(!found.includes(id), `false alarm: ${id}`);
  const aeo = Object.fromEntries(r.aeo.checks.map((c) => [c.id, c]));
  assert.equal(aeo['title-description'].ok, true, aeo['title-description'].detail.en);
  assert.match(aeo['ai-crawlers'].detail.en, /src\/app\/robots\.ts/);
});

test('robots.ts that names an AI search crawler is flagged', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aislopmeter-robots-'));
  await mkdir(join(dir, 'app'));
  await writeFile(join(dir, 'app', 'robots.ts'), 'export default function robots() { return { rules: [{ userAgent: "OAI-SearchBot", disallow: "/" }] }; }\n');
  await writeFile(join(dir, 'app', 'page.tsx'), 'export default () => <p>Sourdough from 7am at 14 Moda Street, closed Mondays.</p>;\n');
  const r = await scanProject(dir);
  assert.equal(r.aeo.checks.find((c) => c.id === 'ai-crawlers').ok, false);
});
