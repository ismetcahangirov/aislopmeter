// Public API: scan a URL, a single HTML file/string, or a project folder.
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, dirname, relative, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { corpusFromHtml } from './corpus/html.js';
import { corpusFromProject } from './corpus/project.js';
import { runRules } from './rules.js';
import { finalize, combinePages, severityOf } from './score.js';
import { loadPage, looksLikeShell, linkedAssets } from './fetch.js';
import { crawlSite } from './crawl.js';
import { remember } from './store.js';
import { guessPageType } from './interview.js';
import { attachActions } from './actions.js';

export { renderReport, renderCompare } from './report.js';
export { buildRescuePlan, renderRescuePlan } from './rescue.js';
export { getScan, listScans, historyOf } from './store.js';
export { renderHtml, saveReport, openInBrowser, reportDir } from './html.js';
export { fixPrompt, actionsFor } from './actions.js';

async function analyzeCorpus(C, opts) {
  const { findings, words, lang } = await runRules(C, opts);
  return finalize({ findings: attachActions(findings), words, lang, pageType: guessPageType(C.text) });
}

export async function scanHtml(html, { url = '', file = null, now, assets = [], shell = false } = {}) {
  const C = corpusFromHtml(html, { url, file, assets });
  C.serverShell = shell;
  const r = await analyzeCorpus(C, { now });
  const notes = [];
  if (r.words < 40 && C.shellRoot) notes.push({ code: 'shell' });
  else if (r.words < 120) notes.push({ code: 'low-text' });
  return { kind: 'page', target: url || '(html)', url, ...r, notes, meta: C.meta };
}

export const DEFAULT_PAGES = 30;
export const MAX_PAGES = 200;

/**
 * Scan a site. pages = 1 scans only the given URL; more crawls the site
 * (sitemap.xml, then internal links) and gives each page its own report.
 */
export async function scanUrl(input, { pages = DEFAULT_PAGES, render = 'auto', now, budgetMs, concurrency, onPage } = {}) {
  const n = pages === 'all' ? MAX_PAGES : Math.max(1, Math.min(MAX_PAGES, pages | 0 || DEFAULT_PAGES));
  if (n === 1) {
    const first = await loadPage(input, { render });
    const main = await scanHtml(first.html, { url: first.url, now, assets: first.assets, shell: first.shell });
    main.rendered = first.rendered;
    main.notes.push(...first.notes);
    return remember({ ...main, target: first.url });
  }
  const crawl = await crawlSite(input, {
    max: n, render, budgetMs, concurrency, onPage,
    scan: (html, url, extra = {}) => scanHtml(html, { url, now, ...extra }),
  });
  const ok = crawl.pages.filter((r) => !r.error);
  // a site that turned out to have one page is just a page
  if (ok.length === 1 && crawl.pages.length === 1) {
    const { path, html, ...main } = ok[0];
    main.notes.push(...crawl.notes.filter((x) => x.code !== 'sitemap'));
    return remember({ ...main, target: crawl.url, url: crawl.url });
  }
  return remember(combineSite(crawl, ok));
}

/** Per-page results → one site result. Findings that repeat on many pages become one item with a page list. */
function combineSite(crawl, ok) {
  const site = combinePages(ok);
  const n = ok.length;
  for (const p of ok) for (const f of p.findings) f.page = p.path;
  const byId = new Map();
  for (const p of ok) for (const f of p.findings) {
    if (!byId.has(f.id)) byId.set(f.id, []);
    byId.get(f.id).push(f);
  }
  const findings = [];
  for (const [id, occ] of byId) {
    occ.sort((a, b) => b.pts - a.pts);
    const top = occ[0];
    const sum = occ.reduce((a, f) => a + f.pts, 0);
    const pts = top.kind === 'issue' ? Math.round((0.5 * (sum / n) + 0.5 * top.pts) * 10) / 10 : Math.round((sum / n) * 10) / 10;
    const g = {
      ...top, page: undefined, pts, severity: severityOf(pts),
      pages: occ.map((f) => f.page), pageCount: occ.length,
      evidence: [...new Set(occ.flatMap((f) => f.evidence || []).filter(Boolean))].slice(0, 6),
      locations: occ.flatMap((f) => (f.locations || []).filter(Boolean)).slice(0, 8),
    };
    findings.push(g);
  }
  // site-wide issue: the same title or description on several pages
  const titles = ok.map((r) => r.meta?.title).filter(Boolean);
  const descs = ok.map((r) => r.meta?.description).filter(Boolean);
  const dupOf = (list) => { const c = {}; for (const x of list) c[x] = (c[x] || 0) + 1; return Object.entries(c).filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1])[0]; };
  const dT = dupOf(titles), dD = dupOf(descs);
  if (dT || dD) {
    const val = (dT || dD)[0];
    const pagesWith = ok.filter((r) => r.meta?.title === val || r.meta?.description === val).map((r) => r.path);
    findings.push({
      id: 'duplicate-meta', cat: 'finish', pts: 2, kind: 'issue', severity: 'low', effort: 'quick',
      title: { en: 'Same title or description on several pages', tr: 'Birden fazla sayfada aynı başlık ya da açıklama' },
      detail: { en: `${pagesWith.length} pages share the same ${dT ? 'title' : 'description'}.`, tr: `${pagesWith.length} sayfa aynı ${dT ? 'başlığı' : 'açıklamayı'} kullanıyor.` },
      evidence: [val], locations: [], pages: pagesWith, pageCount: pagesWith.length,
      fix: { en: 'Write a title and description for each page.', tr: 'Her sayfaya kendi başlık ve açıklamasını yazın.' },
    });
  }
  attachActions(findings);
  findings.sort((a, b) => b.pts - a.pts);
  const main = ok[0];
  return {
    kind: 'site', target: crawl.url, url: crawl.url, ...site, findings,
    words: ok.reduce((a, r) => a + r.words, 0), lang: main.lang, pageType: main.pageType,
    pages: crawl.pages.map((r) => ({
      path: r.path, url: r.url, total: r.total, band: r.band, words: r.words, error: r.error, rendered: r.rendered,
      issues: r.findings ? r.findings.filter((f) => f.kind === 'issue').length : 0,
      top: r.findings ? r.findings.filter((f) => f.kind === 'issue').slice(0, 3).map((f) => f.id) : [],
    })),
    pageResults: ok.map(({ html, ...r }) => r),
    notes: [...main.notes.filter((x) => x.code !== 'low-text'), ...crawl.notes], meta: main.meta,
  };
}

/** One page of a site scan, by path ("/pricing") or full URL. */
export function pageOf(scan, which) {
  if (!scan?.pageResults) return null;
  const w = String(which || '').trim();
  let key = w;
  try { if (/^https?:/i.test(w)) { const u = new URL(w); key = u.pathname + u.search; } } catch { /* keep as is */ }
  const norm = (x) => (x.replace(/\/+$/, '') || '/');
  return scan.pageResults.find((p) => p.path === key || norm(p.path) === norm(key) || p.url === w) || null;
}

export async function scanProject(dir, { ignore = [], includeUi = false, now } = {}) {
  const root = resolve(dir);
  const C = await corpusFromProject(root, { ignore, includeUi });
  const r = await analyzeCorpus(C, { now });
  const notes = [];
  if (C.files === 0) notes.push({ code: 'no-files' });
  if (C.skippedLarge) notes.push({ code: 'skipped-large', count: C.skippedLarge });
  if (r.words < 120) notes.push({ code: 'low-text' });
  return remember({ kind: 'project', target: root, root, files: C.files, ...r, notes, meta: C.meta });
}

/** Stylesheets and scripts a local .html file links to, read from disk. */
async function localAssets(html, absPath, shownPath) {
  const out = [];
  const { css, js } = linkedAssets(html, pathToFileURL(absPath).toString());
  const shownDir = shownPath.includes('/') ? shownPath.slice(0, shownPath.lastIndexOf('/') + 1) : '';
  for (const [kind, list, max] of [['css', css, 8], ['js', js, 4]]) {
    for (const u of list.filter((x) => x.startsWith('file:')).slice(0, max)) {
      try {
        const p = fileURLToPath(u);
        const text = await readFile(p, 'utf8');
        if (text.length > 600 * 1024 || /\.min\.(?:css|js)$/.test(p)) continue;
        out.push({ kind, url: u, name: shownDir + relative(dirname(absPath), p).split(sep).join('/'), text });
      } catch { /* missing file */ }
    }
  }
  return out;
}

/** Decide what the target is: URL, HTML file or folder. */
export async function scanTarget(target, opts = {}) {
  const s = String(target || '').trim();
  if (!s) throw new Error('Nothing to scan: give a URL, an .html file or a project folder.');
  const st = await stat(resolve(s)).catch(() => null);
  if (st?.isDirectory()) { const r = await scanProject(s, opts); r.display = s; return r; }
  if (st?.isFile()) {
    if (!/\.html?$/i.test(extname(s))) throw new Error('Single files must be .html. For a project, pass its folder.');
    const html = await readFile(resolve(s), 'utf8');
    const file = s.replace(/\\/g, '/');
    const assets = await localAssets(html, resolve(s), file);
    return remember({ ...(await scanHtml(html, { url: '', file, now: opts.now, assets })), target: resolve(s), display: s, kind: 'page' });
  }
  // Decide URL vs. missing local path without sending a request for things that are clearly files.
  const hostWithPath = /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[::1\]|[\w-]+(?:\.[\w-]+)+)(?::\d+)?\//i.test(s);
  const bareWebFile = !s.includes('/') && !s.includes('\\') && /\.(?:html?|md|mdx|json|jsx?|tsx?|vue|svelte|astro|css)$/i.test(s);
  const pathLike = !/^https?:\/\//i.test(s) && !hostWithPath && /[\\/]/.test(s);
  const looksLocal = bareWebFile || pathLike;
  if (looksLocal) throw new Error(`File or folder not found: ${s}`);
  if (/^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[::1\]|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#].*)?$/i.test(s)) return scanUrl(s, opts);
  throw new Error(`Could not find "${s}" as a folder or file, and it does not look like a URL.`);
}

export { looksLikeShell };
