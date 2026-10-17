// Turn findings into category scores, a total and a band.

export const CATEGORIES = {
  content: { max: 35 },
  language: { max: 25 },
  design: { max: 20 },
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
  if (active < 3 && total > 45) { total = 45; capped = true; }
  total = Math.round(total);
  const band = BANDS.find((b) => total <= b.max).key;
  for (const f of result.findings) f.severity = severityOf(f.pts);
  result.findings.sort((a, b) => b.pts - a.pts);
  return Object.assign(result, { cats, total, band, active, capped });
}

/** Combine several page results into one site result. */
export function combinePages(pages) {
  const cats = {};
  for (const k of ORDER) {
    const vals = pages.map((p) => p.cats[k].pts);
    cats[k] = { max: CATEGORIES[k].max, pts: vals.reduce((a, b) => a + b, 0) / vals.length };
  }
  const totals = pages.map((p) => p.total);
  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  const total = Math.round(0.7 * mean + 0.3 * Math.max(...totals));
  const band = BANDS.find((b) => total <= b.max).key;
  return { cats, total, band };
}
