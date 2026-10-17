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
