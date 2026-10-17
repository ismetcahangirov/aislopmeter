// the default suite runs without a browser so results do not depend on the machine
process.env.AISLOPMETER_BROWSER ??= 'off';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanUrl, pageOf, buildRescuePlan, renderHtml, renderReport } from '../src/index.js';
import { parseRobots, pageKey } from '../src/crawl.js';

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
    const one = await scanUrl(`http://127.0.0.1:${port}/`, { pages: 1, render: 'never' });
    assert.ok(one.total >= 60);
    const site = await scanUrl(`127.0.0.1:${port}`, { pages: 2, render: 'never' });
    assert.equal(site.kind, 'site');
    assert.equal(site.pages.length, 2);
    assert.ok(site.total < one.total, 'a clean second page should pull the site score down');
    await assert.rejects(scanUrl(`http://127.0.0.1:${port}/missing`, { pages: 1, render: 'never' }), /HTTP 404/);
  } finally {
    server.close();
  }
});

test('crawls the whole site: sitemap, links, robots.txt, one report per page', async () => {
  const slop = await readFile(join(here, 'fixtures', 'slop-landing.html'), 'utf8');
  const clean = await readFile(join(here, 'fixtures', 'craft-bakery.html'), 'utf8');
  const page = (title, body) => `<!doctype html><html lang="en"><head><title>${title}</title></head><body>${body}</body></html>`;
  const routes = {
    '/': slop.replace('<a href="#">Özellikler</a>', '<a href="/pricing?utm_source=x">Pricing</a><a href="/private/x">Secret</a>'),
    '/pricing': page('Same title', '<h1>Pricing</h1><p>Unlock seamless synergy and elevate your workflow with our cutting-edge, game-changing platform. <a href="/blog/b">More</a></p>'),
    '/about': clean,
    '/blog/a': page('Same title', '<h1>Post A</h1><p>Unlock seamless synergy and elevate your workflow with our cutting-edge, game-changing platform.</p>'),
    '/blog/b': page('Post B', '<h1>Post B</h1><p>Our oven runs from 6am. Rye loaves cost 4 euros.</p>'),
    '/private/x': page('Private', '<p>should never be fetched</p>'),
  };
  const hits = [];
  const server = createServer((req, res) => {
    hits.push(req.url);
    const path = req.url.split('?')[0];
    if (path === '/robots.txt') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('User-agent: *\nDisallow: /private/\nSitemap: /sitemap.xml'); }
    if (path === '/sitemap.xml') { res.writeHead(200, { 'content-type': 'application/xml' }); return res.end(`<?xml version="1.0"?><urlset><url><loc>http://127.0.0.1:${server.address().port}/about</loc></url><url><loc>http://127.0.0.1:${server.address().port}/blog/a</loc></url></urlset>`); }
    if (routes[path]) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(routes[path]); }
    res.writeHead(404); res.end('nope');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const seen = [];
    const site = await scanUrl(`http://127.0.0.1:${port}/`, { render: 'never', onPage: (p) => seen.push(p.path) });
    const paths = site.pages.map((p) => p.path).sort();
    assert.deepEqual(paths, ['/', '/about', '/blog/a', '/blog/b', '/pricing']);
    assert.ok(!hits.some((u) => u.startsWith('/private')), 'robots.txt Disallow is respected');
    assert.equal(seen.length, 5);
    assert.equal(site.pageResults.length, 5);
    // each page keeps its own report
    assert.ok(pageOf(site, '/about').total < 20);
    assert.ok(pageOf(site, `http://127.0.0.1:${port}/`).total >= 60);
    // a problem on several pages is one item with its pages
    const lex = site.findings.find((f) => f.id === 'lexicon');
    assert.ok(lex.pageCount >= 2 && lex.pages.includes('/pricing'));
    assert.ok(site.findings.some((f) => f.id === 'duplicate-meta'));
    const plan = buildRescuePlan(site);
    assert.ok(plan.estimate <= site.total);
    const md = renderReport(site, { lang: 'tr' });
    assert.match(md, /## Sayfalar \(5\)/);
    const html = renderHtml(site, { lang: 'tr' });
    assert.match(html, /id="pages"/);
    assert.match(html, /5 sayfa tarandı/);
  } finally {
    server.close();
  }
});

test('robots.txt rules and page keys', () => {
  const r = parseRobots('User-agent: *\nDisallow: /admin\nAllow: /admin/public\nDisallow: /*.php$\n\nUser-agent: aislopmeter\nDisallow: /nope');
  assert.equal(r.allowed('/nope/x'), false);
  assert.equal(r.allowed('/admin'), true, 'our own group replaces the * group');
  const star = parseRobots('User-agent: *\nDisallow: /admin\nAllow: /admin/public\nDisallow: /*.php$');
  assert.equal(star.allowed('/admin/x'), false);
  assert.equal(star.allowed('/admin/public/y'), true);
  assert.equal(star.allowed('/index.php'), false);
  assert.equal(star.allowed('/index.php?x=1'), true);
  assert.equal(pageKey('https://www.x.com/a/?utm_source=t#top'), pageKey('https://x.com/a'));
});
