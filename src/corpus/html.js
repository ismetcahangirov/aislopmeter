// Turn a rendered HTML page into the common corpus every rule reads.
import { parseHTML } from 'linkedom';
import { isEmojiOnly, wordsOf } from '../util.js';

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME', 'CANVAS', 'HEAD']);
// code samples are not prose: keep them out of the language rules
const SKIP_TEXT = new Set([...SKIP, 'PRE', 'CODE', 'KBD', 'SAMP']);
const BLOCK = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'BLOCKQUOTE',
  'FIGCAPTION', 'DT', 'DD', 'BUTTON', 'LABEL', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER',
  'NAV', 'MAIN', 'ASIDE', 'TR', 'UL', 'OL', 'FORM', 'BR', 'HR', 'TABLE', 'ADDRESS', 'SUMMARY', 'DETAILS']);

const tag = (n) => String(n.tagName || '').toUpperCase();

function blockText(root) {
  const out = [];
  (function walk(n) {
    if (n.nodeType === 3) { out.push(n.nodeValue); return; }
    if (n.nodeType !== 1 || SKIP_TEXT.has(tag(n))) return;
    const blk = BLOCK.has(tag(n));
    if (blk) out.push('\n');
    for (const c of n.childNodes) walk(c);
    if (blk) out.push('\n');
  })(root);
  return out.join('')
    .replace(/[ \t \r]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

const txt = (el) => String(el.textContent || '').replace(/\s+/g, ' ').trim();

/** Elements whose children repeat with the same tag+class and each hold a heading and a paragraph. */
function countCardGroups(all) {
  let groups = 0;
  for (const el of all) {
    const kids = [...el.children];
    if (kids.length < 3) continue;
    const sig = (k) => tag(k) + '.' + (k.getAttribute('class') || '').split(/\s+/).sort().join('.');
    const counts = {};
    for (const k of kids) counts[sig(k)] = (counts[sig(k)] || 0) + 1;
    const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n < 3) continue;
    const same = kids.filter((k) => sig(k) === best);
    if (same.every((k) => k.querySelector('h2,h3,h4,h5,h6,strong') && k.querySelector('p'))) groups++;
  }
  return groups;
}

function lineIndex(src) {
  const offs = [0];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) offs.push(i + 1);
  return (idx) => {
    let lo = 0, hi = offs.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (offs[mid] <= idx) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

/** When the page is a local file, attach file:line to items by finding them in the source. */
function attachLocations(C, html, file) {
  const lineAt = lineIndex(html);
  const find = (needle, from = 0) => {
    if (!needle) return -1;
    const n = needle.slice(0, 40);
    let i = html.indexOf(n, from);
    if (i < 0) i = html.indexOf(n.split(/\s+/).slice(0, 3).join(' '), from);
    return i;
  };
  // items mostly appear in document order, so search forward from the last hit first
  let cur = 0;
  const put = (item, needle) => {
    let i = find(needle, cur);
    if (i < 0) i = find(needle, 0);
    else cur = i;
    if (i >= 0) item.loc = { file, line: lineAt(i) };
  };
  for (const c of C.copy) put(c, c.text);
  cur = 0;
  for (const c of C.classes) put(c, c.value);
  cur = 0;
  for (const h of C.headings) put(h, h.text);
  for (const b of C.buttons) put(b, b.text);
  for (const b of C.ctas) put(b, b.text);
  for (const e of C.emojiOnly) put(e, e.text);
  for (const b of C.bold) put(b, b.text);
  for (const a of C.links) put(a, a.text || (a.href != null ? `href="${a.href}"` : ''));
  for (const im of C.images) put(im, im.src);
  for (const c of C.comments) put(c, c.text);
  let off = 0;
  for (const c of C.css) {
    const i = html.indexOf(c.text.slice(0, 40), off);
    if (i >= 0) { c.loc = { file, line: lineAt(i) }; off = i; }
  }
  C.sources = [{ file, content: html, lineAt }];
  if (C.meta) C.meta.file = file;
}

export function corpusFromHtml(html, { url = '', file = null } = {}) {
  const C = buildCorpus(html, { url });
  if (file) attachLocations(C, html, file);
  return C;
}

function buildCorpus(html, { url = '' } = {}) {
  // linkedom does not invent <html>/<body>; markup that omits them (valid HTML5, common when minified) needs a wrapper
  const src = !String(html).trim() ? '<!doctype html><html><head></head><body></body></html>'
    : /<body[\s>]/i.test(html) ? html
    : /<html[\s>]/i.test(html) ? html.replace(/<\/head\s*>|<html\b[^>]*>/i, '$&<body>')
    : `<!doctype html><html><head></head><body>${html}</body></html>`;
  const { document: doc } = parseHTML(src);
  const body = doc.body || doc.documentElement;
  const all = [...doc.querySelectorAll('*')];
  const text = body ? blockText(body) : '';

  const classes = [];
  for (const el of all) {
    const c = el.getAttribute && el.getAttribute('class');
    if (c) classes.push({ value: c });
  }
  const css = [...doc.querySelectorAll('style')].map((s) => ({ text: s.textContent || '' }));
  for (const el of all) {
    const st = el.getAttribute && el.getAttribute('style');
    if (st) css.push({ text: st });
  }
  const comments = [...html.matchAll(/<!--([\s\S]{0,2000}?)-->/g)].map((m) => ({ text: m[1].trim() }));
  const links = [...doc.querySelectorAll('a')].map((a) => ({ href: (a.getAttribute('href') ?? '').trim(), hasHref: a.hasAttribute('href'), text: txt(a) }));
  const images = [...doc.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src') || '', alt: i.hasAttribute('alt') ? i.getAttribute('alt') : null }));
  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ level: +tag(h)[1], text: txt(h) }));
  const buttons = [...doc.querySelectorAll('button,[role=button],a.btn,a.button')].map((b) => ({ text: txt(b) }));
  const ctas = [...doc.querySelectorAll('button,a')].map((b) => ({ text: txt(b) })).filter((b) => b.text && wordsOf(b.text).length <= 6);
  const emojiOnly = all
    .filter((e) => e.children && e.children.length === 0 && !SKIP.has(tag(e)) && isEmojiOnly(String(e.textContent || '').trim()))
    .map((e) => ({ text: String(e.textContent).trim() }));
  const bold = [...doc.querySelectorAll('strong,b')].filter((e) => txt(e)).map((e) => ({ text: txt(e) }));
  const paragraphs = doc.querySelectorAll('p').length;
  const meta = (name) => {
    const m = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return m ? m.getAttribute('content') || '' : null;
  };
  const scripts = [...doc.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'));
  const linkHrefs = [...doc.querySelectorAll('link[href]')].map((l) => l.getAttribute('href'));
  const htmlEl = doc.documentElement;

  return {
    kind: 'page',
    url,
    text,
    copy: text.split('\n').filter(Boolean).map((t) => ({ text: t })),
    classes,
    css,
    comments,
    links,
    images,
    headings,
    buttons,
    ctas,
    emojiOnly,
    bold,
    paragraphs,
    cardGroups: countCardGroups(all),
    featureArrays: 0,
    fonts: [...css.map((c) => c.text), ...linkHrefs].join(' '),
    scripts,
    raw: html,
    meta: {
      title: (doc.querySelector('title')?.textContent || '').trim() || null,
      description: meta('description'),
      ogTitle: meta('og:title'),
      ogImage: meta('og:image'),
      generator: meta('generator'),
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      lang: htmlEl?.getAttribute?.('lang') || null,
      viewport: !!doc.querySelector('meta[name="viewport"]'),
      jsonld: doc.querySelectorAll('script[type="application/ld+json"]').length,
    },
    shellRoot: !!doc.querySelector('#root, #app, #__next, #__nuxt, [data-reactroot], #svelte'),
  };
}
