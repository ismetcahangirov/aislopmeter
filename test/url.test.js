import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanUrl } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));

test('scans a live URL and follows internal links', async () => {
  const landing = (await readFile(join(here, 'fixtures', 'slop-landing.html'), 'utf8')).replace('<a href="#">Özellikler</a>', '<a href="/about">Özellikler</a>');
  const about = await readFile(join(here, 'fixtures', 'craft-bakery.html'), 'utf8');
  const server = createServer((req, res) => {
    if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(landing); }
    else if (req.url === '/about') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(about); }
    else { res.writeHead(404); res.end('nope'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const one = await scanUrl(`http://127.0.0.1:${port}/`, { render: 'never' });
    assert.ok(one.total >= 60);
    const site = await scanUrl(`127.0.0.1:${port}`, { pages: 2, render: 'never' });
    assert.equal(site.kind, 'site');
    assert.equal(site.pages.length, 2);
    assert.ok(site.total < one.total, 'a clean second page should pull the site score down');
    await assert.rejects(scanUrl(`http://127.0.0.1:${port}/missing`, { render: 'never' }), /HTTP 404/);
  } finally {
    server.close();
  }
});
