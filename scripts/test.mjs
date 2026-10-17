// Runs every test/*.test.js. Lists the files here because Node 20 on Windows
// does not expand the glob itself (Node 21+ and Unix shells do).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const files = readdirSync('test').filter((f) => f.endsWith('.test.js')).sort().map((f) => join('test', f));
const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
