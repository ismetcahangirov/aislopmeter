// Public API: scan a URL, a single HTML file/string, or a project folder.
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { corpusFromHtml } from './corpus/html.js';
import { corpusFromProject } from './corpus/project.js';
import { runRules } from './rules.js';
import { finalize, combinePages } from './score.js';
import { loadPage, pickInternalLinks, looksLikeShell } from './fetch.js';
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

export async function scanHtml(html, { url = '', file = null, now } = {}) {
  const C = corpusFromHtml(html, { url, file });
  const r = await analyzeCorpus(C, { now });
  const notes = [];
  if (r.words < 40 && C.shellRoot) notes.push({ code: 'shell' });
  else if (r.words < 120) notes.push({ code: 'low-text' });
  return { kind: 'page', target: url || '(html)', url, ...r, notes, meta: C.meta };
}

export async function scanUrl(input, { pages = 1, render = 'auto', now } = {}) {
  const first = await loadPage(input, { render });
  const main = await scanHtml(first.html, { url: first.url, now });
  main.rendered = first.rendered;
  main.notes.push(...first.notes);
  const n = Math.max(1, Math.min(10, pages | 0 || 1));
  if (n === 1) return remember({ ...main, target: first.url });

  const results = [{ path: new URL(first.url).pathname || '/', ...main }];
  for (const link of pickInternalLinks(first.html, first.url, n - 1)) {
    try {
      const p = await loadPage(link, { render });
      const r = await scanHtml(p.html, { url: p.url, now });
      r.rendered = p.rendered;
      results.push({ path: new URL(p.url).pathname, ...r });
    } catch (e) {
      results.push({ path: new URL(link).pathname, error: String(e.message || e) });
    }
  }
  const ok = results.filter((r) => !r.error);
  const site = combinePages(ok);
  // site-wide issue: the same title or description on every page
  const findings = ok.flatMap((r) => r.findings.map((f) => ({ ...f, page: r.path })));
  const titles = ok.map((r) => r.meta?.title).filter(Boolean);
  const descs = ok.map((r) => r.meta?.description).filter(Boolean);
  const dupT = titles.length >= 2 && new Set(titles).size === 1;
  const dupD = descs.length >= 2 && new Set(descs).size === 1;
  if (dupT || dupD) {
    findings.push({
      id: 'duplicate-meta', cat: 'finish', pts: 2, kind: 'issue', severity: 'low', effort: 'quick',
      title: { en: 'Same title or description on every page', tr: 'Her sayfada aynı başlık ya da açıklama' },
      detail: { en: `${dupT ? 'Titles' : ''}${dupT && dupD ? ' and ' : ''}${dupD ? 'descriptions' : ''} repeat across ${ok.length} pages.`, tr: `${ok.length} sayfada ${dupT ? 'başlıklar' : ''}${dupT && dupD ? ' ve ' : ''}${dupD ? 'açıklamalar' : ''} aynı.` },
      evidence: [dupT ? titles[0] : descs[0]], locations: [],
      fix: { en: 'Write a title and description for each page.', tr: 'Her sayfaya kendi başlık ve açıklamasını yazın.' },
    });
  }
  attachActions(findings);
  findings.sort((a, b) => b.pts - a.pts);
  return remember({
    kind: 'site', target: first.url, url: first.url, ...site, findings,
    words: ok.reduce((a, r) => a + r.words, 0), lang: main.lang, pageType: main.pageType, pages: results.map((r) => ({ path: r.path, total: r.total, band: r.band, words: r.words, error: r.error, rendered: r.rendered })),
    notes: main.notes, meta: main.meta,
  });
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
    return remember({ ...(await scanHtml(html, { url: '', file, now: opts.now })), target: resolve(s), display: s, kind: 'page' });
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
