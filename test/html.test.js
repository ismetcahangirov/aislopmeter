// the default suite runs without a browser so results do not depend on the machine
process.env.AISLOPMETER_BROWSER ??= 'off';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanTarget, renderHtml } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));

test('visual report has both screens and escapes page content', async () => {
  const r = await scanTarget(join(here, 'fixtures', 'vibe-app'), { now: new Date('2026-10-17') });
  r.findings[0].evidence.push('<script>alert(1)</script>');
  for (const lang of ['en', 'tr']) {
    const html = renderHtml(r, { lang, history: [r] });
    assert.match(html, /id="report"/);
    assert.match(html, /id="plan"/);
    assert.match(html, lang === 'tr' ? /Buradan başla/ : /Start here/);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'evidence must be escaped');
    assert.match(html, /src\/App\.tsx:\d+/);
    assert.match(html, lang === 'tr' ? /Ne yapmalısın/ : /What to do/);
    assert.match(html, /<ol class="steps"><li>/);
    assert.match(html, /data-copy="fix"/);
  }
});
