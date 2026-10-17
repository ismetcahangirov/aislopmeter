# Calibration

How the checks were tuned against real sites, and what changed because of it.

## Method

- **Sites.** 22 home pages built with AI tools (Lovable, Bolt and similar; from the builders' public showcases, plus two AI-assisted sites of the maintainer) and 12 hand-made sites (personal blogs, a news site, a software company).
- **How.** Each page was opened in a desktop browser and scanned with the bookmarklet build of 0.2.0 (`AISlopMeter.scan()`), with browser measurements on.
- **What was checked.** Every finding on a hand-made site was read against the page: is the evidence real, and would an editor call it slop? Findings on AI-built sites were checked for evidence that came from code rather than the page.
- **Not reachable.** Eight more sites did not load, needed a sign-in, or block outside scripts (Content-Security-Policy), so they are not in the tables.

## Scores with 0.2.0

These are the numbers before the fixes below. The fixes remove points on both sides, mostly 2 to 8 points per site.

**Built with AI tools**

| Site | Score | Words | Main findings |
|---|---|---|---|
| offerflowai.com | 49 | 291 | gimmick effects, purple gradient, glow, fake proof, neon on black |
| onlytraction.com | 46 | 1919 | vanity numbers, emoji icons, card template, cream and terracotta |
| omergocmen.netlify.app | 46 | 193 | portfolio template, no work shown, typing effect, clichés |
| prilo.ai | 42 | 605 | purple gradient, glow, card template, stock microcopy |
| referable.dev | 39 | 493 | vanity numbers, purple gradient, glow, headline formula |
| shinebythara.lovable.app | 39 | 233 | little concrete information, glow, empty without JavaScript |
| luciclara.com | 37 | 293 | glow, always dark, gradient text, placeholder images |
| glowcase.app | 36 | 1277 | vanity numbers, glow, card template |
| pitpicks.com | 34 | 973 | glow, neon on black, low contrast |
| vizleads.lovable.app | 34 | 59 | purple gradient, glow, default font |
| permit-guide-ai.lovable.app | 33 | 331 | glow, headline formula, card template, icon tiles |
| opsdesign.com.br | 33 | 228 | little concrete information, glow, always dark |
| luna-vos.lovable.app | 27 | 60 | purple gradient, glow, emoji headings |
| relokato.com | 26 | 513 | little concrete information, triads |
| sellerassistant.io | 25 | 174 | little concrete information, headline formula |
| dachly.com | 24 | 34 | glow, emoji icons, gradient text |
| the-pulse.live | 22 | 35 | purple gradient, glow, gradient text |
| getnodecast.com | 19 | 62 | purple gradient, gradient text, Vite favicon |
| thecurryclub.lovable.app | 18 | 189 | glow, always dark, icon tiles |
| sakura-name-sparkle.lovable.app | 14 | 52 | glow, default font |
| omer-bench.netlify.app | 13 | 569 | default font, always dark, glow |
| puzzlesbox.lovable.app | 9 | 196 | neon on black |

**Hand-made**

| Site | Score | Words | Findings that were wrong |
|---|---|---|---|
| webrazzi.com | 27 | 1396 | placeholder (script code), old copyright (script licence) |
| craigmod.com | 26 | 791 | placeholder (form field selector), card stripes (side rules in plain CSS), always dark (browser in dark mode) |
| kottke.org | 21 | 7668 | vanity numbers (numbers in articles), always dark (dark mode) |
| maggieappleton.com | 17 | 639 | identical cards (lists of posts and notes), always dark (dark mode) |
| jakearchibald.com | 17 | 305 | little concrete information (a dated post archive), card stripes (side rules in plain CSS) |
| basecamp.com | 17 | 2298 | placeholder ("for your company"), ™ counted as emoji |
| daringfireball.net | 16 | 13075 | vanity numbers, "scramble" in an article counted as an effect, old copyright |
| simonwillison.net | 15 | 5274 | always dark (dark mode), old copyright |
| joshwcomeau.com | 15 | 981 | placeholder (script code), always dark (dark mode) |
| danluu.com | 9 | 1431 | low contrast (invisible spacer text) |
| jvns.ca | 7 | 5641 | none |
| paulgraham.com | 2 | 17 | none |

With 0.2.0, AI-built pages had a median of 33 and hand-made pages about 16. Every hand-made site at 9 or above had at least one wrong finding. Each one is now covered by a test in `test/calibration.test.js`.

## What changed in 0.2.1

- **Copy checks no longer read script bundles.** Template filler and old copyright years are looked for in the page and its source files, not in a live site's linked JavaScript, which holds library code, i18n templates and licence headers.
- **Dark mode.** A page that is dark only because the browser asks for dark mode is not "dark by default". The CLI's own browser now opens pages in light mode.
- **Card checks** skip lists of posts, projects and products. **Card stripes** skip quotes, code blocks, menus and active tabs.
- **Specificity** skips archives with four or more dates. **Vanity numbers** count only short stat tiles and badges.
- **Effects, emoji, contrast.** Words in articles no longer count as code effects. ™, © and ® are not emoji. Text the same colour as its background is not a contrast failure.
- **New check `thin-page`.** Several AI-built pages had fewer than 60 words: a headline, a button and little else. Until now none of the checks covered that.

## What it does not show

- The AI-built sample comes from builder showcases, which lean towards finished projects; typical output is likely sloppier.
- Hand-made blogs are long and text-heavy. Hand-made landing pages for products are underrepresented, because many large company sites block outside scripts.
- A score is not a verdict on who made the page (see "What it is not" in the README).

To add a site to the calibration set, open an issue with the URL, the score and the findings you think are wrong.
