import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanHtml, scanProject, scanTarget, buildRescuePlan, renderRescuePlan, renderReport } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (p) => join(here, 'fixtures', p);
const now = new Date('2026-10-17');
const ids = (r) => r.findings.filter((f) => f.kind === 'issue').map((f) => f.id);

test('a templated landing page scores as heavy slop', async () => {
  const html = await readFile(fx('slop-landing.html'), 'utf8');
  const r = await scanHtml(html, { url: 'https://flownova.lovable.app', now });
  assert.ok(r.total >= 60, `expected >= 60, got ${r.total}`);
  for (const id of ['lexicon', 'placeholder', 'purple-gradient', 'emoji-icons', 'section-comments', 'dead-links', 'vanity']) {
    assert.ok(ids(r).includes(id), `missing ${id}`);
  }
  assert.ok(r.findings.some((f) => f.id === 'builder-lovable'));
});

test('a specific, hand-written page scores clean', async () => {
  const html = await readFile(fx('craft-bakery.html'), 'utf8');
  const r = await scanHtml(html, { url: 'https://yarimayfirini.com.tr', now });
  assert.ok(r.total < 20, `expected < 20, got ${r.total}`);
  assert.ok(r.findings.filter((f) => f.kind === 'strength').length >= 3);
});

test('project scan points at file:line', async () => {
  const r = await scanProject(fx('vibe-app'), { now });
  assert.ok(r.total >= 40, `expected >= 40, got ${r.total}`);
  const lex = r.findings.find((f) => f.id === 'lexicon');
  assert.ok(lex.locations.some((l) => l.file === 'src/App.tsx' && l.line > 0));
  const title = r.findings.find((f) => f.id === 'default-title');
  assert.deepEqual([title.locations[0].file, title.locations[0].line], ['index.html', 7]);
  assert.ok(r.findings.some((f) => f.id === 'fake-proof' && f.locations.some((l) => l.file.endsWith('Testimonials.tsx'))));
  // shadcn primitives are skipped by default
  assert.ok(!r.findings.some((f) => (f.locations || []).some((l) => l.file.includes('components/ui'))));
});

test('one loud area alone is capped', async () => {
  const html = `<html><body><h1>Our studio</h1><div class="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 backdrop-blur-xl blur-3xl"></div>
  <p>We repair Leica and Contax rangefinders in our Kadıköy workshop since 1994. A CLA service costs 3.400 TL and takes 10 days.</p></body></html>`;
  const r = await scanHtml(html, { now });
  assert.ok(r.total <= 45);
});

test('rescue plan estimates a lower score and asks for facts', async () => {
  const r = await scanTarget(fx('slop-landing.html'), { now });
  const plan = buildRescuePlan(r, { targetScore: 20 });
  assert.ok(plan.estimate < r.total);
  assert.ok(plan.phases[0].questions.length >= 5);
  const md = renderRescuePlan(plan, { lang: 'tr' });
  assert.match(md, /Kurtarma planı/);
  assert.match(md, /slop-landing\.html:\d+/);
});

test('reports render in both languages', async () => {
  const r = await scanTarget(fx('slop-landing.html'), { now });
  assert.match(renderReport(r, { lang: 'en' }), /Slop score/);
  assert.match(renderReport(r, { lang: 'tr' }), /Slop skoru/);
});

test('url-like and missing targets are told apart', async () => {
  await assert.rejects(scanTarget('definitely-not-a-folder'), /does not look like a URL/);
});

test('calibration: modern AI-builder pages score high, hand-made pages stay clean', async () => {
  const saas = await scanTarget(join(here, 'fixtures', 'modern-saas.html'), { now: new Date('2026-10-17') });
  assert.ok(saas.total >= 55, `modern SaaS template scored ${saas.total}`);
  assert.ok(saas.findings.some((f) => f.id === 'landing-template'));
  assert.ok(saas.findings.some((f) => f.id === 'stock-microcopy'));
  const folio = await scanTarget(join(here, 'fixtures', 'ai-portfolio', 'index.html'), { now: new Date('2026-10-17') });
  assert.ok(folio.total >= 40, `AI portfolio scored ${folio.total}`);
  // linked style.css and script.js are read, and findings point into them
  const pg = folio.findings.find((f) => f.id === 'purple-gradient');
  assert.ok(pg && pg.locations.some((l) => /style\.css$/.test(l.file)), 'gradient found in style.css');
  assert.ok(folio.findings.some((f) => f.id === 'gimmick-effects' && f.evidence.includes('typing effect')));
  for (const clean of [join(here, 'fixtures', 'craft-bakery.html'), join(here, '..', 'examples', 'novaflow', 'after.html'), join(here, '..', 'site', 'index.html')]) {
    const r = await scanTarget(clean, { now: new Date('2026-10-17') });
    assert.ok(r.total <= 12, `${clean} scored ${r.total}`);
  }
});
