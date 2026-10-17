// The checks added in 0.3: AI search readiness, layout and typography, template signs, motion, page health, DESIGN.md drift.
process.env.AISLOPMETER_BROWSER ??= 'off';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanHtml, scanTarget } from '../src/index.js';
import { robotsAllows, siteChecks, jsonLd, pageChecks, readiness, realText } from '../src/aeo.js';
import { parseDesignSpec } from '../src/designspec.js';
import { corpusFromHtml } from '../src/corpus/html.js';

const ids = (r) => r.findings.filter((f) => f.pts > 0).map((f) => f.id);
const prose = (n) => Array.from({ length: n }, (_, i) => `<p>On ${i + 3} March 2024 we moved the bakery on Moda Street to a bigger oven, which now bakes ${40 + i} loaves an hour for the cafés in Kadıköy.</p>`).join('');
const page = (body, head = '') => `<!doctype html><html lang="en"><head><title>Test</title>${head}</head><body>${body}</body></html>`;

test('template signs from classes and CSS: grid background, hairline shadow, eyebrows, giant hero', async () => {
  const css = '<style>.hero-bg{background-image:linear-gradient(to right,#8881 1px,transparent 1px),linear-gradient(to bottom,#8881 1px,transparent 1px);background-size:40px 40px}</style>';
  const card = '<div class="rounded-2xl border border-white/10 shadow-2xl p-6"><p>x</p></div>';
  const eye = (s) => `<p class="text-xs uppercase tracking-widest text-violet-400">${s}</p>`;
  const body = `<div class="hero-bg"><h1 class="text-8xl font-bold">Ship faster</h1></div>${eye('Features')}<h2>All you need</h2>${eye('Pricing')}<h2>Plans</h2>${eye('FAQ')}<h2>Questions</h2>${card.repeat(3)}${prose(4)}`;
  const got = ids(await scanHtml(page(body, css)));
  for (const id of ['grid-background', 'hairline-shadow', 'eyebrow-labels', 'giant-hero']) assert.ok(got.includes(id), `${id} missing: ${got.join(' ')}`);
});

test('motion tells: bounce, pulsing dot, marquee, layout animation', async () => {
  const css = '<style>.drawer{transition:width .3s ease}@keyframes marquee{to{transform:translateX(-50%)}}</style>';
  const body = `<span class="relative flex h-2 w-2"><span class="animate-ping absolute rounded-full"></span></span><div class="animate-bounce">↓</div><div class="flex animate-marquee"><img alt="a"><img alt="b"></div>${prose(4)}`;
  const r = await scanHtml(page(body, css));
  const f = r.findings.find((x) => x.id === 'motion-tells');
  assert.ok(f, ids(r).join(' '));
  assert.ok(f.pts >= 3, `pts ${f.pts}`);
  // one deliberate overshoot on a gauge needle is not a habit
  const one = await scanHtml(page(prose(5), '<style>.needle{transition:transform 1s cubic-bezier(.3,1.35,.5,1)}</style>'));
  assert.ok(!ids(one).includes('motion-tells'));
});

const VIS = (layout = {}, extra = {}) => ({
  v: 1, viewport: [1366, 900], background: { color: '#ffffff', luminance: 1 }, darkScheme: false, fonts: {}, contrast: { checked: 0, failed: 0, worst: [] },
  centred: { blocks: 0, centred: 0 }, cards: { groups: 0, cards: 0, samples: [] }, gradients: [], gradientText: 0, radius: { big: 0, boxes: 0 }, glows: 0,
  signs: { gridBg: 0, hairline: 0, eyebrows: 0, eyebrowSamples: [], numbered: 0, pulsingDots: 0, marquees: 0 }, brokenImages: [], jsErrors: [],
  layout: { paragraphs: 10, longLines: { n: 0, samples: [] }, tinyText: { n: 0, samples: [] }, tightLeading: { n: 0, samples: [] }, justified: { n: 0, samples: [] }, edge: { n: 0, samples: [] }, spill: { n: 0, samples: [], page: false, pageWidth: 1366 }, covered: { n: 0, samples: [] }, cramped: { n: 0, samples: [] }, nested: { n: 0, samples: [] }, hierarchy: { body: 17, h1: 44, h2: 30 }, ...layout },
  ...extra,
});

test('measured layout and health problems become findings', async () => {
  const s = (n, x = {}) => ({ n, samples: [{ text: 'sample', ...x }] });
  const visual = VIS({
    longLines: s(6, { chars: 140 }), tinyText: s(5, { size: 12 }), tightLeading: s(5, { ratio: 1.05 }), justified: s(3),
    edge: s(4, { left: 0 }), spill: { ...s(2, { by: 400 }), page: true, pageWidth: 1800 }, covered: s(2, { by: 'img' }), cramped: s(3, { pad: 2 }), nested: s(2), hierarchy: { body: 12, h1: 14, h2: 12.5 },
  }, { jsErrors: ['TypeError: Cannot read properties of null'], brokenImages: ['https://x.test/hero.png'] });
  const got = ids(await scanHtml(page(prose(5)), { visual }));
  for (const id of ['long-lines', 'tiny-text', 'tight-leading', 'justified-text', 'overflow', 'text-covered', 'edge-text', 'cramped', 'nested-cards', 'flat-hierarchy', 'js-errors', 'broken-images']) assert.ok(got.includes(id), `${id} missing: ${got.join(' ')}`);
  const clean = ids(await scanHtml(page(prose(5)), { visual: VIS() }));
  assert.deepEqual(clean.filter((x) => /^(?:long-lines|tiny-text|tight-leading|justified-text|overflow|text-covered|edge-text|cramped|nested-cards|flat-hierarchy|js-errors|broken-images)$/.test(x)), []);
});

test('static readability fallbacks without a browser', async () => {
  const got = ids(await scanHtml(page(prose(5), '<style>body{font-size:12px;line-height:1.1}p{text-align:justify}article p{text-align:justify}</style>')));
  for (const id of ['tiny-text', 'tight-leading', 'justified-text']) assert.ok(got.includes(id), `${id}: ${got.join(' ')}`);
});

test('AI search readiness: robots.txt per crawler, JSON-LD, page checks, llms.txt', () => {
  const robots = 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nDisallow: /admin';
  assert.equal(robotsAllows(robots, 'GPTBot', '/'), false);
  assert.equal(robotsAllows(robots, 'OAI-SearchBot', '/'), true);
  assert.equal(robotsAllows(robots, 'ClaudeBot', '/admin/x'), false);
  // blocking a training crawler is fine; blocking a search crawler fails the check
  assert.equal(siteChecks({ robots }).find((c) => c.id === 'ai-crawlers').ok, true);
  assert.equal(siteChecks({ robots: 'User-agent: OAI-SearchBot\nDisallow: /' }).find((c) => c.id === 'ai-crawlers').ok, false);
  assert.equal(realText('<!doctype html><html>app</html>'), false);
  assert.equal(realText('# Kavruk\n\n> Small-batch coffee roastery in Eskişehir.'), true);
  const ld = jsonLd('<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"X"},{"@type":"WebSite"}]}</script>');
  assert.deepEqual(ld.types.sort(), ['Organization', 'WebSite']);
  const good = page(`<h1>Kavruk</h1>${prose(3)}`, '<meta name="description" content="Small-batch coffee roasted on Tuesdays and Fridays in Eskişehir."><meta property="og:title" content="Kavruk"><link rel="canonical" href="https://kavruk.coffee/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"CafeOrCoffeeShop","name":"Kavruk"}</script>');
  const checks = pageChecks(corpusFromHtml(good), { words: 80 });
  assert.ok(checks.filter((c) => !c.na).every((c) => c.ok), JSON.stringify(checks.filter((c) => !c.ok).map((c) => c.id)));
  const bad = pageChecks(corpusFromHtml(page('<div id="root"></div>')), { words: 0, serverShell: true });
  const rd = readiness([...bad, ...siteChecks({ robots: null, llms: null, sitemap: null })]);
  assert.ok(rd.score < 40, `score ${rd.score}`);
  assert.equal(bad.find((c) => c.id === 'readable-without-js').ok, false);
});

test('readiness is attached to scans and does not change the slop score', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aeo-'));
  await writeFile(join(dir, 'index.html'), page(`<h1>Kavruk</h1>${prose(4)}`, '<meta name="description" content="Small-batch coffee roasted on Tuesdays and Fridays in Eskişehir.">'));
  await writeFile(join(dir, 'llms.txt'), '# Kavruk\n\n> Small-batch coffee roastery in Eskişehir.\n');
  await writeFile(join(dir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://kavruk.coffee/sitemap.xml\n');
  await writeFile(join(dir, 'sitemap.xml'), '<?xml version="1.0"?><urlset><url><loc>https://kavruk.coffee/</loc></url></urlset>');
  const r = await scanTarget(join(dir, 'index.html'), { render: 'never', config: false });
  assert.ok(r.aeo && r.aeo.total >= 8, JSON.stringify(r.aeo));
  for (const id of ['llms-txt', 'sitemap', 'ai-crawlers']) assert.equal(r.aeo.checks.find((c) => c.id === id).ok, true, id);
  const plain = await scanHtml(page(`<h1>Kavruk</h1>${prose(4)}`, '<meta name="description" content="Small-batch coffee roasted on Tuesdays and Fridays in Eskişehir.">'));
  assert.equal(plain.total, r.total);
});

test('DESIGN.md: parse the spec and flag colours, fonts and radii outside it', async () => {
  const spec = parseDesignSpec('# Design\n\n## Colours\n- Paper `#f5f4f0`\n- Ink `#1d1b18`\n- Stamp red `#b3262a`\n\n## Type\n- Headings: "Archivo"\n- Body: "Literata"\n\n## Radius\nCorners: 0px or 4px.\n');
  assert.ok(spec.colors.has('#b3262a') && spec.fonts.has('archivo') && spec.radii.has(4), JSON.stringify({ c: [...spec.colors], f: [...spec.fonts], r: [...spec.radii] }));
  const css = '<style>body{font-family:"Literata",serif;color:#1d1b18;background:#f5f4f0}.btn{background:#7c3aed;border-radius:12px;font-family:Inter,sans-serif}</style>';
  const r = await scanHtml(page(prose(4), css), { designSpec: spec });
  const f = r.findings.find((x) => x.id === 'design-drift');
  assert.ok(f, ids(r).join(' '));
  assert.ok(f.evidence.join(' ').includes('#7c3aed') && f.evidence.join(' ').includes('Inter') && f.evidence.join(' ').includes('12px'), f.evidence.join(' | '));
  const ok = await scanHtml(page(prose(4), '<style>body{font-family:"Literata",serif;color:#1d1b18;border-radius:4px}</style>'), { designSpec: spec });
  assert.ok(!ids(ok).includes('design-drift'));
});

test('a folder scan finds DESIGN.md by itself and does not score it as copy', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'spec-'));
  await writeFile(join(dir, 'DESIGN.md'), '# Design\nColours: `#f5f4f0`, `#1d1b18`.\nFonts: "Literata".\n');
  await writeFile(join(dir, 'index.html'), page(prose(5)));
  await writeFile(join(dir, 'style.css'), 'body{font-family:Poppins,sans-serif;color:#6366f1}');
  const r = await scanTarget(dir, { config: false });
  const f = r.findings.find((x) => x.id === 'design-drift');
  assert.ok(f, ids(r).join(' '));
  assert.ok(f.locations.some((l) => l.file === 'style.css'), JSON.stringify(f.locations));
});

test('what the owner keeps leaves the plan: "our purple is the brand"', async () => {
  const { buildRescuePlan, renderRescuePlan } = await import('../src/rescue.js');
  const body = '<section style="background:linear-gradient(135deg,#7c3aed,#4f46e5)"><h1>Ship faster</h1></section>' + prose(4);
  const r = await scanHtml(page(body));
  assert.ok(ids(r).includes('purple-gradient'), ids(r).join(' '));
  const plan = buildRescuePlan(r, { keep: 'Mor marka rengimiz ve logomuz kalsın' });
  const inSteps = plan.phases.flatMap((p) => p.steps || []).map((f) => f.id);
  assert.ok(!inSteps.includes('purple-gradient'), inSteps.join(' '));
  assert.deepEqual(plan.kept.map((f) => f.id), ['purple-gradient']);
  const md = renderRescuePlan(plan, { lang: 'tr' });
  assert.ok(md.includes('"disable": ["purple-gradient"]'), md.slice(0, 400));
  // without keep, it is in the plan
  const plan2 = buildRescuePlan(r, {});
  assert.ok(plan2.phases.flatMap((p) => p.steps || []).some((f) => f.id === 'purple-gradient'));
});

test('a solid brand purple is not slop by itself', async () => {
  const css = '<style>a.btn{background:#6b2d8f;color:#fff}h1,h2{color:#6b2d8f}</style>';
  const r = await scanHtml(page(`<h1>Moda Fırını</h1>${prose(5)}<a class="btn" href="/siparis">Sipariş ver</a>`, css));
  assert.ok(!ids(r).some((x) => /purple|palette/.test(x)), ids(r).join(' '));
  assert.ok(r.total < 20, `score ${r.total}`);
});
