#!/usr/bin/env node
// aislopmeter <url | folder | file.html> [options]
// aislopmeter mcp            start the MCP server on stdio
import { scanTarget, renderReport, buildRescuePlan, renderRescuePlan, saveReport, openInBrowser, badgeSvg, badgeJson } from '../src/index.js';
import { writeFile } from 'node:fs/promises';
import { VERSION } from '../src/version.js';
import { pathToFileURL } from 'node:url';

const HELP = `AI Slop Meter ${VERSION} — how much AI slop is on this site?

Usage
  aislopmeter <target> [options]     scan a URL, a project folder or an .html file
  aislopmeter mcp                    run as an MCP server (stdio) for Claude, Cursor, Gemini CLI…

Options
  --pages <n|all>     URL: how many pages to crawl (default 30, all = up to 200, 1 = only this page)
  --render <mode>     auto | always | never. auto: if Chrome/Edge is installed, measure colours,
                      contrast, fonts and layout in it and render pages that need JavaScript
  --ignore <a,b>      folder: sub-paths to skip
  --include-ui        folder: also scan components/ui
  --lang <en|tr>      report language (default en)
  --plan              also print the rescue plan
  --html              write the visual report (Report + What-to-do screens) and print its path
  --open              write the visual report and open it in your browser
  --json              print the raw result as JSON
  --fail-above <n>    exit with code 1 when the score is above n (for CI)
  --badge <file>      write a README badge: .svg, or .json for a shields.io endpoint
  --json-file <file>  also write the raw result as JSON to a file
  --no-config         ignore .aislopmeter.json
  -v, --version       print the version
  -h, --help          print this help

Examples
  npx aislopmeter https://example.com              # crawls up to 30 pages
  npx aislopmeter https://example.com --pages all --open
  npx aislopmeter ./my-next-app --plan --lang tr
  npx aislopmeter ./dist/index.html --fail-above 40
`;

function parse(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a === '--json') o.json = true;
    else if (a === '--plan') o.plan = true;
    else if (a === '--html') o.html = true;
    else if (a === '--open') { o.html = true; o.open = true; }
    else if (a === '--include-ui') o.includeUi = true;
    else if (a === '--pages') { const v = val(); o.pages = v === 'all' ? 'all' : +v; }
    else if (a === '--render') o.render = val();
    else if (a === '--lang') o.lang = val();
    else if (a === '--ignore') o.ignore = String(val() || '').split(',').filter(Boolean);
    else if (a === '--fail-above') o.failAbove = +val();
    else if (a === '--badge') o.badge = val();
    else if (a === '--json-file') o.jsonFile = val();
    else if (a === '--no-config') o.noConfig = true;
    else if (a.startsWith('--')) { console.error(`Unknown option ${a}\n`); o.help = true; o.bad = true; }
    else o._.push(a);
  }
  return o;
}

const o = parse(process.argv.slice(2));
const fail = (msg) => { console.error(`aislopmeter: ${msg}`); process.exit(2); };
if ('failAbove' in o && !Number.isFinite(o.failAbove)) fail('--fail-above needs a number');
if ('pages' in o && o.pages !== 'all' && !(Number.isInteger(o.pages) && o.pages >= 1 && o.pages <= 200)) fail('--pages needs a whole number from 1 to 200, or all');
if ('render' in o && !['auto', 'always', 'never'].includes(o.render)) fail('--render must be auto, always or never');
if ('lang' in o && !['en', 'tr'].includes(o.lang)) fail('--lang must be en or tr');
if (o.version) { console.log(VERSION); process.exit(0); }
if (o._[0] === 'mcp') {
  const { startServer } = await import('../src/server.js');
  await startServer();
} else if (o.help || !o._.length) {
  console.log(HELP);
  process.exit(o.bad ? 2 : 0);
} else {
  try {
    let lang = o.lang === 'tr' ? 'tr' : 'en';
    // progress on stderr, so --json output stays clean
    const onPage = process.stderr.isTTY ? (p, done, total) => process.stderr.write(`\r\x1b[K${done}/${total} ${p.path.slice(0, 70)}`) : undefined;
    const r = await scanTarget(o._[0], { pages: o.pages, render: o.render, ignore: o.ignore, includeUi: o.includeUi, onPage, budgetMs: 600000, config: o.noConfig ? false : undefined });
    if (!o.lang && r.config && ['en', 'tr'].includes(r.config.lang)) lang = r.config.lang;
    if (onPage) process.stderr.write('\r\x1b[K');
    if (o.json) {
      const out = o.plan ? { ...r, plan: buildRescuePlan(r) } : r;
      console.log(JSON.stringify(out, null, 2));
    } else {
      console.log(renderReport(r, { lang }));
      if (o.plan) console.log('\n\n' + renderRescuePlan(buildRescuePlan(r), { lang }));
    }
    if (o.html) {
      const file = await saveReport(r, { lang });
      console.error(`\n${lang === 'tr' ? 'Görsel rapor' : 'Visual report'}: ${pathToFileURL(file).href}`);
      if (o.open && !(await openInBrowser(file))) console.error(lang === 'tr' ? 'Tarayıcı açılamadı; dosyayı kendiniz açın.' : 'Could not open a browser; open the file yourself.');
    }
    if (o.badge) await writeFile(o.badge, /\.json$/i.test(o.badge) ? JSON.stringify(badgeJson(r)) + '\n' : badgeSvg(r));
    if (o.jsonFile) await writeFile(o.jsonFile, JSON.stringify(r, null, 2));
    const failAbove = Number.isFinite(o.failAbove) ? o.failAbove : Number.isFinite(r.config?.failAbove) ? r.config.failAbove : null;
    if (failAbove !== null && r.total > failAbove) process.exit(1);
  } catch (e) {
    console.error(`aislopmeter: ${e.message || e}`);
    process.exit(2);
  }
}
