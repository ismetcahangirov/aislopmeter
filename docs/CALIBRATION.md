# Calibration

How the checks were tuned against real sites, and what changed because of it.

## Method

- **Sites.** 22 home pages built with AI tools (Lovable, Bolt and similar; from the builders' public showcases, plus two AI-assisted sites of the maintainer) and 12 hand-made sites (personal blogs, a news site, a software company).
- **How.** Each page was opened in a desktop browser and scanned with the bookmarklet build (`AISlopMeter.scan()`), with browser measurements on: first with 0.2.0, then again with 0.2.1 after the fixes below.
- **What was checked.** Every finding on a hand-made site was read against the page: is the evidence real, and would an editor call it slop? Findings on AI-built sites were checked for evidence that came from code rather than the page.
- **Not reachable.** Eight more sites did not load, needed a sign-in, or block outside scripts (Content-Security-Policy), so they are not in the tables.

## Scores

**Built with AI tools**

| Site | 0.2.0 | 0.2.1 | Words | Main findings |
|---|---|---|---|---|
| offerflowai.com | 49 | 41 | 291 | gimmick effects, purple gradient, glow, fake proof, neon on black |
| onlytraction.com | 46 | 35 | 1919 | vanity numbers, emoji icons, card template, cream and terracotta |
| omergocmen.netlify.app | 46 | 46 | 193 | portfolio template, no work shown, typing effect, clichés |
| prilo.ai | 42 | 34 | 605 | purple gradient, glow, card template, stock microcopy |
| referable.dev | 39 | 35 | 493 | vanity numbers, purple gradient, glow, headline formula |
| shinebythara.lovable.app | 39 | 35 | 233 | little concrete information, glow, empty without JavaScript |
| luciclara.com | 37 | 14* | 293 | glow, always dark, gradient text, placeholder images |
| glowcase.app | 36 | 32 | 1277 | vanity numbers, glow, card template |
| pitpicks.com | 34 | 27 | 973 | glow, neon on black, low contrast |
| vizleads.lovable.app | 34 | 27 | 59 | purple gradient, glow, default font |
| permit-guide-ai.lovable.app | 33 | 33 | 331 | glow, headline formula, card template, icon tiles |
| opsdesign.com.br | 33 | 27 | 228 | little concrete information, glow, always dark |
| luna-vos.lovable.app | 27 | 23 | 60 | purple gradient, glow, emoji headings |
| relokato.com | 26 | 22 | 513 | little concrete information, triads |
| sellerassistant.io | 25 | 17 | 174 | little concrete information, headline formula |
| dachly.com | 24 | 18 | 34 | glow, emoji icons, gradient text |
| the-pulse.live | 22 | 22 | 35 | purple gradient, glow, gradient text |
| getnodecast.com | 19 | 16 | 62 | purple gradient, gradient text, Vite favicon |
| thecurryclub.lovable.app | 18 | 18 | 189 | glow, always dark, icon tiles |
| sakura-name-sparkle.lovable.app | 14 | 10 | 52 | glow, default font |
| omer-bench.netlify.app | 13 | 10 | 569 | default font, always dark, glow |
| puzzlesbox.lovable.app | 9 | 9 | 196 | neon on black |

**Hand-made**

| Site | 0.2.0 | 0.2.1 | Words | Findings that were wrong in 0.2.0 |
|---|---|---|---|---|
| webrazzi.com | 27 | 20 | 1396 | placeholder (script code), old copyright (script licence) |
| craigmod.com | 26 | 15 | 791 | placeholder (form field selector), card stripes (side rules in plain CSS), always dark (browser in dark mode) |
| kottke.org | 21 | 15 | 7668 | vanity numbers (numbers in articles), always dark (dark mode) |
| maggieappleton.com | 17 | 15 | 639 | identical cards (lists of posts and notes), always dark (dark mode) |
| jakearchibald.com | 17 | 3 | 305 | little concrete information (a dated post archive), card stripes (side rules in plain CSS) |
| basecamp.com | 17 | 13 | 2298 | placeholder ("for your company"), ™ counted as emoji |
| daringfireball.net | 16 | 12 | 13075 | vanity numbers, "scramble" in an article counted as an effect, old copyright |
| simonwillison.net | 15 | 11 | 5274 | always dark (dark mode), old copyright |
| joshwcomeau.com | 15 | 9 | 981 | placeholder (script code), always dark (dark mode) |
| danluu.com | 9 | 9 | 1431 | low contrast (invisible spacer text) |
| jvns.ca | 7 | 7 | 5641 | none |
| paulgraham.com | 2 | 2 | 17 | none |

\* luciclara.com sent the browser to its sign-in page during the second scan, so its 0.2.1 number is for a different page.

| | 0.2.0 median | 0.2.1 median | 0.2.1 range |
|---|---|---|---|
| Built with AI tools (22) | 33 | 25 | 9 to 46 |
| Hand-made (12) | about 16 | about 12 | 2 to 20 |

With 0.2.0, every hand-made site at 9 or above had at least one wrong finding. Each one is now covered by a test in `test/calibration.test.js`. The fixes also took points off the AI-built pages, mostly because the template-filler check had been reading their script bundles.

What is left on the hand-made sites is mostly real but minor: Inter as the main font, skipped heading levels, missing alt text, an emoji habit. No hand-made site reached 20.

The overlap is in the 10 to 20 range: small AI-built tools (a Sudoku game, a name generator) with little copy and few template signs score like hand-made sites. That is intended: the score is about what a reader sees, not who built it.

## What changed in 0.2.1

- **Copy checks no longer read script bundles.** Template filler and old copyright years are looked for in the page and its source files, not in a live site's linked JavaScript, which holds library code, i18n templates and licence headers.
- **Dark mode.** A page that is dark only because the browser asks for dark mode is not "dark by default". The CLI's own browser now opens pages in light mode.
- **Card checks** skip lists of posts, projects and products. **Card stripes** skip quotes, code blocks, menus and active tabs.
- **Specificity** skips archives with four or more dates. **Vanity numbers** count only short stat tiles and badges.
- **Effects, emoji, contrast.** Words in articles no longer count as code effects. ™, © and ® are not emoji. Text the same colour as its background is not a contrast failure.
- **New check `thin-page`.** Several AI-built pages had fewer than 60 words: a headline, a button and little else. Until now none of the checks covered that. In 0.2.1 a "Log in" button in the menu still made it skip the page; 0.2.2 looks only at the main heading and password fields.

## What it does not show

- The AI-built sample comes from builder showcases, which lean towards finished projects; typical output is likely sloppier.
- Hand-made blogs are long and text-heavy. Hand-made landing pages for products are underrepresented, because many large company sites block outside scripts.
- A score is not a verdict on who made the page (see "What it is not" in the README).

To add a site to the calibration set, open an issue with the URL, the score and the findings you think are wrong.
