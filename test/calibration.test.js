// False alarms found while calibrating on real sites (October 2026). Each test reproduces one.
process.env.AISLOPMETER_BROWSER ??= 'off';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanHtml } from '../src/index.js';

const ids = (r) => r.findings.filter((f) => f.pts > 0).map((f) => f.id);
const page = (body, head = '') => `<!doctype html><html lang="en"><head><title>Test page</title>${head}</head><body>${body}</body></html>`;
const prose = (n) => Array.from({ length: n }, (_, i) => `<p>On ${i + 3} March 2024 we moved the bakery on Moda Street to a bigger oven, which now bakes ${40 + i} loaves an hour for the cafés in Kadıköy.</p>`).join('');

test('code in a linked bundle is not template filler or an old copyright', async () => {
  const js = 'var a=document.querySelector(\'[name="\'+JSON.stringify(""+t)+\'"]\');var s="{{count}} items";/*! Copyright (c) 2014 Facebook */';
  const r = await scanHtml(page(prose(6)), { url: 'https://bakery.test/', assets: [{ kind: 'js', url: 'https://bakery.test/app.js', name: 'app.js', text: js }] });
  assert.ok(!ids(r).includes('placeholder'), ids(r).join(' '));
  assert.ok(!ids(r).includes('stale-copyright'), ids(r).join(' '));
});

test('attribute selectors and code indexing are not "[name]" placeholders', async () => {
  const r = await scanHtml(page(prose(6) + '<script>const v = obj[name]; document.querySelector(\'[name="cf-turnstile-response"]\')</script>'));
  assert.ok(!ids(r).includes('placeholder'), ids(r).join(' '));
  const r2 = await scanHtml(page(prose(4) + '<blockquote>[Insert testimonial here]</blockquote>'));
  assert.ok(ids(r2).includes('placeholder'));
});

test('"for your company" is copy, "Your Company Name" is filler', async () => {
  const r = await scanHtml(page(prose(5) + '<p>Basecamp works for your company, big or small.</p>'));
  assert.ok(!ids(r).includes('placeholder'), ids(r).join(' '));
  const r2 = await scanHtml(page(prose(5) + '<footer>© 2026 Your Company Name</footer>'));
  assert.ok(ids(r2).includes('placeholder'));
});

test('quotes and code blocks with a side rule are not card stripes', async () => {
  const css = 'blockquote{border-left:4px solid #ccc;padding:0 1em}pre{border-left:3px solid #eee}.toc a.active{border-left:2px solid red}';
  const r = await scanHtml(page(prose(6), `<style>${css}</style>`));
  assert.ok(!ids(r).includes('accent-stripe'), ids(r).join(' '));
  const r2 = await scanHtml(page(prose(6), '<style>.feature-card{border-left:4px solid #8b5cf6}.stat-card{border-top:4px solid #22c55e}</style>'));
  assert.ok(ids(r2).includes('accent-stripe'));
});

test('an archive of dated posts is not "little concrete information"', async () => {
  const posts = Array.from({ length: 8 }, (_, i) => `<article><h2><a href="/p${i}">Notes on caching, part ${i}</a></h2><p>Posted ${i + 1} October 2025</p><p>Why the obvious approach is wrong and what the browser actually does with it.</p></article>`).join('');
  const r = await scanHtml(page(posts));
  assert.ok(!ids(r).includes('specificity'), ids(r).join(' '));
});

test('percentages inside reporting prose are not vanity stats', async () => {
  const long = '<p>' + 'The survey of 1,200 readers found that 47% read on phones, 30% on laptops and 23% on paper, which is close to what the 2019 survey said about the same questions. '.repeat(3) + '</p>';
  const r = await scanHtml(page(prose(4) + long));
  assert.ok(!ids(r).includes('vanity'), ids(r).join(' '));
  const tiles = '<div><p>10,000+</p><p>Happy users</p></div><div><p>99.9%</p><p>Uptime</p></div><div><p>5x</p><p>Faster</p></div>';
  const r2 = await scanHtml(page(prose(4) + tiles));
  assert.ok(ids(r2).includes('vanity'));
});

test('the word "scramble" or "typewriter" in an article is not an effect', async () => {
  const r = await scanHtml(page(prose(5) + '<p>Apple had to scramble to fix it, and my old typewriter still works.</p>'));
  assert.ok(!ids(r).includes('gimmick-effects'), ids(r).join(' '));
});

test('™ and © are not emoji icons', async () => {
  const r = await scanHtml(page(prose(5) + '<h2>Basecamp™</h2><h3>Shape Up™</h3><button>HEY™</button><span>™</span><span>™</span><span>™</span>'));
  assert.ok(!ids(r).includes('emoji-icons') && !ids(r).includes('emoji-headings'), ids(r).join(' '));
});

test('a browser in dark mode does not make a light site "dark by default"', async () => {
  const visual = { v: 1, background: { color: '#111111', luminance: 0.006 }, darkScheme: true, fonts: {}, contrast: { checked: 0, failed: 0, worst: [] }, centred: { blocks: 0, centred: 0 }, cards: { groups: 0, cards: 0, samples: [] }, gradients: [], gradientText: 0, radius: { big: 0, boxes: 0 }, glows: 0 };
  const r = await scanHtml(page(prose(6), '<style>body{background:#fdfdfd;color:#222}</style>'), { visual });
  assert.ok(!ids(r).includes('perma-dark'), ids(r).join(' '));
  const r2 = await scanHtml(page(prose(6), '<style>body{background:#fdfdfd;color:#222}</style>'), { visual: { ...visual, darkScheme: false } });
  assert.ok(ids(r2).includes('perma-dark'));
});

test('thin-page: a landing that says nothing, but not a sign-in page', async () => {
  const landing = page('<h1>Transform your workflow</h1><h2>Built for teams</h2><p>The future of work starts here.</p><button>Get started</button><button>Learn more</button>');
  assert.ok(ids(await scanHtml(landing)).includes('thin-page'));
  const login = page('<h1>Your projects</h1><h2>Sign in to continue</h2><label>Email <input type="email"></label><label>Password <input type="password"></label><button>Log in</button>');
  assert.ok(!ids(await scanHtml(login)).includes('thin-page'));
  // a "Log in" button in the menu does not make a landing page a sign-in page
  const gated = page('<nav><button>Log in</button><button>Sign up</button></nav><h1>Get Britain talking</h1><p>Answer questions. Share opinions.</p><h2>What users say</h2><button>Create free account</button>');
  assert.ok(ids(await scanHtml(gated)).includes('thin-page'));
});

test('a crawl treats /index.html and / as one page', async () => {
  const { pageKey } = await import('../src/crawl.js');
  assert.equal(pageKey('https://x.test/index.html'), pageKey('https://x.test/'));
  assert.equal(pageKey('https://x.test/blog/index.htm'), pageKey('https://x.test/blog/'));
});

test('a line break separates words in headings', async () => {
  const r = await scanHtml(page('<h1>Kahvede Deneyimi<br>Yeniden Tanımlıyoruz</h1>' + prose(3)));
  assert.ok(r.findings.every((f) => !JSON.stringify(f).includes('DeneyimiYeniden')));
});

test('a price left as ₺XXX is template filler', async () => {
  const r = await scanHtml(page(prose(4) + '<div class="price">₺XXX<small>/ay</small></div>'));
  assert.ok(ids(r).includes('placeholder'), ids(r).join(' '));
  const r2 = await scanHtml(page(prose(4) + '<p>Size XXL beden, 2XL ve 3XL de var.</p>'));
  assert.ok(!ids(r2).includes('placeholder'), ids(r2).join(' '));
});

test('a short contact page is not a thin page', async () => {
  const contact = page('<h1>Bize yaz</h1><p>merhaba@kavruk.coffee</p><h2>Atölyeye gel</h2><button>Gönder</button>').replace('<title>Test page</title>', '<title>İletişim</title>');
  assert.ok(!ids(await scanHtml(contact)).includes('thin-page'));
});

test('a description with an apostrophe is read whole in folder scans', async () => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { scanTarget } = await import('../src/index.js');
  const dir = await mkdtemp(join(tmpdir(), 'desc-'));
  await writeFile(join(dir, 'index.html'), page(prose(4), '<meta name="description" content="Odunpazarı\'ndaki atölyemizde haftada iki gün, küçük partilerle kavuruyoruz.">'));
  const r = await scanTarget(dir, { config: false, render: 'never' });
  assert.ok(r.meta.description.length > 40, r.meta.description);
  assert.equal(r.aeo.checks.find((c) => c.id === 'title-description').ok, true);
});
