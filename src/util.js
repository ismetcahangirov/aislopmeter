// Small text helpers shared by every rule.

export const lowTR = (s) => s.toLocaleLowerCase('tr-TR');
export const lowEN = (s) => s.toLowerCase();
export const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const clip = (s, n = 140) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};
export const uniq = (a) => [...new Set(a)];
export const round1 = (n) => Math.round(n * 10) / 10;
export const wordsOf = (s) => String(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];

export const splitSentences = (line) =>
  String(line)
    .split(/(?<=[.!?…])\s+(?=[\p{Lu}\p{N}"“'‘(])/u)
    .map((x) => x.trim())
    .filter(Boolean);

export const EMOJI = /\p{Extended_Pictographic}/u;
export const isEmojiOnly = (t) => {
  const s = String(t).replace(/[️‍\s]/g, '');
  return s.length > 0 && s.length <= 8 && /^\p{Extended_Pictographic}+$/u.test(s);
};

/** Title-case lines (headings, nav) inflate proper-noun counts; skip them for prose metrics. */
export const isTitleCase = (line) => {
  const ws = wordsOf(line).filter((w) => /^\p{L}/u.test(w));
  if (ws.length < 3) return false;
  const caps = ws.filter((w) => /^\p{Lu}/u.test(w)).length;
  return caps / ws.length >= 0.6;
};

export function detectLang(text) {
  const lo = lowTR(text);
  const tr =
    (lo.match(/[ğışçöü]/g) || []).length +
    4 * (lo.match(/(?<![\p{L}])(?:ve|bir|bu|için|ile|da|de|çok|daha|olarak)(?![\p{L}])/gu) || []).length;
  const en = 4 * (lo.match(/(?<![\p{L}])(?:the|and|of|to|is|for|with|your|you|are)(?![\p{L}])/gu) || []).length;
  return tr >= en ? 'tr' : 'en';
}

/** Count phrase hits from a word start (so Turkish suffixes still match). Returns {phrase: count}. */
export function countPhrases(lowText, list) {
  const hits = {};
  for (const p of list) {
    const re = new RegExp(`(?<![\\p{L}])${reEsc(p)}`, 'gu');
    const m = lowText.match(re);
    if (m) hits[p] = m.length;
  }
  return hits;
}
export const sumHits = (h) => Object.values(h).reduce((a, b) => a + b, 0);
export const hitList = (h, n = 10) =>
  Object.entries(h)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => (v > 1 ? `${k} ×${v}` : k));

/* ---------- colour ---------- */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
export function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  h = h.slice(0, 6);
  return rgbToHsl(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
}
export function colorsIn(str) {
  const out = [];
  for (const m of str.matchAll(/#([0-9a-f]{3,8})\b/gi)) if ([3, 4, 6, 8].includes(m[1].length)) out.push(hexToHsl(m[1]));
  for (const m of str.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi)) out.push(rgbToHsl(+m[1], +m[2], +m[3]));
  for (const m of str.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) out.push({ h: +m[1], s: +m[2], l: +m[3] });
  for (const m of str.matchAll(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/gi)) {
    // rough: oklch hue 280-330 ≈ purple/violet in sRGB terms
    const L = +m[1] > 1 ? +m[1] / 100 : +m[1];
    out.push({ h: oklchHueToHsl(+m[3]), s: +m[2] > 0.08 ? 60 : 10, l: L * 100 });
  }
  return out;
}
// Map an OKLCH hue onto the HSL hue wheel closely enough for "is this purple?" checks.
function oklchHueToHsl(h) {
  const pts = [[0, 330], [30, 0], [70, 30], [110, 55], [145, 120], [195, 180], [250, 215], [265, 230], [285, 255], [305, 275], [330, 300], [360, 330]];
  for (let i = 1; i < pts.length; i++) {
    if (h <= pts[i][0]) {
      const [a0, b0] = pts[i - 1], [a1, b1] = pts[i];
      return b0 + ((h - a0) / (a1 - a0)) * (((b1 - b0 + 540) % 360) - 180);
    }
  }
  return h;
}
export const isPurple = (c) => c.h >= 245 && c.h <= 300 && c.s >= 30 && c.l >= 20 && c.l <= 85;

export async function gzipRatio(str) {
  try {
    if (typeof CompressionStream === 'undefined' || !str) return null;
    const bytes = new TextEncoder().encode(str);
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return bytes.length / buf.byteLength;
  } catch {
    return null;
  }
}
