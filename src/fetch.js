// Fetch a page. If the server sends an empty client-rendered shell, try to render it
// with the Chrome or Edge already installed on this machine (via playwright-core, optional).
import { parseHTML } from 'linkedom';
import { wordsOf } from './util.js';

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

/** Render with the system browser. Returns null (with a reason) when that is not possible. */
export async function renderHtml(url, { timeoutMs = 30000 } = {}) {
  let pw;
  try {
    pw = await import('playwright-core');
  } catch {
    return { html: null, reason: 'playwright-core is not installed' };
  }
  const channels = ['chrome', 'msedge', 'chromium'];
  let browser = null;
  let lastErr = null;
  for (const channel of channels) {
    try {
      browser = await pw.chromium.launch({ channel, headless: true });
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!browser) {
    const exe = process.env.AISLOPMETER_CHROME;
    if (exe) {
      try { browser = await pw.chromium.launch({ executablePath: exe, headless: true }); } catch (e) { lastErr = e; }
    }
  }
  if (!browser) return { html: null, reason: 'no Chrome, Edge or Chromium found (set AISLOPMETER_CHROME to a browser path)', error: String(lastErr?.message || '').split('\n')[0] };
  try {
    const page = await browser.newPage({ userAgent: UA.replace('compatible; ', '') });
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(800);
    const html = await page.content();
    return { html, reason: null };
  } catch (e) {
    return { html: null, reason: 'render failed', error: String(e.message).split('\n')[0] };
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Fetch, and render if the page is a shell. */
export async function loadPage(input, { render = 'auto' } = {}) {
  const url = normalizeUrl(input);
  const got = await fetchHtml(url);
  const notes = [];
  let html = got.html;
  let rendered = false;
  if (render === 'always' || (render === 'auto' && looksLikeShell(html))) {
    const r = await renderHtml(got.finalUrl);
    if (r.html) { html = r.html; rendered = true; }
    else notes.push({ code: 'render-unavailable', reason: r.reason, error: r.error });
  }
  return { url: got.finalUrl, html, rendered, notes };
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
