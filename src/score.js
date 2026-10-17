// Turn findings into category scores, a total and a band.

export const CATEGORIES = {
  content: { max: 30 },
  language: { max: 22 },
  design: { max: 28 },
  finish: { max: 15 },
  builder: { max: 5 },
};
export const ORDER = ['content', 'language', 'design', 'finish', 'builder'];
// Strengths (negative points) can lower the content score by at most this much.
export const STRENGTH_BUDGET = 10;

export const BANDS = [
  { max: 19, key: 'clean' },
  { max: 39, key: 'trace' },
  { max: 59, key: 'noticeable' },
  { max: 79, key: 'heavy' },
  { max: 100, key: 'pure' },
];

export function severityOf(pts) {
  if (pts < 0) return 'strength';
  if (pts >= 5) return 'high';
  if (pts >= 2.5) return 'medium';
  return 'low';
}

export function finalize(result) {
  const cats = {};
  for (const k of ORDER) {
    const fs = result.findings.filter((f) => f.cat === k);
    const raw = fs.reduce((a, f) => a + f.pts, 0);
    cats[k] = { max: CATEGORIES[k].max, raw, pts: Math.max(0, Math.min(CATEGORIES[k].max, raw)) };
  }
  let total = ORDER.reduce((a, k) => a + cats[k].pts, 0);
  // A high score needs evidence in several areas: one loud area alone is a style choice, not slop.
  const active = ['content', 'language', 'design', 'finish'].filter((k) => cats[k].pts >= cats[k].max * 0.25).length;
  let capped = false;
  const cap = active <= 1 ? 35 : active === 2 ? 60 : 100;
  if (total > cap) { total = cap; capped = true; }
  total = Math.round(total);
  const band = BANDS.find((b) => total <= b.max).key;
  for (const f of result.findings) f.severity = severityOf(f.pts);
  result.findings.sort((a, b) => b.pts - a.pts);
  return Object.assign(result, { cats, total, band, active, capped });
}

/** Pages that say little about the site's voice: legal text, sign-in, tiny pages. */
const UTILITY = /(?:privacy|gizlilik|terms|kosullar|koşullar|kullanim-sartlari|cookie|cerez|çerez|kvkk|legal|imprint|impressum|disclaimer|login|log-in|signin|sign-in|signup|sign-up|register|giris|giriş|kayit|kayıt|404|sitemap|search|arama)/i;

/** Combine several page results into one site result: half the (weighted) average page, half the worst page. */
export function combinePages(pages) {
  let counted = pages.filter((p) => !(p.path && UTILITY.test(p.path)) && !(p.words != null && p.words < 80));
  if (!counted.length) counted = pages;
  const weight = (p) => (p.path === '/' || p.path === '' ? 2 : 1);
  const W = counted.reduce((a, p) => a + weight(p), 0);
  const cats = {};
  for (const k of ORDER) cats[k] = { max: CATEGORIES[k].max, pts: counted.reduce((a, p) => a + p.cats[k].pts * weight(p), 0) / W };
  const mean = counted.reduce((a, p) => a + p.total * weight(p), 0) / W;
  const total = Math.round(0.5 * mean + 0.5 * Math.max(...counted.map((p) => p.total)));
  const band = BANDS.find((b) => total <= b.max).key;
  return { cats, total, band, counted: counted.length };
}
