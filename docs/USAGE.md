# AI Slop Meter usage guide

[Türkçe](KULLANIM.md) · [README](../README.md)

This guide goes in order: install, first scan, reading the report, letting your AI fix it, measuring again. At the end: every command and tool, ready-made recipes and troubleshooting.

- [1. Which way should I use it?](#1-which-way-should-i-use-it)
- [2. Step by step: from the first scan to a clean page](#2-step-by-step-from-the-first-scan-to-a-clean-page)
- [3. What to say to your AI](#3-what-to-say-to-your-ai)
- [4. MCP tools and their order](#4-mcp-tools-and-their-order)
- [5. Command line reference](#5-command-line)
- [6. Recipes](#6-recipes)
- [7. Config file and environment variables](#7-config-file-and-environment-variables)
- [8. Troubleshooting](#8-troubleshooting)

---

## 1. Which way should I use it?

There are three ways in, and they all measure the same way:

| You want | Use | Why |
|---|---|---|
| Your AI (Claude, Cursor…) to scan, plan and fix the code | **MCP** | It sees findings with file and line, fixes them and measures again |
| A quick score, or the report in your browser | **CLI** (`npx`) | Nothing to install, one command |
| A score for the page you are looking at, in one click | **Bookmarklet** | Runs from the browser, nothing installed |
| A check on every pull request | **GitHub Action** | CI fails above a score limit |

For most people the right order is: try the CLI once, and if you like it, add it as an MCP server and let your AI do the work.

**You need:** Node.js 20 or newer (except for the Claude Desktop extension). With Chrome or Edge installed, colours, contrast and fonts are measured in a real browser; without one it still works.

---

## 2. Step by step: from the first scan to a clean page

### Step 1: Install (once)

**Claude Code** (works in all your projects):
```
claude mcp add --scope user aislopmeter -- npx -y aislopmeter mcp
```
Leave out `--scope user` to add it to this folder only. Use `--scope project` to share it with your team (writes a `.mcp.json` you commit).

**Claude Desktop:** download [aislopmeter.mcpb](https://github.com/omergocmen/aislopmeter/releases/latest/download/aislopmeter.mcpb) and double-click it. No Node.js needed.

**Cursor / VS Code:** the one-click buttons in the README, or this block in the settings file:
```json
{
  "mcpServers": {
    "aislopmeter": { "command": "npx", "args": ["-y", "aislopmeter", "mcp"] }
  }
}
```
Cursor: `~/.cursor/mcp.json` (every project). VS Code: `.vscode/mcp.json` (the key there is `"servers"`). Gemini CLI: `~/.gemini/settings.json`.

To check it is there: type `/mcp` in Claude Code and look for `aislopmeter`. After adding it, restart the editor once.

### Step 2: First scan

Ask your AI:
```
Scan https://my-site.com for AI slop and tell me the three biggest problems.
```
or in a terminal:
```
npx -y aislopmeter https://my-site.com --open
```
A site is crawled up to 30 pages (found through the sitemap and internal links, robots.txt respected). Every page gets its own score.

### Step 3: Read the report

The score runs from 0 to 100; higher means more slop.

| Score | Meaning |
|---|---|
| 0–19 | clean |
| 20–39 | trace amounts |
| 40–59 | noticeable |
| 60–79 | heavy |
| 80–100 | pure slop |

The visual report has three screens:
- **Report:** the score, bars for the five areas, the findings (biggest first), each with its evidence and file:line.
- **What to do:** a checklist, time estimates, the questions for the owner.
- **Pages** (site scans): every page's score, worst first.

Under the findings there is also an **AI search readiness** score (0-100): can ChatGPT, Claude, Perplexity and Gemini read the page, tell who is behind it and quote it? It looks at 11 things: JSON-LD structured data, readable without JavaScript, title and description, Open Graph, canonical, one h1, author and date, quotable paragraphs, robots.txt open to AI search crawlers, `llms.txt` and a sitemap. It does not change the slop score; what is missing shows up as its own phase in the rescue plan.

Every finding has a **Copy as a prompt** button: ready text you can paste to your AI to fix that one problem.

### Step 4: Fix

Two ways:

**Plan everything (recommended):**
```
Rescue my site from slop. Open the report in my browser when you're done.
```
Your AI first asks you questions in one message (who it is for, real prices, real customer quotes, who is behind it…). **Answer them**: the tool never lets the AI invent facts, and copy only gets better with real ones. Then it works in phases (clean-up → copy → design → trust) and measures again after each.

**One problem at a time:**
```
Fix the most important slop problem, scan again and show me what changed.
```

If there is something to keep, say it up front: "Keep the logo and the purple brand colour."

### Step 5: Measure again

Scanning the same target again shows what went down, what is still open and what is new:
```
Scan it again and compare with before.
```
The default target is below 20.

### Step 6: Keep it clean (optional)

- A README badge: `npx -y aislopmeter . --badge aislopmeter.svg`
- A check on every PR: [GitHub Action](#github-action)

---

## 3. What to say to your AI

Use these as they are. Write in Turkish and the report comes in Turkish.

| You want | Say |
|---|---|
| Just the score | `What's the slop score of https://my-site.com?` |
| The whole site, page by page | `Scan every page of https://my-site.com and tell me the 3 worst pages and why.` |
| One page | `Scan only https://my-site.com/pricing.` |
| A project folder | `Scan this project for AI slop and show me file and line.` |
| A running local app | `My app runs at localhost:3000 and the code is in this folder. Fix it in the code and re-scan localhost after each step.` |
| A rescue plan | `Make a rescue plan for this scan, target 15. Keep the logo and colours.` |
| One finding | `How do I fix the "dead-links" finding, step by step?` |
| One page in detail | `Show me the report for the /about page.` |
| Before and after | `Compare the first scan with the last one.` |
| The visual report | `Open the report in my browser.` |
| The rules | `What does AI Slop Meter score on? Show me the criteria.` |
| Pasted HTML | `Scan this HTML for slop: <html>…` |
| AI search | `Can ChatGPT and Claude read my site? Show the AI search readiness and fix what's missing.` |
| Design system | `This project has a DESIGN.md; find colours, fonts and radii outside it and fix them.` |

**Built-in prompts.** Two ready prompts; in Claude Code they appear when you type `/`:
- `/mcp__aislopmeter__rescue`: scans, asks the questions, applies the plan, re-measures until the target score.
- `/mcp__aislopmeter__fix`: fixes only the most important problem, re-scans and shows the difference.

In Claude Desktop they are in the "+" menu; in other clients that support MCP prompts, in their prompt menu. Elsewhere, just type the sentences above.

**As a plugin (Claude Code):** `/plugin marketplace add omergocmen/aislopmeter`, then `/plugin install aislopmeter@aislopmeter`. On top of the MCP server this installs a rescue skill, so a request like "my site looks too AI-generated" makes Claude follow the right order by itself.

---

## 4. MCP tools and their order

Your AI calls these itself; knowing them tells you what you can ask for. The usual order:

```
slop_scan ──► slop_rescue_plan ──► (slop_fix / slop_page, edit) ──► slop_scan ──► slop_compare ──► slop_report
```

| Tool | What it does | Main parameters |
|---|---|---|
| `slop_scan` | Scans a URL, localhost, a folder or an .html file; returns a scan id (`s1`, `s2`…) | `target`, `pages` (1–200, default 30), `render` (`auto`/`always`/`never`), `lang`, `ignore`, `open_report` |
| `slop_scan_html` | Scans pasted or generated HTML | `html`, `url`, `label` |
| `slop_rescue_plan` | Turns a scan into a phased plan: questions, clean-up, copy, design, trust | `scan_id`, `keep`, `target_score` (default 20) |
| `slop_fix` | Steps for one finding, with file:line and a before/after example | `scan_id`, `finding_id` (empty = most important), `page` |
| `slop_page` | The full report of one page of a site scan | `scan_id`, `page` (`/pricing` or a full URL) |
| `slop_compare` | The difference between two scans | `before_id`, `after_id` |
| `slop_report` | Writes the visual report, opens it if asked | `scan_id`, `open` |
| `slop_guide` | The criteria, method, copy and design guides | `topic`: `criteria`, `playbook`, `copy`, `design`, `interview` |

Notes:
- Scanning the same target again in a session adds the comparison automatically.
- Reports go to `~/.aislopmeter/reports/`; `open_report` is only set when you agreed.
- Scan ids belong to the session; after the MCP server restarts they start at `s1` again.

---

## 5. Command line

```
npx -y aislopmeter <target> [options]
npx -y aislopmeter mcp            # run as an MCP server (editors use this)
```

`<target>` can be:

| Target | Example | What happens |
|---|---|---|
| A live site | `https://my-site.com` | Up to 30 pages, a score for each |
| One page | `https://my-site.com/pricing --pages 1` | Only that page |
| A local app | `localhost:3000` | Opened over http and crawled like a site |
| A project folder | `.` or `./my-app` | Reads the source files; findings come with file:line |
| Build output | `./dist` | The files you will deploy |
| One HTML file | `./index.html` | One page |

### Options

| Option | What it does | Example |
|---|---|---|
| `--pages <n\|all>` | Site: how many pages (default 30, `all` = up to 200, `1` = only this page) | `--pages all` |
| `--render <mode>` | `auto` (default): measure in Chrome/Edge when installed and render pages that need JavaScript. `always`: open every page in the browser. `never`: HTML and CSS only | `--render never` |
| `--lang <en\|tr>` | Report language | `--lang tr` |
| `--plan` | Also print the rescue plan | `--plan` |
| `--html` | Write the visual report and print its path | `--html` |
| `--open` | Write the visual report and open it | `--open` |
| `--json` | Print the raw result as JSON | `--json` |
| `--json-file <file>` | Also write the raw result to a file | `--json-file result.json` |
| `--badge <file>` | Write a badge: `.svg`, or `.json` for shields.io | `--badge aislopmeter.svg` |
| `--fail-above <n>` | Exit with code 1 when the score is above n (CI) | `--fail-above 40` |
| `--ignore <a,b>` | Folder: sub-paths to skip | `--ignore docs,src/legacy` |
| `--include-ui` | Folder: also scan `components/ui` (shadcn) | `--include-ui` |
| `--no-config` | Ignore `.aislopmeter.json` | `--no-config` |
| `-v`, `--version` | Print the version | |
| `-h`, `--help` | Help | |

**Exit codes:** `0` done, `1` the score is above `--fail-above`, `2` error (target not found, site did not load, wrong option).

**Skipped in folder scans:** `node_modules`, hidden folders, `components/ui`; at the top of the folder also `dist`, `build`, `out`, `test`, `docs`, `examples` and repo documents such as README and CHANGELOG. To scan one of them, point at it directly (`./dist`).

**Windows PowerShell:** don't chain commands with `&&` (PowerShell 5 does not support it); run them on separate lines or use `;`. Quote paths with spaces: `npx -y aislopmeter "C:\Projects\my site"`.

---

## 6. Recipes

### A live site, all of it
```
npx -y aislopmeter https://my-site.com --pages all --open
```

### Only the home page, fast
```
npx -y aislopmeter https://my-site.com --pages 1
```

### An app built with Lovable, Bolt or v0 (Vite, React)
These apps send an empty `<div id="root">` first. With Chrome or Edge installed, the page is opened in the browser and what you actually see is measured.
```
npm run dev
npx -y aislopmeter localhost:5173 --open
npx -y aislopmeter . --plan
```
The first measures what is on screen; the second points at file and line in your source. Give your AI both: "It runs at localhost:5173 and the code is in this folder. Fix it in the code and re-scan localhost."

### Next.js, Astro or a static site
```
npm run build
npx -y aislopmeter ./out --open        # Next.js static export
npx -y aislopmeter ./dist --open       # Astro, Vite
```

### Keep a before and after
```
npx -y aislopmeter https://my-site.com --json-file before.json --badge before.svg
# … changes …
npx -y aislopmeter https://my-site.com --json-file after.json --badge after.svg
```
Inside MCP, scanning the same target again compares by itself.

### README badge
```
npx -y aislopmeter . --badge aislopmeter.svg
```
In the README: `![AI slop](aislopmeter.svg)`

### GitHub Action
`.github/workflows/slop.yml`:
```yaml
name: slop
on: [pull_request]
jobs:
  slop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: omergocmen/aislopmeter@v0
        with:
          target: .          # or your preview URL
          fail-above: 40     # optional
          lang: en
```
The report goes to the job summary; `score` and `band` are also outputs.

### Bookmarklet (nothing to install)
Create a bookmark and paste this as its address:
```
javascript:(()=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/aislopmeter@0/dist/aislopmeter.browser.js';s.onload=()=>AISlopMeter.overlay();document.head.appendChild(s)})()
```
Click it on any page: the score, the top findings and a copy-for-your-AI button for each. It checks one page; for a whole site and file:line, use the CLI or MCP. It cannot run on sites that block outside scripts (Content-Security-Policy).

---

## 7. Config file and environment variables

`.aislopmeter.json` in the project root (or the folder you run it from):
```json
{
  "disable": ["purple-gradient"],
  "keep": "The purple of our logo and the hero photo",
  "ignore": ["legacy"],
  "lang": "en",
  "pages": 30,
  "targetScore": 20,
  "failAbove": 40,
  "design": "docs/DESIGN.md"
}
```

| Key | What it does |
|---|---|
| `disable` | Checks to turn off (ids are in the report, e.g. `purple-gradient`, `em-dash`) |
| `keep` | Passed to the rescue plan as "do not touch". Words like "purple", "dark theme", "font" or "animation" take the matching findings out of the plan, so the AI leaves them alone (they still count in the score; use `disable` to stop that) |
| `ignore` | Paths to skip in folder scans |
| `lang` | Default report language |
| `pages` | Default number of pages |
| `targetScore` | Target of the rescue plan |
| `render` | `auto`, `always` or `never` |
| `failAbove` | Limit for the CLI and the Action |
| `design` | The design spec to compare against. Folder scans find `DESIGN.md` at the root or in `docs/` by themselves; for site scans, name it here |

**DESIGN.md.** If your project has a `DESIGN.md` with its colours, fonts and corner radii, values in the stylesheets outside that list show up as `design-drift`. The format is free: hex codes for colours, quoted names for fonts, px values for radii. Example: [examples/kavruk/after/DESIGN.md](../examples/kavruk/after/DESIGN.md).

The report says which checks were turned off. `--no-config` ignores the file.

**Environment variables**

| Variable | What it does |
|---|---|
| `AISLOPMETER_CHROME` | Path to Chrome/Edge if it is not found |
| `AISLOPMETER_BROWSER=off` | Never start a browser |
| `AISLOPMETER_REPORT_DIR` | Where reports are written |
| `AISLOPMETER_DEBUG=1` | Print checks that failed to the console |

---

## 8. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The `aislopmeter` tools don't show up in the editor | Restart the editor. In Claude Code, `/mcp` shows its status. `node -v` must be 20 or newer. |
| An old version runs | npx cache: `npx -y aislopmeter@latest …`, or `"args": ["-y", "aislopmeter@latest", "mcp"]` in the MCP settings |
| No browser measurements in the report | Install Chrome or Edge, or set `AISLOPMETER_CHROME`. Without a browser it still works; colour and contrast are then estimated. |
| The page looks empty, very few words | A page drawn by JavaScript and no browser. Install Chrome/Edge or try `--render always`. |
| `localhost` does not open | Is the dev server running? Check the port (`localhost:5173`). |
| Some pages were not scanned | robots.txt blocks them, or the page limit was reached: `--pages all`. |
| The site answers 403 | Some sites block automated requests. If it is your site, scan the project folder. |
| The bookmarklet does nothing | The site blocks outside scripts (CSP). Use the CLI. |
| A finding looks wrong to me | Turn it off with `disable` in `.aislopmeter.json`, and please [report the false alarm](https://github.com/omergocmen/aislopmeter/issues/new?template=false-alarm.yml). |
| `&&` errors in PowerShell | PowerShell 5 has no `&&`; run the commands on separate lines. |

Still stuck? [Open an issue](https://github.com/omergocmen/aislopmeter/issues).
