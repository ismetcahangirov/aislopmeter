// Fetch a page. If the server sends an empty client-rendered shell, try to render it
// with the Chrome or Edge already installed on this machine (via playwright-core, optional).
import { parseHTML } from 'linkedom';
import { wordsOf } from './util.js';
import { measureVisual } from './visual.js';

const UA = 'Mozilla/5.0 (compatible; AISlopMeter/1.0; +https://github.com/omergocmen/aislopmeter)';
const MAX_BYTES = 6 * 1024 * 1024;

export function normalizeUrl(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Empty URL');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = (/^(localhost|127\.|\[::1\])/.test(s) ? 'http://' : 'https://') + s;
  const u = new URL(s);
  if (!/^https?:$/.test(u.protocol)) throw new Error(`Only http and https URLs can be scanned (got ${u.protocol})`);
  return u.toString();
}

export async function fetchHtml(url, { timeoutMs = 20000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'accept-language': 'en,tr;q=0.8' },
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    if (type && !/html|xml|text\/plain/i.test(type)) throw new Error(`Not an HTML page (${type})`);
    if (!res.body) return { html: '', finalUrl: res.url || url, status: res.status };
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { ctl.abort(); break; }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    // honour the declared charset (many Turkish sites still serve windows-1254 / iso-8859-9)
    const declared = (type.match(/charset=["']?([\w-]+)/i) || buf.subarray(0, 2048).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
    let html;
    try { html = new TextDecoder(declared || 'utf-8', { fatal: false }).decode(buf); } catch { html = new TextDecoder('utf-8').decode(buf); }
    return { html, finalUrl: res.url || url, status: res.status };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`Timed out after ${timeoutMs / 1000}s fetching ${url}`);
    if (/^HTTP |Not an HTML/.test(e.message)) throw e;
    throw new Error(`Could not fetch ${url}: ${e.cause?.code || e.cause?.message || e.message}`);
  } finally {
    clearTimeout(t);
  }
}

/** True when the server HTML has almost no text but a JS mount point. */
export function looksLikeShell(html) {
  const { document } = parseHTML(html);
  for (const el of document.querySelectorAll('script, style, noscript, template')) el.remove();
  const words = wordsOf(document.body ? document.body.textContent : '').length;
  return words < 60 && !!document.querySelector('#root, #app, #__next, #__nuxt, [data-reactroot], #svelte, [id^="app"]');
}

async function launchBrowser() {
  if (/^(?:off|0|false|never)$/i.test(process.env.AISLOPMETER_BROWSER || '')) return { browser: null, reason: 'browser turned off (AISLOPMETER_BROWSER=off)' };
  let pw;
  try {
    pw = await import('playwright-core');
  } catch {
    return { browser: null, reason: 'playwright-core is not installed' };
  }
  let lastErr = null;
  for (const channel of ['chrome', 'msedge', 'chromium']) {
    try { return { browser: await pw.chromium.launch({ channel, headless: true }) }; } catch (e) { lastErr = e; }
  }
  const exe = process.env.AISLOPMETER_CHROME;
  if (exe) {
    try { return { browser: await pw.chromium.launch({ executablePath: exe, headless: true }) }; } catch (e) { lastErr = e; }
  }
  return { browser: null, reason: 'no Chrome, Edge or Chromium found (set AISLOPMETER_CHROME to a browser path)', error: String(lastErr?.message || '').split('\n')[0] };
}

async function renderWith(browser, url, timeoutMs, { visual = false } = {}) {
  const page = await browser.newPage({ userAgent: UA.replace('compatible; ', ''), viewport: { width: 1366, height: 900 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(800);
    const vis = visual ? await page.evaluate(measureVisual).catch(() => null) : null;
    return { html: await page.content(), visual: vis, reason: null };
  } catch (e) {
    return { html: null, reason: 'render failed', error: String(e.message).split('\n')[0] };
  } finally {
    await page.close().catch(() => {});
  }
}

/** Render with the system browser. Returns null (with a reason) when that is not possible. */
export async function renderHtml(url, { timeoutMs = 30000 } = {}) {
  const { browser, reason, error } = await launchBrowser();
  if (!browser) return { html: null, reason, error };
  try { return await renderWith(browser, url, timeoutMs); } finally { await browser.close().catch(() => {}); }
}

/** One browser kept open for many pages (used while crawling a client-rendered site). */
export async function openRenderer({ timeoutMs = 30000 } = {}) {
  const { browser, reason, error } = await launchBrowser();
  return {
    available: !!browser,
    render: (url, opts) => (browser ? renderWith(browser, url, timeoutMs, opts) : Promise.resolve({ html: null, reason, error })),
    close: () => (browser ? browser.close().catch(() => {}) : Promise.resolve()),
  };
}

/* ---------- linked CSS and JS ---------- */
// Most real sites keep their styles in style.css and their effects in script.js.
// Without them the design checks only see inline styles and Tailwind classes.
const LIB = /(?:font-?awesome|bootstrap|jquery|swiper|slick|aos|animate(?:\.min)?\.css|normalize|reset|tailwind(?:\.min)?\.css|gtag|google-analytics|googletagmanager|hotjar|clarity|recaptcha|cookie|polyfill|vendor|chunk-vendors|framework-|react-dom|webpack-runtime)/i;
const MAX_CSS = 8, MAX_JS = 4, MAX_ASSET = 600 * 1024;

export function linkedAssets(html, baseUrl) {
  const css = [], js = [];
  for (const m of String(html).matchAll(/<link\b[^>]{0,600}>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = (tag.match(/href\s*=\s*["']([^"']+)["']/i) || tag.match(/href\s*=\s*([^\s>]+)/i) || [])[1];
    if (href) css.push(href);
  }
  for (const m of String(html).matchAll(/<script\b[^>]{0,600}\bsrc\s*=\s*["']([^"']+)["'][^>]{0,300}>/gi)) js.push(m[1]);
  const abs = (h) => { try { return new URL(h, baseUrl).toString(); } catch { return null; } };
  return { css: css.map(abs).filter(Boolean), js: js.map(abs).filter(Boolean) };
}

async function fetchText2(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': UA } });
    if (!res.ok) return null;
    const len = +(res.headers.get('content-length') || 0);
    if (len > MAX_ASSET) return null;
    const text = await res.text();
    return text.length > MAX_ASSET ? text.slice(0, MAX_ASSET) : text;
  } catch { return null; } finally { clearTimeout(t); }
}

/** Fetch the page's own stylesheets and scripts (same site, no well-known libraries). */
export async function fetchAssets(html, pageUrl, cache = new Map()) {
  const base = new URL(pageUrl);
  const host = (h) => h.replace(/^www\./, '');
  const { css, js } = linkedAssets(html, pageUrl);
  const pick = (list, max) => list.filter((u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && host(x.host) === host(base.host) && !LIB.test(x.pathname); } catch { return false; } }).slice(0, max);
  const out = [];
  for (const [kind, list] of [['css', pick(css, MAX_CSS)], ['js', pick(js, MAX_JS)]]) {
    for (const u of list) {
      if (!cache.has(u)) cache.set(u, fetchText2(u));
      const text = await cache.get(u);
      if (text) out.push({ kind, url: u, name: new URL(u).pathname.replace(/^\//, '') || u, text });
    }
  }
  return out;
}

/** Fetch, and render if the page is a shell. */
/**
 * Fetch a page. With a local Chrome/Edge (render != 'never') it is also opened in the browser:
 * to render an empty JavaScript shell, and to take the visual measurements (src/visual.js).
 * Without a browser everything still works from the HTML and CSS alone.
 */
export async function loadPage(input, { render = 'auto', assets = true, assetCache, renderer = null, visual = true } = {}) {
  const url = normalizeUrl(input);
  const got = await fetchHtml(url);
  const notes = [];
  let html = got.html;
  let rendered = false;
  let vis = null;
  const shell = looksLikeShell(html);
  const wantRender = render === 'always' || (render === 'auto' && shell);
  const wantVisual = visual && render !== 'never';
  if (wantRender || wantVisual) {
    const own = !renderer;
    const r = renderer || (await openRenderer());
    try {
      const out = await r.render(got.finalUrl, { visual: wantVisual });
      if (out.html && wantRender) { html = out.html; rendered = true; }
      if (out.visual) vis = out.visual;
      if (!out.html && wantRender) notes.push({ code: 'render-unavailable', reason: out.reason, error: out.error });
    } finally {
      if (own) await r.close();
    }
  }
  const files = assets ? await fetchAssets(html, got.finalUrl, assetCache) : [];
  return { url: got.finalUrl, html, rendered, notes, assets: files, shell, visual: vis };
}

/** Same-origin links worth scanning next, most informative pages first. */
export function pickInternalLinks(html, baseUrl, max = 5) {
  const { document } = parseHTML(html);
  const base = new URL(baseUrl);
  const seen = new Set([base.origin + base.pathname.replace(/\/$/, '')]);
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    let u;
    try { u = new URL(a.getAttribute('href'), base); } catch { continue; }
    if (u.origin !== base.origin || !/^https?:$/.test(u.protocol)) continue;
    if (/\.(?:pdf|jpe?g|png|gif|webp|svg|zip|mp4|xml|json|txt)$/i.test(u.pathname)) continue;
    const key = u.origin + u.pathname.replace(/\/$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  const rank = (p) => (/(about|hakk|pricing|fiyat|feature|ozellik|özellik|product|urun|service|hizmet|blog|contact|iletisim|team|ekip)/i.test(p) ? 0 : 1);
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, max);
}
