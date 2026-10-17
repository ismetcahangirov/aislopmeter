// DESIGN.md: the fonts, colours and corner radii a project has decided on.
// The design-drift check compares the stylesheets with it. Plain text parsing, no fixed format:
// colours are hex codes anywhere, fonts are names on lines that talk about type, radii are px values
// on lines that talk about radius.
import { readFile } from 'node:fs/promises';
import { join, resolve, isAbsolute, dirname } from 'node:path';

export const DESIGN_FILES = ['DESIGN.md', 'design.md', 'docs/DESIGN.md', 'docs/design.md', '.github/DESIGN.md'];
const GENERIC = /^(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[\w-]+|-apple-system|blinkmacsystemfont|inherit|initial|unset|revert|emoji|math|fangsong|var\(.*|arial|helvetica(?: neue)?|georgia|times(?: new roman)?|segoe ui|roboto|consolas|menlo|monaco|courier(?: new)?|sfmono-regular|liberation mono|noto color emoji|apple color emoji|segoe ui emoji)$/i;

export const hex6 = (h) => {
  let x = String(h).toLowerCase().replace(/^#/, '');
  if (x.length === 3 || x.length === 4) x = x.slice(0, 3).split('').map((c) => c + c).join('');
  return x.length >= 6 ? '#' + x.slice(0, 6) : null;
};

export function parseDesignSpec(md) {
  const text = String(md || '');
  const colors = new Set();
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) { const h = hex6(m[0]); if (h) colors.add(h); }
  const fonts = new Set();
  const radii = new Set();
  let section = '';
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*#{1,6}\s/.test(line)) section = line.toLowerCase();
    const typeSection = /type|typography|font|yazı|tipografi/.test(section);
    const radiusSection = /radius|radii|corner|köşe|shape|şekil/.test(section);
    if (typeSection || /font|typeface|type ?face|typography|yazı tipi|font ailesi|heading|body|başlık|gövde/i.test(line)) {
      for (const m of line.matchAll(/[`'"“”]([A-Z][\w .+-]{1,40}?)[`'"“”]/g)) fonts.add(m[1].trim().toLowerCase());
      const fam = line.match(/font-family\s*:\s*([^;]+)/i);
      if (fam) for (const f of fam[1].split(',')) fonts.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const after = line.match(/:\s*([A-Z][\w-]+(?: [A-Z0-9][\w-]+){0,3})\s*(?:[,(—–-]|$)/);
      if (after && !/^(?:Use|Body|Headings?|Display|Text|Font|Fonts)$/.test(after[1])) fonts.add(after[1].toLowerCase());
    }
    if (radiusSection || /radius|radii|corner|köşe/i.test(line)) for (const m of line.matchAll(/(\d+(?:\.\d+)?)\s*px/g)) radii.add(+m[1]);
  }
  for (const f of [...fonts]) if (GENERIC.test(f) || f.length < 3) fonts.delete(f);
  return { colors, fonts, radii, empty: !colors.size && !fonts.size && !radii.size };
}

/** DESIGN.md of a folder, or the file named in .aislopmeter.json ("design": "docs/DESIGN.md"). */
export async function loadDesignSpec({ root = null, file = null, configFile = null } = {}) {
  const candidates = [];
  if (file) candidates.push(isAbsolute(file) ? file : resolve(configFile ? dirname(configFile) : process.cwd(), file));
  if (root) for (const n of DESIGN_FILES) candidates.push(join(root, n));
  for (const p of candidates) {
    try {
      const spec = parseDesignSpec(await readFile(p, 'utf8'));
      if (!spec.empty) return { ...spec, file: p };
    } catch { /* next */ }
  }
  return null;
}
