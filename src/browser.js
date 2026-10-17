// AI Slop Meter in the browser: scans the page you are on, with no install.
// Built to dist/aislopmeter.browser.js (global `AISlopMeter`) by scripts/build.mjs.
//   AISlopMeter.scan()    → the full result for this page
//   AISlopMeter.overlay() → a small panel with the score, the top findings and copy-as-prompt buttons
import { corpusFromHtml } from './corpus/html.js';
import { runRules } from './rules.js';
import { finalize } from './score.js';
import { attachActions, fixPrompt } from './actions.js';
import { guessPageType } from './interview.js';
import { linkedAssets, looksLikeShell } from './fetch.js';
import { measureVisual } from './visual.js';
import { renderReport, labels } from './report.js';
import { VERSION } from './version.js';
import { pageChecks, siteChecks, readiness, realText, realXml } from './aeo.js';

const LIB = /(?:font-?awesome|bootstrap|jquery|swiper|slick|aos|normalize|gtag|analytics|googletagmanager|hotjar|clarity|recaptcha|cookie|polyfill|vendor)/i;

async function text(url) {
  try {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok) return null;
    const t = await r.text();
    return t.length > 600 * 1024 ? t.slice(0, 600 * 1024) : t;
  } catch { return null; }
}

export async function scan({ visual = true } = {}) {
  const url = location.href;
  const raw = (await text(url)) || '';
  const shell = !raw || looksLikeShell(raw);
  // the server's HTML gives honest line numbers; an empty shell needs the live DOM instead
  const html = shell ? '<!doctype html>' + document.documentElement.outerHTML : raw;
  const { css, js } = linkedAssets(html, url);
  const same = (u) => { try { return new URL(u).origin === location.origin && !LIB.test(new URL(u).pathname); } catch { return false; } };
  const assets = [];
  for (const [kind, list, max] of [['css', css, 8], ['js', js, 4]]) {
    for (const u of list.filter(same).slice(0, max)) {
      const t = await text(u);
      if (t) assets.push({ kind, url: u, name: new URL(u).pathname.replace(/^\//, '') || u, text: t });
    }
  }
  const path = location.pathname.replace(/^\/+/, '');
  const C = corpusFromHtml(html, { url, file: shell ? null : (!path || path.endsWith('/') ? path + 'index.html' : path), assets });
  C.serverShell = shell;
  C.visual = visual ? await measureVisual().catch(() => null) : null;
  const { findings, words, lang } = await runRules(C, {});
  const ids = new Set(findings.map((f) => f.id));
  const pageType = ids.has('portfolio-template') || ids.has('no-work-shown') ? 'portfolio' : guessPageType(C.text);
  const r = finalize({ findings: attachActions(findings), words, lang, pageType });
  // AI search readiness, from this page and the site's robots.txt, llms.txt and sitemap
  const robots = await text(location.origin + '/robots.txt');
  const llms = await text(location.origin + '/llms.txt');
  const declared = realText(robots) ? (robots.match(/^\s*sitemap\s*:\s*(\S+)/im) || [])[1] : null;
  let sm = declared && declared.startsWith(location.origin) ? await text(declared) : null;
  if (!realXml(sm)) sm = await text(location.origin + '/sitemap.xml');
  const aeo = readiness([...pageChecks(C, { words, pageType, serverShell: shell }), ...siteChecks({ robots: realText(robots) ? robots : null, llms: realText(llms) ? llms : null, sitemap: realXml(sm) || null })]);
  return { kind: 'page', id: 'browser', target: url, url, rendered: shell, visual: !!C.visual, notes: [], meta: C.meta, ...r, aeo, version: VERSION };
}

/** A compact summary, handy for scripts and calibration. */
export async function summary(opts) {
  const r = await scan(opts);
  return {
    url: r.url, total: r.total, band: r.band, words: r.words, lang: r.lang, pageType: r.pageType, capped: r.capped, aeo: r.aeo?.score ?? null,
    cats: Object.fromEntries(Object.entries(r.cats).map(([k, v]) => [k, Math.round(v.pts * 10) / 10])),
    findings: r.findings.filter((f) => f.kind !== 'info').map((f) => `${f.id}:${Math.round(f.pts * 10) / 10}`),
  };
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function overlay() {
  const lang = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  const T = labels(lang);
  const tr = lang === 'tr';
  document.getElementById('aislopmeter-panel')?.remove();
  const host = document.createElement('div');
  host.id = 'aislopmeter-panel';
  host.style.cssText = 'position:fixed;z-index:2147483647;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));max-height:min(78vh,640px);';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    .p{font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;background:#f7faf9;color:#14232b;border:1px solid #c9d5d2;border-radius:12px;box-shadow:0 8px 30px rgba(20,35,43,.25);overflow:auto;max-height:inherit;padding:14px 16px}
    h2{font-size:15px;margin:0}.s{font-size:40px;font-weight:700;line-height:1}.b{color:#55666d}
    ol{padding-left:18px;margin:10px 0}li{margin:7px 0}li small{display:block;color:#55666d}
    button{font:600 13px system-ui,sans-serif;border:1px solid #14232b;background:#14232b;color:#f7faf9;border-radius:6px;padding:6px 9px;cursor:pointer;margin:2px 4px 2px 0}
    button.g{background:transparent;color:#14232b}.x{float:right;background:none;color:#55666d;border:0;font-size:18px;padding:0 4px}
  </style><div class="p" role="dialog" aria-label="AI Slop Meter"><button class="x" aria-label="Close">×</button><h2>AI Slop Meter</h2><p class="b">${tr ? 'Taranıyor…' : 'Scanning…'}</p></div>`;
  document.documentElement.appendChild(host);
  const panel = root.querySelector('.p');
  root.querySelector('.x').onclick = () => host.remove();
  let r;
  try { r = await scan(); } catch (e) { panel.querySelector('.b').textContent = String(e.message || e); return; }
  const pick = (o) => (typeof o === 'string' ? o : o?.[lang] || o?.en || '');
  const issues = r.findings.filter((f) => f.kind === 'issue').slice(0, 8);
  panel.innerHTML = `<button class="x" aria-label="Close">×</button><h2>AI Slop Meter</h2>
    <p><span class="s">${r.total}</span> <span class="b">/ 100 · ${esc(T.bands[r.band])}</span></p>
    <p class="b">${esc(T.bandText[r.band])}</p>
    ${r.aeo?.total ? `<p class="b">${esc(T.aeo)}: <b>${r.aeo.passed}/${r.aeo.total}</b>${r.aeo.checks.filter((c) => !c.ok).length ? ` · ${tr ? 'eksik' : 'missing'}: ${esc(r.aeo.checks.filter((c) => !c.ok).map((c) => pick(c.label)).join(', '))}` : ''}</p>` : ''}
    <ol>${issues.map((f, i) => `<li><b>${esc(pick(f.title))}</b> <small>${esc(pick(f.fix))}</small><button class="g" data-i="${i}">${tr ? 'Yapay zekâ için kopyala' : 'Copy for your AI'}</button></li>`).join('')}</ol>
    <button data-all="1">${tr ? 'Tüm raporu kopyala' : 'Copy the full report'}</button>
    <p class="b" style="font-size:12px;margin-top:10px">${tr ? 'Bütün site ve dosya:satır için' : 'For the whole site and file:line, run'} <code>npx aislopmeter ${esc(location.origin)}</code></p>`;
  root.querySelector('.x').onclick = () => host.remove();
  const copy = async (t, btn) => { try { await navigator.clipboard.writeText(t); btn.textContent = tr ? 'Kopyalandı' : 'Copied'; } catch { prompt('Copy:', t); } };
  root.querySelectorAll('button[data-i]').forEach((b) => (b.onclick = () => copy(fixPrompt(issues[+b.dataset.i], r, lang), b)));
  root.querySelector('button[data-all]').onclick = (e) => copy(renderReport(r, { lang }), e.target);
  return r;
}
