# Changelog

## 0.3.2 (2026-10-18)

- Fix: in folder scans a meta description with an apostrophe ("Odunpazarı'ndaki…") was cut at the apostrophe.
- **What the owner keeps stays.** Words in `keep` ("our purple is the brand", "keep it dark", "the font stays") take the matching findings out of the rescue plan, and the plan tells the AI not to touch them and how to switch them off in `.aislopmeter.json`. The `rescue` prompt and the skill re-plan with `keep` as soon as the owner says something must stay.

## 0.3.1 (2026-10-18)

- **Design is the owner's choice.** The rescue plan, the `rescue` prompt and the Claude Code skill now say: propose 2-3 different design directions from the site's own subject, wait for the owner's pick, never reuse another site's look. The plan also asks which sites or brands the owner likes and three words for how the site should feel.

## 0.3.0 (2026-10-17)

- **AI search readiness**, a separate 0-100 score next to the slop score: can ChatGPT, Claude, Perplexity and Gemini read the page, tell who is behind it and quote it? 11 checks: JSON-LD, readable without JavaScript, title and description, Open Graph, canonical, one h1, author and date on articles, quotable paragraphs, robots.txt open to AI search crawlers (blocking training crawlers is fine), `llms.txt`, sitemap. In the reports, the bookmarklet and as its own phase of the rescue plan. It never changes the slop score.
- **Layout and typography, measured in the browser:** `long-lines`, `tiny-text`, `tight-leading`, `justified-text`, `overflow`, `text-covered`, `edge-text`, `cramped`, `nested-cards`, `flat-hierarchy` (with CSS fallbacks where possible).
- **Template signs:** `grid-background`, `hairline-shadow`, `eyebrow-labels` (small caps labels and "01 / 02" numbers above headings), `giant-hero`.
- **Motion:** `motion-tells` for overshooting and spring easing, pulsing dots, marquees and animations of width, height or position.
- **Page health:** `js-errors` (errors thrown while the page loads) and `broken-images` (the site's own images that fail).
- **DESIGN.md drift:** with a DESIGN.md in the folder (or `"design"` in `.aislopmeter.json`), colours, fonts and radii outside it become `design-drift`. DESIGN.md, AGENTS.md and CLAUDE.md are no longer scored as page copy.
- **Kavruk example** now has JSON-LD, `llms.txt`, a sitemap and a DESIGN.md: readiness 36 → 100.
- The promo site is AI-search ready too (JSON-LD, `llms.txt`, sitemap).
- Fix: the "capped" note gave the wrong limit (it is 35 for one area, 60 for two).

## 0.2.3 (2026-10-17)

- **A multi-page example: Kavruk** (`examples/kavruk`). A six-page roastery site in Turkish, before (74) and after a rescue (0), with the owner's answers, both reports and per-page scores.
- **Found while building it:** prices left as `₺XXX` now count as template filler; a crawl treats `/index.html` and `/` as one page; `<br>` no longer glues words together in headings; a short contact page is not a thin page.

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
