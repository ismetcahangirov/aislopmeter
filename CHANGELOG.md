# Changelog

## 0.1.0 (2026-10-17)

First release.

- **Scanning.** Scans a URL (with optional internal-link crawl), a project folder or a single HTML file.
- **Scoring.** Five scored areas: substance, language patterns, template design, unfinished details, builder traces.
  - About 45 checks, built from published research and design-review sources (see docs/CRITERIA.md).
  - English and Turkish lexicons.
- **Locations.** Folder and file scans give `file:line` locations for every finding.
- **Rescue plan.** Facts first, then clean-up, copy, design, trust and re-measure, with an estimated score after each phase.
- **Visual report.** Two screens: Report, and a calm What-to-do checklist with owner questions and copy-as-prompt.
- **What to do.** Every finding comes with numbered steps, `file:line` places, a before/after example where it helps, a done-when check and a copy-as-prompt button.
- **MCP server.** Tools `slop_scan`, `slop_scan_html`, `slop_rescue_plan`, `slop_fix`, `slop_report`, `slop_compare`, `slop_guide`; `rescue` and `fix` prompts; the guides as resources.
- **CLI.** Markdown, JSON, HTML output and `--fail-above` for CI.
- **Folder defaults.** Build output, tests, `docs`, `examples` and repo documents at the top of a project are skipped, so a README full of feature lists does not count as site copy.
- **JavaScript-rendered pages.** Rendered with the Chrome or Edge already installed, through optional `playwright-core`.
