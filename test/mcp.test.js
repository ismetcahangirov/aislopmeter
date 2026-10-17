// the default suite runs without a browser so results do not depend on the machine
process.env.AISLOPMETER_BROWSER ??= 'off';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = dirname(fileURLToPath(import.meta.url));
const bin = join(here, '..', 'bin', 'aislopmeter.js');

test('MCP server: scan, plan, re-scan with automatic compare', async () => {
  const reportDir = await mkdtemp(join(tmpdir(), 'aislopmeter-'));
  const client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [bin, 'mcp'], env: { ...process.env, AISLOPMETER_REPORT_DIR: reportDir } }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ['slop_compare', 'slop_fix', 'slop_guide', 'slop_page', 'slop_report', 'slop_rescue_plan', 'slop_scan', 'slop_scan_html']);
    const { prompts } = await client.listPrompts();
    assert.ok(prompts.some((p) => p.name === 'rescue'));
    assert.ok(prompts.some((p) => p.name === 'fix'));

    const target = join(here, 'fixtures', 'vibe-app');
    const r1 = await client.callTool({ name: 'slop_scan', arguments: { target } });
    const id = r1.content[0].text.match(/`(s\d+)`/)[1];
    const plan = await client.callTool({ name: 'slop_rescue_plan', arguments: { scan_id: id } });
    assert.match(plan.content[0].text, /Rescue plan/);
    const r2 = await client.callTool({ name: 'slop_scan', arguments: { target } });
    assert.match(r2.content[0].text, /Before \/ after/);

    // a file:// URL: decode it properly (Windows drive letters, non-ASCII user names like "Ömer")
    const path = fileURLToPath(r2.content[0].text.match(/(file:\/\/\S+\.html)/)[1]);
    assert.ok(existsSync(path), 'visual report written');
    const rep = await client.callTool({ name: 'slop_report', arguments: { scan_id: id, lang: 'tr' } });
    assert.match(rep.content[0].text, /Görsel rapor/);
    assert.doesNotMatch(rep.content[0].text, /tarayıcıda açıldı/);

    const fix = await client.callTool({ name: 'slop_fix', arguments: { scan_id: id, lang: 'tr' } });
    assert.match(fix.content[0].text, /Yapılacaklar:\n1\. /);
    assert.match(fix.content[0].text, /Sıradaki bulgular/);
    const one = await client.callTool({ name: 'slop_fix', arguments: { scan_id: id, finding_id: 'dead-links' } });
    assert.match(one.content[0].text, /Steps:/);
    const guide = await client.callTool({ name: 'slop_guide', arguments: { topic: 'playbook' } });
    assert.ok(guide.content[0].text.length > 200);

    const bad = await client.callTool({ name: 'slop_rescue_plan', arguments: { scan_id: 's999' } });
    assert.equal(bad.isError, true);
  } finally {
    await client.close();
  }
});
