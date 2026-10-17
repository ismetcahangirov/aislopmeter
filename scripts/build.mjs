// Builds the two bundled outputs:
//  dist/aislopmeter.browser.js  the in-page scanner (bookmarklet, jsDelivr/unpkg), global AISlopMeter
//  dist/server.mjs              the MCP server and CLI in one file, used by the Claude Desktop extension
import { build } from 'esbuild';
import { mkdir, cp, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
await mkdir(join(root, 'dist'), { recursive: true });

await build({
  entryPoints: [join(root, 'src/browser.js')],
  bundle: true,
  format: 'iife',
  globalName: 'AISlopMeter',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  outfile: join(root, 'dist/aislopmeter.browser.js'),
  external: ['playwright-core', 'node:*'],
  define: { 'process.env.AISLOPMETER_DEBUG': 'undefined', 'process.env.AISLOPMETER_BROWSER': '"off"', 'process.env.AISLOPMETER_CHROME': 'undefined' },
  banner: { js: `/* AI Slop Meter ${pkg.version} (MIT) https://github.com/omergocmen/aislopmeter */` },
  logLevel: 'warning',
});

await build({
  entryPoints: [join(root, 'bin/aislopmeter.js')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  outfile: join(root, 'dist/server.mjs'),
  external: ['playwright-core'],
  // some dependencies still call require(); give the ESM bundle one
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});

// Claude Desktop extension (.mcpb) staging folder: manifest + bundled server + the guides it serves
const ext = join(root, 'dist/mcpb');
await mkdir(join(ext, 'server'), { recursive: true });
await cp(join(root, 'dist/server.mjs'), join(ext, 'server/index.mjs'));
for (const d of ['playbook', 'docs']) await cp(join(root, d), join(ext, d), { recursive: true, filter: (p) => !/\.png$/.test(p) });
const manifest = JSON.parse(await readFile(join(root, 'mcpb/manifest.json'), 'utf8'));
manifest.version = pkg.version;
await writeFile(join(ext, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
try { await cp(join(root, 'mcpb/icon.png'), join(ext, 'icon.png')); } catch { /* optional */ }
console.log(`built dist/aislopmeter.browser.js, dist/server.mjs and dist/mcpb (v${pkg.version})`);
