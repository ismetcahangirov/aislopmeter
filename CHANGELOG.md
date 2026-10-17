# Changelog

## 0.2.2 (2026-10-17)

- **`thin-page` on gated landing pages.** A "Log in" button in the menu no longer makes a page count as a sign-in page; only the main heading and password fields do.
- **Calibration re-measured with 0.2.1.** AI-built pages: median 25 (was 33). Hand-made pages: median about 12 (was 16), none above 20. See docs/CALIBRATION.md.
- **Usage guide** in English and Turkish (`docs/USAGE.md`, `docs/KULLANIM.md`): the order to work in, every command and MCP tool with examples, recipes and troubleshooting. A quick start at the top of both READMEs.
- **Website.** The NovaFlow before/after is a browser window with Before, After and Compare tabs and a line you drag. A new section plots all calibration scores. The page now names who makes it and how to reach him, and scores 3.

## 0.2.1 (2026-10-17)

Calibration on 34 real sites (22 built with AI tools such as Lovable and Bolt, 12 hand-made; see docs/CALIBRATION.md). Fewer false alarms, one new check.

- **New check `thin-page`.** A landing page with headings and buttons but almost no words.
- **False alarms fixed.**
  - `placeholder`: code in a site's script bundle (`{{count}}`, `[name="…"]`) and phrases like "for your company" no longer count.
  - `perma-dark`: a browser set to dark mode no longer makes a light site "dark by default". The CLI's browser now opens pages in light mode.
  - `accent-stripe`: quotes, code blocks, menus and active tabs with a side rule are ordinary typography.
  - `card-template`: lists of posts, projects or products (linked titles, own photos) are content, not the feature-card template.
  - `specificity`: an archive of dated posts is concrete enough.
  - `vanity`: only numbers in short stat tiles and badges count, not numbers in reporting prose.
  - `gimmick-effects`: the words "scramble" or "typewriter" in an article are not effects.
  - `emoji-icons`: ™, © and ® are not emoji.
  - `stale-copyright`: licence headers in script bundles are ignored.
  - `low-contrast`: text the same colour as its background (spacers, hidden labels) is skipped.
- **Tests run on Node 20 under Windows** (the test glob is expanded by a small runner).

## 0.2.0 (2026-10-17)

- **npm.** `npx -y aislopmeter` works; listed for the MCP Registry (`server.json`).
- **One-click install.** Cursor and VS Code buttons, a Claude Desktop extension (`.mcpb`, no Node.js needed), and a Claude Code plugin with a rescue skill (`/plugin marketplace add omergocmen/aislopmeter`).
- **Measured in a real browser.** With Chrome or Edge installed: computed colours and WCAG contrast, rendered fonts, centred layout, identical cards, large gradients and radii. Without a browser everything still runs from HTML and CSS.
- **Bookmarklet.** Scan the page you are on, from a bookmark (`dist/aislopmeter.browser.js` via jsDelivr).
- **Badge and GitHub Action.** `--badge file.svg|.json`; `uses: omergocmen/aislopmeter@v0` writes the report to the job summary and can fail above a limit.
- **`.aislopmeter.json`.** Turn off checks, set what to keep, defaults for language, pages and the CI limit.
- **Whole-site scans, site-specific plans and local apps** (see below, now part of this release).

## 0.1.0 (2026-10-17)

First release (GitHub only).

- **Scanning.** Scans a URL (with optional internal-link crawl), a project folder or a single HTML file.
- **Scoring.** Five scored areas: substance, language patterns, template design, unfinished details, builder traces.
  - More than 60 checks, built from published research and design-review sources (see docs/CRITERIA.md).
  - English and Turkish lexicons.
- **Locations.** Folder and file scans give `file:line` locations for every finding.
- **Rescue plan.** Facts first, then clean-up, copy, design, trust and re-measure, with an estimated score after each phase.
- **Visual report.** Two screens: Report, and a calm What-to-do checklist with owner questions and copy-as-prompt.
- **More criteria.** Reads each page's own stylesheets and scripts; new checks for the standard landing-page and portfolio templates, headline formulas, stock microcopy, Tailwind default colours, Lucide icons, typing effects and custom cursors, client-only rendering. Weights now 30/22/28/15/5.
- **Whole-site scans.** URLs are crawled through sitemap.xml and internal links (robots.txt respected, sections sampled evenly); every page gets its own score and to-do list, and repeated problems are grouped with their pages. New `slop_page` tool and a Pages tab in the report.
- **What to do.** Every finding comes with numbered steps, `file:line` places, a before/after example where it helps, a done-when check and a copy-as-prompt button.
- **MCP server.** Tools `slop_scan`, `slop_scan_html`, `slop_rescue_plan`, `slop_fix`, `slop_report`, `slop_compare`, `slop_guide`; `rescue` and `fix` prompts; the guides as resources.
- **CLI.** Markdown, JSON, HTML output and `--fail-above` for CI.
- **Folder defaults.** Build output, tests, `docs`, `examples` and repo documents at the top of a project are skipped, so a README full of feature lists does not count as site copy.
- **JavaScript-rendered pages.** Rendered with the Chrome or Edge already installed, through optional `playwright-core`.
