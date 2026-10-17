// Find and load the pages of a site: sitemap.xml first, then internal links, politely.
// - same site only (www. and the bare domain count as one)
// - respects robots.txt for our user agent and for *
// - spreads picks across sections (/blog, /docs, /pricing…) so 1000 blog posts do not crowd out the rest
import { parseHTML } from 'linkedom';
import { fetchHtml, loadPage, looksLikeShell, normalizeUrl, openRenderer, fetchAssets } from './fetch.js';

const SKIP_EXT = /\.(?:pdf|jpe?g|png|gif|webp|avif|svg|ico|zip|gz|rar|7z|mp3|mp4|webm|mov|avi|xml|json|txt|csv|xlsx?|docx?|pptx?|css|js|mjs|woff2?|ttf|eot|rss|atom)$/i;
const SKIP_PATH = /^\/(?:wp-admin|wp-json|wp-login|xmlrpc|cdn-cgi|feed|comments\/feed|cart|checkout|my-account|account|login|signin|sign-in|logout|admin)(?:\/|$)|\/(?:feed|amp)\/?$/i;
const TRACKING = /^(?:utm_\w+|gclid|fbclid|msclkid|mc_cid|mc_eid|ref|ref_src|_ga|_gl|yclid|igshid|replytocom)$/i;
const AGENT = 'aislopmeter';

const bareHost = (h) => h.toLowerCase().replace(/^www\./, '');

/** Canonical form used to de-duplicate: no hash, no tracking params, no trailing slash. */
export function pageKey(u) {
  const x = new URL(u);
  x.hash = '';
  for (const k of [...x.searchParams.keys()]) if (TRACKING.test(k)) x.searchParams.delete(k);
  x.searchParams.sort();
  const path = x.pathname.replace(/\/+$/, '') || '/';
  return `${bareHost(x.host)}${path}${x.search}`;
}

function sameSite(u, base) {
  return /^https?:$/.test(u.protocol) && bareHost(u.host) === bareHost(base.host);
}

function crawlable(u) {
  return !SKIP_EXT.test(u.pathname) && !SKIP_PATH.test(u.pathname) && u.searchParams.size <= 2;
}

/* ---------- robots.txt ---------- */
export function parseRobots(text) {
  const groups = [];
  let cur = null, lastWasAgent = false;
  const sitemaps = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'sitemap') { if (v) sitemaps.push(v); continue; }
    if (k === 'user-agent') {
      if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (cur && (k === 'allow' || k === 'disallow')) cur.rules.push({ allow: k === 'allow', path: v });
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && AGENT.includes(a)))
    || groups.find((g) => g.agents.includes('*'));
  const rules = (mine?.rules || []).filter((r) => r.path);
  const toRe = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const compiled = rules.map((r) => ({ ...r, re: toRe(r.path), len: r.path.length }));
  return {
    sitemaps,
    allowed(pathAndQuery) {
      let best = null;
      for (const r of compiled) if (r.re.test(pathAndQuery) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
      return !best || best.allow;
    },
  };
}

async function fetchText(url) {
  try { return (await fetchHtml(url, { timeoutMs: 10000 })).html; } catch { return null; }
}

/* ---------- sitemap.xml ---------- */
export function parseSitemap(xml) {
  const locs = [...String(xml || '').matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
  return { index: /<sitemapindex[\s>]/i.test(xml), locs };
}

async function readSitemaps(origin, declared, base, limit = 3000) {
  const queue = [...new Set([...declared, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])];
  const seen = new Set();
  const out = [];
  let fetched = 0;
  while (queue.length && fetched < 12 && out.length < limit) {
    const sm = queue.shift();
    if (seen.has(sm) || /\.gz$/i.test(sm)) continue;
    seen.add(sm);
    let u;
    try { u = new URL(sm); } catch { continue; }
    if (!sameSite(u, base)) continue;
    fetched++;
    const xml = await fetchText(sm);
    if (!xml || !/<(?:urlset|sitemapindex)[\s>]/i.test(xml)) continue;
    const { index, locs } = parseSitemap(xml);
    if (index) queue.push(...locs);
    else out.push(...locs);
  }
  return out.slice(0, limit);
}

/* ---------- links on a page ---------- */
export function linksOf(html, pageUrl) {
  const { document } = parseHTML(/<body[\s>]/i.test(html) ? html : `<html><body>${html}</body></html>`);
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href || /^(?:mailto|tel|javascript|data):/i.test(href)) continue;
    if ((a.getAttribute('rel') || '').includes('nofollow')) continue;
    try { out.push(new URL(href, pageUrl).toString()); } catch { /* bad href */ }
  }
  return out;
}

const IMPORTANT = /(about|hakk|pricing|price|fiyat|feature|ozellik|özellik|product|urun|ürün|service|hizmet|contact|iletisim|iletişim|team|ekip|faq|sss|blog|docs|menu|portfolio|work|case)/i;
const sectionOf = (u) => (new URL(u).pathname.split('/').filter(Boolean)[0] || '/').toLowerCase();

/**
 * Crawl a site and scan each page with `scan(html, url)`.
 * Returns { pages: [{ url, path, html? , error? , rendered }], notes, stopped }.
 */
export async function crawlSite(input, { max = 30, render = 'auto', concurrency = 4, budgetMs = 120000, scan, onPage } = {}) {
  const t0 = Date.now();
  const startUrl = normalizeUrl(input);
  const notes = [];
  const assetCache = new Map();
  const first = await loadPage(startUrl, { render, assetCache });
  const base = new URL(first.url);
  const origin = base.origin;
  const results = [];
  const done = new Set([pageKey(first.url), pageKey(startUrl)]);

  // keep one browser open for the whole crawl when the site needs rendering
  let renderer = null;
  const needsRender = render === 'always' || first.rendered;
  const getRenderer = async () => (renderer ||= await openRenderer());

  const robotsTxt = max > 1 ? await fetchText(`${origin}/robots.txt`) : null;
  const robots = parseRobots(robotsTxt);
  const pool = new Map(); // key -> { url, depth, from }
  const add = (url, depth, from) => {
    let u;
    try { u = new URL(url, base); } catch { return; }
    if (!sameSite(u, base) || !crawlable(u)) return;
    u.hash = '';
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    const key = pageKey(u.toString());
    if (done.has(key) || pool.has(key)) return;
    if (!robots.allowed(u.pathname + u.search)) return;
    pool.set(key, { url: u.toString(), depth, from });
  };

  results.push(await scanOne(first.url, first.html, first.rendered, first.notes, { assets: first.assets, shell: first.shell }));
  onPage?.(results[0], 1, max);

  if (max > 1) {
    const sm = await readSitemaps(origin, robots.sitemaps, base);
    for (const u of sm) add(u, (new URL(u, base).pathname.split('/').filter(Boolean).length), 'sitemap');
    if (sm.length) notes.push({ code: 'sitemap', count: sm.length });
    for (const l of linksOf(first.html, first.url)) add(l, 1, 'link');
  }

  const perSection = new Map();
  function next() {
    let best = null, bestScore = Infinity;
    for (const [key, c] of pool) {
      const sec = sectionOf(c.url);
      // fewest pages taken from this section, then shallow, then pages people look for
      const s = (perSection.get(sec) || 0) * 100 + c.depth * 10 + (IMPORTANT.test(c.url) ? 0 : 5) + (c.from === 'link' ? 0 : 1);
      if (s < bestScore) { bestScore = s; best = key; }
    }
    if (!best) return null;
    const c = pool.get(best);
    pool.delete(best);
    done.add(best);
    const sec = sectionOf(c.url);
    perSection.set(sec, (perSection.get(sec) || 0) + 1);
    return c;
  }

  async function scanOne(url, html, rendered, pageNotes = [], extra = {}) {
    const path = (() => { const u = new URL(url); return (u.pathname || '/') + u.search; })();
    const r = await scan(html, url, extra);
    r.rendered = rendered;
    if (pageNotes.length) r.notes.push(...pageNotes);
    return { path, url, ...r, html };
  }

  let stopped = null;
  let started = 1;
  async function worker() {
    while (started < max) {
      if (Date.now() - t0 > budgetMs) { stopped = 'time'; return; }
      const c = next();
      if (!c) {
        // links found by other workers may still arrive
        if (inFlight > 0) { await new Promise((r) => setTimeout(r, 150)); continue; }
        return;
      }
      started++;
      inFlight++;
      try {
        const got = await fetchHtml(c.url);
        const k2 = pageKey(got.finalUrl);
        if (k2 !== pageKey(c.url) && results.some((p) => pageKey(p.url) === k2)) { continue; } // redirected to a page we have
        done.add(k2);
        let html = got.html, rendered = false;
        const shell = looksLikeShell(html);
        if (needsRender || (render === 'auto' && shell)) {
          const rr = await (await getRenderer()).render(got.finalUrl);
          if (rr.html) { html = rr.html; rendered = true; }
        }
        const assets = await fetchAssets(html, got.finalUrl, assetCache);
        const page = await scanOne(got.finalUrl, html, rendered, [], { assets, shell });
        results.push(page);
        for (const l of linksOf(html, got.finalUrl)) add(l, c.depth + 1, 'link');
        onPage?.(page, results.length, max);
      } catch (e) {
        const u = new URL(c.url);
        results.push({ path: u.pathname + u.search, url: c.url, error: String(e.message || e) });
      } finally {
        inFlight--;
      }
    }
  }
  let inFlight = 0;
  try {
    await Promise.all(Array.from({ length: Math.max(1, Math.min(8, concurrency)) }, worker));
  } finally {
    await renderer?.close();
  }
  if (stopped === 'time') notes.push({ code: 'crawl-time', seconds: Math.round(budgetMs / 1000), done: results.length });
  else if (pool.size && results.length >= max) notes.push({ code: 'crawl-limit', max, left: pool.size });
  for (const p of results) delete p.html;
  return { pages: results, notes, url: first.url };
}
