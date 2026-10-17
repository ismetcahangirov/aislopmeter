// Keeps recent scans in memory so tools can refer to them by id (rescue plans, before/after compare).
const scans = new Map();
let n = 0;
const MAX = 50;

export function remember(result) {
  const id = `s${++n}`;
  const r = { id, createdAt: new Date().toISOString(), ...result };
  scans.set(id, r);
  if (scans.size > MAX) scans.delete(scans.keys().next().value);
  return r;
}
export const getScan = (id) => scans.get(String(id)) || null;
export const listScans = () => [...scans.values()].map((s) => ({ id: s.id, target: s.target, total: s.total, band: s.band, createdAt: s.createdAt }));
/** Most recent earlier scan of the same target, for automatic before/after. */
export function previousOf(r) {
  const prev = [...scans.values()].filter((s) => s.target === r.target && s.id !== r.id);
  return prev.length ? prev[prev.length - 1] : null;
}
/** All scans of the same target in this session, oldest first. */
export const historyOf = (target) => [...scans.values()].filter((s) => s.target === target);
