import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { openRenderer } from '../src/fetch.js';

const here = dirname(fileURLToPath(import.meta.url));

// Runs only where a Chrome, Edge or Chromium can be found (set AISLOPMETER_CHROME to point at one).
test('browser measurements: contrast, fonts, centring, dark background', async (t) => {
  delete process.env.AISLOPMETER_BROWSER;
  const r = await openRenderer();
  if (!r.available) { t.skip('no local browser'); return; }
  try {
    const out = await r.render(pathToFileURL(join(here, 'fixtures', 'ai-portfolio', 'index.html')).toString(), { visual: true });
    const v = out.visual;
    assert.ok(v, 'measurements returned');
    assert.ok(v.background.luminance < 0.03, `dark page measured, got ${v.background.luminance}`);
    assert.ok(v.contrast.checked >= 10);
    assert.ok(v.centred.blocks >= 5);
    assert.equal(typeof v.fonts.body, 'string');
  } finally {
    await r.close();
  }
});

test('browser measurements: layout problems and page errors', async (t) => {
  delete process.env.AISLOPMETER_BROWSER;
  const r = await openRenderer();
  if (!r.available) { t.skip('no local browser'); return; }
  try {
    const v = (await r.render(pathToFileURL(join(here, 'fixtures', 'layout', 'broken.html')).toString(), { visual: true })).visual;
    assert.ok(v.layout.tinyText.n >= 2, 'tiny text');
    assert.ok(v.layout.covered.n >= 2, 'covered text');
    assert.ok(v.layout.cramped.n >= 3, 'cramped boxes');
    assert.ok(v.layout.nested.n >= 2, 'nested cards');
    assert.ok(v.layout.edge.n >= 2, 'text on the edge');
    assert.equal(v.layout.spill.page, true, 'page scrolls sideways');
    assert.equal(v.jsErrors.length, 1, 'one load error');
  } finally {
    await r.close();
  }
});
