// Turn a project's source files into the common corpus, keeping file:line for every item
// so an AI agent can edit the exact spot.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname, basename, sep, resolve } from 'node:path';
import { isEmojiOnly, wordsOf } from '../util.js';

const EXT = new Set(['.html', '.htm', '.jsx', '.tsx', '.js', '.ts', '.mjs', '.vue', '.svelte', '.astro',
  '.mdx', '.md', '.css', '.scss', '.sass', '.less', '.json']);
const MARKUP = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.mdx']);
const SCRIPT = new Set(['.js', '.ts', '.mjs', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const STYLE = new Set(['.css', '.scss', '.sass', '.less']);
// Never source code, at any depth
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', '.nuxt', '.output', '.svelte-kit', '.astro', 'coverage',
  'vendor', '.vercel', '.netlify', '.turbo', '.cache', '.idea', '.vscode', '__tests__', '__mocks__', 'cypress',
  'playwright-report', 'storybook-static', '.aislopmeter', 'venv', '.venv', '__pycache__']);
// Build output, tests and repo documentation: skipped only at the top of the scanned folder,
// so a route like app/build/page.tsx is still read. Scan such a folder directly to include it.
const ROOT_ONLY_DIRS = new Set(['dist', 'build', 'out', 'target', 'test', 'tests', 'e2e', 'docs', 'examples', 'example']);
const REPO_DOCS = /^(?:README|CHANGELOG|CONTRIBUTING|LICENSE|CODE_OF_CONDUCT|SECURITY|HISTORY|AUTHORS|DESIGN|AGENTS|CLAUDE|GEMINI)(?:\.[\w.-]+)?$/i;
const IGNORE_FILE = /(?:\.min\.|\.d\.ts$|\.test\.|\.spec\.|\.stories\.|package-lock\.json$|pnpm-lock|yarn\.lock|tsconfig.*\.json$|\.eslintrc|components\.json$|manifest\.json$)/;
// shadcn/ui primitives are library code the owner rarely touched; skip them by default.
const UI_PRIMITIVES = /(?:^|[\\/])components[\\/]ui[\\/]/;
const JSON_COPY_PATH = /(?:locale|i18n|lang|messages|translations|content|copy|data)/i;

const MAX_FILES = 3000;
const MAX_SIZE = 400 * 1024;

function lineIndex(src) {
  const offs = [0];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) offs.push(i + 1);
  return (idx) => {
    let lo = 0, hi = offs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offs[mid] <= idx) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}

async function walk(root, opts) {
  const out = [];
  const ignored = (rel) => opts.ignore.some((g) => rel === g || rel.startsWith(g + '/'));
  async function go(dir, depth = 0) {
    if (out.length >= MAX_FILES) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= MAX_FILES) return;
      const p = join(dir, e.name);
      const rel = relative(root, p).split(sep).join('/');
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue;
        if (depth === 0 && ROOT_ONLY_DIRS.has(e.name)) continue;
        if (ignored(rel)) continue;
        await go(p, depth + 1);
      } else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        if (!EXT.has(ext) || IGNORE_FILE.test(e.name)) continue;
        if (depth === 0 && REPO_DOCS.test(e.name)) continue;
        if (!opts.includeUi && UI_PRIMITIVES.test(rel)) continue;
        if (ext === '.json' && e.name !== 'package.json' && !JSON_COPY_PATH.test(rel)) continue;
        if (ignored(rel)) continue;
        out.push(p);
      }
    }
  }
  await go(root);
  return out;
}

// A token that looks like a Tailwind/utility class rather than a word.
const UTIL = /^!?(?:[a-z0-9-]+:)*-?(?:[a-z]+-[a-z0-9.\/\[\]#%_()-]+|flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|static|italic|underline|uppercase|lowercase|capitalize|truncate|container|border|rounded|shadow|transition|antialiased|prose|group|peer|sr-only|contents|isolate|grow|shrink)(?:\/\d+)?$/;
const looksLikeClasses = (s) => {
  const t = s.trim().split(/\s+/);
  if (t.length < 2) return t.length === 1 && /-/.test(t[0]) && UTIL.test(t[0]);
  return t.filter((x) => UTIL.test(x)).length / t.length >= 0.7;
};
const looksLikeProse = (s) => {
  const t = s.trim();
  if (t.length < 8 || !/\s/.test(t)) return false;
  if (/^(?:https?:|\/|\.\/|\.\.\/|@\/|~\/|data:)/.test(t)) return false;
  if (/[{};]|=>|\(\)|<\/?[a-z]/i.test(t)) return false;
  if (looksLikeClasses(t)) return false;
  const ws = wordsOf(t);
  if (ws.length < 3) return false;
  const letters = (t.match(/\p{L}/gu) || []).length;
  return letters / t.length > 0.6;
};
const stripTags = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function extractFile(rel, ext, src, C) {
  const lineAt = lineIndex(src);
  const loc = (i) => ({ file: rel, line: lineAt(i) });
  const isMarkup = MARKUP.has(ext);
  const isScript = SCRIPT.has(ext);
  const isStyle = STYLE.has(ext);
  C.sources.push({ file: rel, content: src, lineAt });

  if (isStyle) { C.css.push({ text: src, loc: loc(0) }); C.fontsText.push(src); return; }

  if (ext === '.md' || ext === '.mdx') {
    // blank out fenced code (keeping line numbers) so samples do not count as prose
    const body = src.replace(/^---[\s\S]{0,5000}?---/, '').replace(/^(```|~~~)[\s\S]*?^\1/gm, (m) => m.replace(/[^\n]/g, ' '));
    let off = src.length - body.length;
    for (const line of body.split('\n')) {
      const t = line.replace(/^\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s?)/, '').replace(/[*_`]/g, '').trim();
      if (t && wordsOf(t).length >= 2 && !/^(?:import|export)\s/.test(t)) {
        C.copy.push({ text: t, loc: loc(off), md: true });
        const h = line.match(/^\s*(#{1,6})\s+(.*)/);
        if (h) C.headings.push({ level: h[1].length, text: h[2].trim(), loc: loc(off) });
      }
      off += line.length + 1;
    }
  }

  if (ext === '.json') {
    if (basename(rel) === 'package.json') { C.packageJson.push({ text: src, loc: loc(0) }); return; }
    for (const m of src.matchAll(/:\s*"((?:\\.|[^"\\]){6,600})"/g)) {
      const v = m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
      if (looksLikeProse(v) || (wordsOf(v).length >= 2 && !looksLikeClasses(v) && !/^[./@]/.test(v))) C.copy.push({ text: v, loc: loc(m.index) });
    }
    return;
  }

  // class lists
  const seenClassIdx = new Set();
  for (const m of src.matchAll(/\b(?:class|className|:class|tw)\s*=\s*\{?\s*(["'`])([^"'`]*?)\1/g)) {
    const open = src.slice(Math.max(0, m.index - 300), m.index);
    const tag = ((open.match(/<([a-zA-Z][\w.]*)[^<>]*$/) || [])[1] || '').toLowerCase();
    C.classes.push({ value: m[2], loc: loc(m.index), tag });
    seenClassIdx.add(m.index + m[0].indexOf(m[2]));
  }
  if (isScript) {
    for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n]){2,500})\1/g)) {
      const at = m.index + 1;
      if (seenClassIdx.has(at)) continue;
      if (looksLikeClasses(m[2])) C.classes.push({ value: m[2], loc: loc(m.index) });
    }
  }

  // <style> blocks
  for (const m of src.matchAll(/<style\b[^>]{0,300}>([\s\S]{0,200000}?)<\/style>/gi)) { C.css.push({ text: m[1], loc: loc(m.index) }); C.fontsText.push(m[1]); }

  // comments
  for (const m of src.matchAll(/<!--([\s\S]{0,2000}?)-->/g)) C.comments.push({ text: m[1].trim(), loc: loc(m.index) });
  if (isScript) {
    for (const m of src.matchAll(/\{\s*\/\*([\s\S]{0,500}?)\*\/\s*\}/g)) C.comments.push({ text: m[1].trim(), loc: loc(m.index), jsx: true });
    for (const m of src.matchAll(/(?<![:"'`\\])\/\/[ \t]*([^\n]{2,120})/g)) C.comments.push({ text: m[1].trim(), loc: loc(m.index) });
  }

  // visible copy between tags (code samples blanked out, line numbers kept)
  if (isMarkup) {
    const visible = src.replace(/<(pre|code)\b[^>]{0,300}>[\s\S]{0,20000}?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
    for (const m of visible.matchAll(/>([^<>{}`]*[\p{L}\p{N}][^<>{}`]*)</gu)) {
      const t = m[1].replace(/\s+/g, ' ').trim();
      if (!t || /=>|;\s*$|^\s*\)/.test(t)) continue;
      if (wordsOf(t).length >= 1) C.copy.push({ text: t, loc: loc(m.index + 1), tagText: true });
    }
  }
  // natural-language string literals (props, data arrays, i18n objects)
  if (isScript || isMarkup) {
    for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n]){8,600})\1/g)) {
      const v = m[2].replace(/\$\{[^}]*\}/g, ' ');
      if (looksLikeProse(v)) C.copy.push({ text: v, loc: loc(m.index) });
    }
  }

  // headings
  for (const m of src.matchAll(/<h([1-6])\b[^>]{0,500}>([\s\S]{0,1000}?)<\/h\1>/gi)) {
    const t = stripTags(m[2]);
    C.headings.push({ level: +m[1], text: t, loc: loc(m.index) });
  }
  // buttons and links with their text
  for (const m of src.matchAll(/<(button|Button|a|Link|NavLink)\b([^>]{0,500})>([\s\S]{0,200}?)<\/\1>/g)) {
    const t = stripTags(m[3]);
    if (/^(?:button|Button)$/.test(m[1])) C.buttons.push({ text: t, loc: loc(m.index) });
    if (t && wordsOf(t).length <= 6) C.ctas.push({ text: t, loc: loc(m.index) });
    const href = m[2].match(/\b(?:href|to)\s*=\s*\{?\s*(["'`])([^"'`]*)\1/);
    if (/^(?:a|Link|NavLink)$/.test(m[1])) C.links.push({ href: href ? href[2].trim() : null, hasHref: !!href, text: t, loc: loc(m.index) });
  }
  // images
  for (const m of src.matchAll(/<(img|Image)\b([^>]{0,800}?)\/?>/gs)) {
    const attrs = m[2];
    const alt = attrs.match(/\balt\s*=\s*\{?\s*(["'`])([^"'`]*)\1/);
    const srcm = attrs.match(/\bsrc\s*=\s*\{?\s*(["'`])([^"'`]*)\1/);
    C.images.push({ src: srcm ? srcm[2] : '', alt: alt ? alt[2] : /\balt\s*=/.test(attrs) ? '(dynamic)' : null, loc: loc(m.index) });
  }
  // bold + paragraphs
  for (const m of src.matchAll(/<(strong|b)\b[^>]*>([\s\S]{1,120}?)<\/\1>/g)) C.bold.push({ text: stripTags(m[2]), loc: loc(m.index) });
  C.paragraphs += (src.match(/<p\b/g) || []).length;

  // emoji used as icons: icon: "🚀" in data, or a tag whose only text is an emoji
  for (const m of src.matchAll(/\b(?:icon|emoji)\s*:\s*["'`]([^"'`]{1,12})["'`]/gu)) if (isEmojiOnly(m[1])) C.emojiOnly.push({ text: m[1], loc: loc(m.index) });
  for (const m of src.matchAll(/>\s*([^<>{}\s]{1,12})\s*</gu)) if (isEmojiOnly(m[1])) C.emojiOnly.push({ text: m[1], loc: loc(m.index) });

  // feature-card data arrays: { icon, title, description }
  const fa = src.match(/\{\s*(?:icon|emoji|Icon)\s*:[^{}]{0,200}?\btitle\s*:[^{}]{0,400}?\b(?:description|desc|text|body)\s*:/gs) || [];
  const fb = src.match(/\{\s*title\s*:[^{}]{0,300}?\b(?:description|desc|text)\s*:[^{}]{0,400}?\b(?:icon|emoji|Icon)\s*:/gs) || [];
  if (fa.length + fb.length >= 3) C.featureArrays += 1;

  // fonts
  const nf = src.match(/import\s*\{([^}]{1,500})\}\s*from\s*['"]next\/font\/google['"]/);
  if (nf) C.fontsText.push(nf[1]);
  for (const m of src.matchAll(/fonts\.googleapis\.com\/css2?\?[^"'`\s)]+/g)) C.fontsText.push(m[0]);
  if (/tailwind\.config|theme\.(?:ts|js)$/.test(rel)) C.fontsText.push(src);
}

export async function corpusFromProject(root, { ignore = [], includeUi = false } = {}) {
  const st = await stat(root).catch(() => null);
  if (!st || !st.isDirectory()) throw new Error(`Not a folder: ${root}`);
  // accept "legacy", "./legacy/", "src\\old", an absolute path, or a path relative to where the command ran
  const toRel = (abs) => relative(root, abs).split(sep).join('/').replace(/\/+$/, '');
  const norm = [...new Set(ignore.flatMap((g) => {
    const v = String(g).trim().replace(/\\/g, '/');
    return v ? [toRel(resolve(root, v)), toRel(resolve(process.cwd(), v))] : [];
  }))].filter((g) => g && !g.startsWith('..') && !g.startsWith('/'));
  const files = await walk(root, { ignore: norm, includeUi });
  const C = {
    kind: 'project', root, url: '', files: 0, skippedLarge: 0,
    copy: [], classes: [], css: [], comments: [], links: [], images: [], headings: [], buttons: [], ctas: [],
    emojiOnly: [], bold: [], paragraphs: 0, cardGroups: 0, featureArrays: 0, fontsText: [], packageJson: [],
    sources: [], meta: null, shellRoot: false,
  };
  for (const f of files) {
    const s = await stat(f).catch(() => null);
    if (!s || s.size > MAX_SIZE) { C.skippedLarge++; continue; }
    const src = await readFile(f, 'utf8').catch(() => null);
    if (src == null) continue;
    C.files++;
    extractFile(relative(root, f).split(sep).join('/'), extname(f).toLowerCase(), src, C);
  }
  // de-duplicate copy (the same string often shows up via both passes)
  const seen = new Set();
  C.copy = C.copy.filter((c) => {
    const k = c.text + '|' + c.loc.file + ':' + c.loc.line;
    const k2 = c.text;
    if (seen.has(k) || seen.has(k2)) return false;
    seen.add(k); seen.add(k2);
    return true;
  });
  C.text = C.copy.map((c) => c.text).join('\n');
  C.fonts = C.fontsText.join(' ');
  C.raw = C.sources.map((s) => s.content).join('\n');
  // index.html-style shells: meta from the main html file if present
  const indexHtml = C.sources.find((s) => /(?:^|\/)index\.html?$/.test(s.file));
  if (indexHtml) {
    const t = indexHtml.content.match(/<title>([^<]*)<\/title>/i);
    const d = indexHtml.content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i);
    C.meta = { title: t ? t[1].trim() : null, description: d ? d[1] : null, file: indexHtml.file, titleLine: t ? indexHtml.lineAt(t.index) : 1 };
  }
  return C;
}
