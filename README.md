# AI Slop Meter

[Türkçe](README.tr.md) · **English**

**Measure the AI slop on any website. Then fix it.**

AI Slop Meter scores a website or a web project for *slop*: generic copy, the default AI-builder look, and unfinished details.

- It shows the evidence behind every point, down to the file and line.
- It turns the result into a calm, step-by-step plan.
- Your own AI (Claude, Cursor, Gemini CLI and others) can then carry out that plan in your code.

It runs on your machine as an **MCP server** and a **CLI**. No API keys, no account, nothing sent anywhere except the request to the site you asked it to scan.

## Quick start (2 minutes)

1. Have [Node.js](https://nodejs.org) 20 or newer installed.
2. In Claude Code, paste:
   ```bash
   claude mcp add aislopmeter -- npx -y github:omergocmen/aislopmeter mcp
   ```
   For Claude Desktop, Cursor and others, see [Install as an MCP server](#install-as-an-mcp-server).
3. Ask your AI: **"Scan https://my-site.com for AI slop and show me what to fix."**

To try it without installing anything:
```bash
npx -y github:omergocmen/aislopmeter https://my-site.com --open
```

| Before: 83 / 100, pure slop | After: 1 / 100, clean |
|---|---|
| ![Before](docs/img/before.png) | ![After](docs/img/after.png) |

Both pages are in [`examples/novaflow`](examples/novaflow). The "after" page was rewritten using the owner's answers to the rescue plan's questions ([FACTS.md](examples/novaflow/FACTS.md)). The product and its numbers are fictional.

## What it does

1. **Scans** a whole website, a project folder (Next.js, Vite/React, Astro, Vue, Svelte, plain HTML, Markdown content…) or a single `.html` file. For a website it finds the pages through `sitemap.xml` and internal links (respecting `robots.txt`), scans up to 30 by default (`--pages all` for up to 200) and gives **every page its own score and to-do list**. A problem that repeats across pages is shown once, with the list of pages it is on.
2. **Scores** five areas, with research-based checks ([criteria and sources](docs/CRITERIA.md)):
   - **Substance:** concrete facts, claims you can check, real proof
   - **Language patterns:** clichés, "not just X, but Y", empty importance claims
   - **Template design:** purple gradients, glow and glass, emoji icons, identical cards
   - **Unfinished details:** lorem ipsum, `href="#"`, "Vite + React + TS", chatbot leftovers
   - **Builder traces:** Lovable, Bolt, v0, Replit, Base44 (information only)
3. **Plans the rescue:**
   - questions for the owner (so the AI never invents facts)
   - quick clean-ups
   - copy rewrites
   - a design direction
   - trust fixes

   Each step carries a time estimate and its expected score drop.
4. **Tells you what to do about every finding**, not only what is wrong:
   - a one-line fix right under the title;
   - numbered steps and the exact `file:line` places to change;
   - a before/after example for copy problems, and a "done when" check;
   - a **Copy as a prompt for your AI** button that hands that one problem to Claude, Cursor or Lovable.
5. **Shows it** in a two-screen visual report. The **Report** screen has the score and the findings. The **What to do** screen has a checklist that starts with three quick wins, and boxes for answering the owner questions. For site scans, a **Pages** screen lists every page, worst first, with its own score and findings.
6. **Re-measures** after each change and prints a before/after table.

| Report | What to do |
|---|---|
| ![Report screen](docs/img/report.png) | ![What-to-do screen](docs/img/plan.png) |

Every finding opens to the same "what to do" box:

![A finding with steps, a before/after example, the exact lines and a copy-as-prompt button](docs/img/findings.png)

## Install as an MCP server

You need Node.js 20 or newer.

For now the package runs straight from GitHub (`github:omergocmen/aislopmeter`). The first run downloads and installs it, which takes a few seconds.

**Claude Code**
```bash
claude mcp add aislopmeter -- npx -y github:omergocmen/aislopmeter mcp
```

**Claude Desktop**: add this to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "aislopmeter": { "command": "npx", "args": ["-y", "github:omergocmen/aislopmeter", "mcp"] }
  }
}
```

**Cursor** (`.cursor/mcp.json`), **Gemini CLI** (`~/.gemini/settings.json`), **Windsurf** and others: use the same `mcpServers` block.
**VS Code** (`.vscode/mcp.json`): use `"servers": { "aislopmeter": { "type": "stdio", "command": "npx", "args": ["-y", "github:omergocmen/aislopmeter", "mcp"] } }`.

## Use it

Just ask your AI:

> Scan my project for AI slop and show me what to fix.
> Rescue https://my-site.com from slop. Open the report when you're done.
> Sitemi slop'tan kurtar, bitince raporu tarayıcımda aç.

The **`rescue` prompt** runs the whole loop. In Claude Code it is `/mcp__aislopmeter__rescue`. The AI will:

1. ask once whether to open the report in your browser when it finishes, so you can walk away;
2. scan the target and summarise the three findings that matter most;
3. build the plan and ask you the owner questions in one message;
4. apply the plan phase by phase. In a project it edits the exact `file:line` locations. For a live URL it hands you rewritten copy, a design spec and a prompt for your builder;
5. re-scan after each phase until the target score (default 20);
6. write the visual report, open it if you agreed, and summarise before/after.

Prefer small steps? The **`fix` prompt** (`/mcp__aislopmeter__fix`) fixes only the most important problem, re-scans, shows what changed and offers the next one.

### Tools

| Tool | What it does |
|---|---|
| `slop_scan` | Scan a website (crawls up to `pages`, default 30, max 200), a folder or an `.html` file. Writes the visual report; `open_report` opens it. Re-scans compare automatically. |
| `slop_scan_html` | Scan pasted or generated HTML. |
| `slop_rescue_plan` | Turn a scan into a phased plan, with `keep` for things the owner wants untouched and `target_score`. |
| `slop_page` | The full report for one page of a site scan, with its own findings and steps. |
| `slop_fix` | Step-by-step instructions for one finding: what to change, where (`file:line`), an example and a done-when check. Without `finding_id` it picks the most important one and lists the rest. |
| `slop_report` | Write or open the visual report for a scan. |
| `slop_compare` | Before/after for two scan ids. |
| `slop_guide` | Read the guides: `criteria`, `playbook`, `copy`, `design`, `interview`. |

The same guides are also exposed as MCP resources (`aislopmeter://guide/...`).

## Command line

```bash
npx -y github:omergocmen/aislopmeter https://example.com                # whole site, up to 30 pages
npx -y github:omergocmen/aislopmeter https://example.com --pages all    # up to 200 pages
npx -y github:omergocmen/aislopmeter https://example.com --pages 1      # only this page
npx -y github:omergocmen/aislopmeter ./my-app --plan --lang tr          # project folder, plus the rescue plan in Turkish
npx -y github:omergocmen/aislopmeter ./my-app --open                    # write the visual report and open it
npx -y github:omergocmen/aislopmeter ./dist/index.html --fail-above 40  # fail CI when the score is above 40
npx -y github:omergocmen/aislopmeter ./my-app --json                    # raw result
```

Reports are written to `~/.aislopmeter/reports/`. Set `AISLOPMETER_REPORT_DIR` to change that.

Folder scans skip `node_modules`, hidden folders and the ready-made primitives in `components/ui`. At the top of the scanned folder they also skip `dist`, `build`, `out`, `test`, `docs`, `examples` and repo documents such as README, CHANGELOG and LICENSE. To scan one of these, point AI Slop Meter at that folder or file directly. Use `--ignore path1,path2` to leave out anything else.

**In CI** (GitHub Actions):
```yaml
- run: npx -y github:omergocmen/aislopmeter ./ --fail-above 40
```

## Pages built with JavaScript

Some servers send an empty client-rendered shell. In that case AI Slop Meter renders the page with the **Chrome or Edge already installed on your computer**, through `playwright-core`, which downloads no browser. If neither browser is found, set `AISLOPMETER_CHROME` to a browser path, or scan the project folder instead. Folder scans read the source and give `file:line` locations.

## How the score works

Each finding adds points, and each category has a cap:

| Category | Max |
|---|---|
| Substance | 30 |
| Language | 22 |
| Design | 28 |
| Unfinished details | 15 |
| Builder traces | 5 |

Signs that a real business stands behind the page lower the score: a real address, named people, prices, legal details, links to independent reviews.

A high score needs problems in several areas: with only one area the score is capped at 35, with two at 60. A purple brand colour alone is never heavy slop. For websites the page's own `style.css` and scripts are read too.

Bands:

| Score | Band |
|---|---|
| 0–19 | clean |
| 20–39 | trace amounts |
| 40–59 | noticeable |
| 60–79 | heavy |
| 80–100 | pure slop |

Why rules and not an AI judge? In the largest study so far, LLMs asked "is this slop?" agreed with human editors at κ ≈ 0. Density and relevance predicted the human verdict best. So AI Slop Meter measures with explainable rules and uses your AI only to fix things ([details](docs/CRITERIA.md)).

## What it is not

- **Not an AI-authorship detector.** A page made entirely with AI can score clean, and a hand-written page can score high.
- **Not a ranking oracle.** The checks follow Google's helpful-content and spam guidance, but the score is not a search ranking.
- **The Turkish lists are not measured yet.** They are compiled from Turkish sources and from known English tells. Calibration help is welcome.

## Privacy

Everything runs locally.
- **URL scans:** AI Slop Meter fetches only pages of the site you point it at, follows `robots.txt`, and stops at the page limit.
- **Folder scans:** files are only read, never changed.
- **Reports:** written only to your own computer, in `~/.aislopmeter/reports/`.
- **No telemetry.**
- Your AI client sees the report text, as it does with any tool output.

## Contributing

Issues and pull requests are welcome. Most useful right now:
- false positives on real hand-made sites;
- Turkish and other-language lexicons measured against pre-2023 web text;
- more builder fingerprints.

Run the tests with `npm test`.

## License

MIT
