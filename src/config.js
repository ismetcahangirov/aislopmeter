// .aislopmeter.json: per-project settings, so a false alarm can be switched off for good.
// {
//   "disable": ["purple-gradient"],          // check ids that should not count here
//   "keep": "Our purple logo colour",        // passed to the rescue plan as "do not touch"
//   "ignore": ["legacy", "docs/old"],        // folder scans: extra paths to skip
//   "pages": 30, "lang": "tr", "targetScore": 20, "render": "auto"
// }
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

export const CONFIG_FILE = '.aislopmeter.json';
const KEYS = ['disable', 'keep', 'ignore', 'pages', 'lang', 'targetScore', 'render', 'failAbove'];

/** Find the config for a target: the target folder (or its parents), else the working directory. */
export async function loadConfig(target, { cwd = process.cwd() } = {}) {
  const tried = new Set();
  const dirs = [];
  try {
    const st = await stat(resolve(String(target || '')));
    let d = st.isDirectory() ? resolve(target) : dirname(resolve(target));
    for (let i = 0; i < 6 && d; i++) { dirs.push(d); const up = dirname(d); if (up === d) break; d = up; }
  } catch { /* a URL */ }
  dirs.push(resolve(cwd));
  for (const d of dirs) {
    const file = join(d, CONFIG_FILE);
    if (tried.has(file)) continue;
    tried.add(file);
    let text;
    try { text = await readFile(file, 'utf8'); } catch { continue; }
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error(`${file} is not valid JSON: ${e.message}`); }
    const cfg = {};
    for (const k of KEYS) if (data[k] !== undefined) cfg[k] = data[k];
    if (data.allow && !cfg.disable) cfg.disable = data.allow; // accepted alias
    if (cfg.disable && !Array.isArray(cfg.disable)) cfg.disable = [String(cfg.disable)];
    if (cfg.ignore && !Array.isArray(cfg.ignore)) cfg.ignore = [String(cfg.ignore)];
    return { ...cfg, file };
  }
  return {};
}
