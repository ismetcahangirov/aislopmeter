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

export async function fetchHtml(url, { timeoutMs = 20000, browser = true } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'accept-language': 'en,tr;q=0.8' },
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      if (await isChallenge(res)) {
        err.challenge = true;
        if (browser) {
          const got = await browserGet(url, { timeoutMs: Math.max(timeoutMs, 30000) });
          if (got?.ok) return { html: got.text, finalUrl: got.url || url, status: got.status, viaBrowser: true };
          if (got) {
            err.message = `HTTP ${got.status} for ${url}` + (got.status === 429 ? ' (past the bot check, but the site limits requests per visitor; scan fewer pages or wait a minute)' : ' (past the bot check)');
            throw err;
          }
        }
        err.message += browser
          ? ' (the site answers with a bot check, and no local Chrome/Edge could get past it)'
          : ' (the site answers with a bot check; scan with render "auto" to read it through the local Chrome/Edge)';
      }
      throw err;
    }
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

/* ---------- bot checks ---------- */
// Vercel and Cloudflare bot protection answer non-browser clients with a JavaScript challenge
// (403/429/503). A real Chrome passes it; after that, requests made from inside that page pass too.
const CHALLENGE_PAGE = /Vercel Security Checkpoint|<title>Just a moment\.\.\.<\/title>|_cf_chl_opt|\/cdn-cgi\/challenge-platform\//i;

async function isChallenge(res) {
  if (![403, 429, 503].includes(res.status)) return false;
  const h = res.headers;
  if (/challenge/i.test(h.get('x-vercel-mitigated') || '') || h.get('x-vercel-challenge-token') || /challenge/i.test(h.get('cf-mitigated') || '')) return true;
  if (!/cloudflare|vercel/i.test(h.get('server') || '')) return false;
  const body = await res.text().catch(() => '');
  return CHALLENGE_PAGE.test(body.slice(0, 50000));
}

const gates = new Map();
let gateBrowser = null;
let gateTimer = null;

async function gatePage(url, timeoutMs) {
  const origin = new URL(url).origin;
  if (!gates.has(origin)) {
    gates.set(origin, (async () => {
      if (!gateBrowser) gateBrowser = launchBrowser().then((x) => x.browser);
      const browser = await gateBrowser;
      if (!browser) return null;
      const page = await browser.newPage({ userAgent: UA.replace('compatible; ', '') });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
      for (let i = 0; i < 15 && CHALLENGE_PAGE.test(await page.content().catch(() => '')); i++) await page.waitForTimeout(1000);
      return page;
    })().catch(() => null));
  }
  return gates.get(origin);
}

/** Fetch a URL from inside a real browser page on its origin, once that page got past the bot check. */
export async function browserGet(url, { timeoutMs = 30000 } = {}) {
  clearTimeout(gateTimer);
  gateTimer = setTimeout(closeBrowserGates, 60000);
  gateTimer.unref?.();
  const page = await gatePage(url, timeoutMs);
  if (!page) return null;
  const got = await page.evaluate(async ({ u, max }) => {
    const r = await fetch(u, { redirect: 'follow', credentials: 'include' });
    const text = await r.text();
    return { ok: r.ok, status: r.status, url: r.url, type: r.headers.get('content-type') || '', text: text.length > max ? text.slice(0, max) : text };
  }, { u: url, max: MAX_BYTES }).catch(() => null);
  return got && !CHALLENGE_PAGE.test(got.text.slice(0, 50000)) ? got : null;
}

/** Was this origin read through the browser because of a bot check? */
export const behindBotCheck = (url) => { try { return gates.has(new URL(url).origin); } catch { return false; } };

export async function closeBrowserGates() {
  clearTimeout(gateTimer);
  const b = gateBrowser;
  gateBrowser = null;
  gates.clear();
  if (b) await b.then((x) => x?.close()).catch(() => {});
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
  const page = await browser.newPage({ userAgent: UA.replace('compatible; ', ''), viewport: { width: 1366, height: 900 }, colorScheme: 'light' });
  // errors thrown while the page loads: a visitor gets a half-working page
  const jsErrors = [];
  page.on('pageerror', (e) => { if (jsErrors.length < 5) jsErrors.push(String(e?.message || e).split('\n')[0].slice(0, 160)); });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(800);
    const vis = visual ? await page.evaluate(measureVisual).catch(() => null) : null;
    if (vis) vis.jsErrors = jsErrors;
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
    if (!res.ok) {
      if (!behindBotCheck(url)) return null;
      const got = await browserGet(url);
      return got?.ok ? got.text.slice(0, MAX_ASSET) : null;
    }
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
  const got = await fetchHtml(url, { browser: render !== 'never' });
  const notes = [];
  if (got.viaBrowser) notes.push({ code: 'bot-check' });
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

/** A small text file (robots.txt, llms.txt, sitemap.xml): its text, or null when missing or not text. */
export async function fetchPlain(url, { timeoutMs = 8000, maxBytes = 300 * 1024 } = {}) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/plain,text/markdown,application/xml,text/xml;q=0.9,*/*;q=0.1' } });
    if (!res.ok) {
      if (!behindBotCheck(url)) return null;
      const got = await browserGet(url, { timeoutMs });
      return got?.ok ? got.text.slice(0, maxBytes) : null;
    }
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  } catch { return null; } finally { clearTimeout(tm); }
}
