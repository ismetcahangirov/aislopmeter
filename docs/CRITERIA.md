# AI Slop Meter criteria

What AI Slop Meter measures, why, how, and where each idea comes from.

## What "slop" means here

Slop is generic, low-information, templated output that is shipped without a human deciding anything. Whoever wrote it, a person or a model, doesn't matter.

- **AI Slop Meter is not an AI-authorship detector.** It flags patterns you can observe, and shows the evidence for each one.
- A page can be made entirely with AI and score clean. A hand-written page can score high.
- The question is whether someone made decisions, not which tool they used.

Three findings from the research shape the design:

1. **Density and relevance predict slop best.** Shaib et al. (2025) built a taxonomy from interviews with 19 experts and had copy editors annotate it.
   - All the dimensions they defined predicted a "slop" label.
   - The strongest predictors were **relevance**, **information density** and **tone**.
   - The number of flagged problem spans correlated with the slop label at about ρ = 0.63.
   - So AI Slop Meter counts concrete problems and puts the largest share of the score on substance.
2. **An LLM judge is not a measurement.** In the same study, GPT-5, DeepSeek-V3 and o3-mini were asked "is this slop?".
   - They agreed with human annotators at κ ≈ 0.
   - They flagged 3–8% of texts, where humans flagged 34%.
   - So AI Slop Meter scores with deterministic, explainable rules. Your AI is only used to *fix* what was found, never to grade it.
3. **The look is a cluster, not a single tell.** Krebs' scan of about 500 sites found an average of about 2.2 template patterns per site.
   - A purple brand alone is not slop.
   - So the total score is capped at 35 when only one of the four main areas shows real problems, and at 60 when two do.

## Scoring

| Category | Max | What it covers |
|---|---|---|
| Substance | 30 | Specific information, claims you can check, real proof, trust signals |
| Language patterns | 22 | Clichés, rhetorical tics, formulaic structure, headline formulas, stock microcopy |
| Template design | 28 | The default look of AI page builders, the standard section templates, pasted effects |
| Unfinished details | 15 | Leftovers, placeholders, broken basics |
| Builder traces | 5 | Fingerprints of Lovable, Bolt, v0, Replit, Base44 (shown as information) |

How the numbers work:
- **Points.** Each finding adds points. Each category is capped at its maximum.
- **Strengths.** These lower the substance score by up to 10. They include a real address, named people, prices, legal details, an about page and links to independent reviews.
- **Concentration cap.** An area counts as active when it reaches 25% of its maximum. With one active area the total is capped at 35, with two at 60.
- **Browser measurements.** With Chrome, Edge or Chromium installed, each page (up to 6 per crawl) is also opened in the browser and measured: computed colours and WCAG contrast, the fonts actually rendered, the share of centred headings and paragraphs, sibling cards with identical size and look, large gradients, big radii and glows. These replace the guesses from class names where they exist. Without a browser the checks fall back to HTML and CSS.
- **Linked files.** For URLs and `.html` files the page's own stylesheets and scripts (same site, no well-known libraries) are read too, so a purple gradient in `style.css` counts and points at its line.
- **Bands:** 0–19 clean, 20–39 trace amounts, 40–59 noticeable, 60–79 heavy, 80–100 pure slop.
- **Multi-page scans:** 0.5 × the weighted mean of the page scores (home page ×2; privacy, terms, sign-in and pages under 80 words left out) plus 0.5 × the worst page, plus checks across pages such as duplicate titles.

## Substance

| Check | How it is detected | Notes and sources |
|---|---|---|
| `specificity` | Concrete items per 100 words of prose: numbers, money, dates, month names, mid-sentence proper nouns (×0.5). Under 1 → +12; under 2 → +8; under 3.5 → +4. Needs ≥120 words, and title-case lines are skipped. | Shaib et al. 2025 (density). Google, "helpful, reliable, people-first content": original information, beyond the obvious. |
| `inflation` | Strong phrases (rare in human text) count ×2, e.g. "stands as a testament", "role in shaping", "kalıcı bir iz bıraktı". Weak phrases ("crucial role", "dönüm noktası") count only from 2 hits. | Wikipedia: Signs of AI writing. The edwinhu corpus check found bare "plays a crucial role" common in human prose. |
| `vanity` | 3 or more distinct round numbers such as "10,000+", "99.9%" or "5x" with no source. | Search Quality Rater Guidelines (exaggerated claims); Krebs ("stat banner", 12%). |
| `fake-proof` | Stock-avatar hosts (pravatar, randomuser, dicebear, generated.photos…), placeholder logos (Logoipsum, Globex, Hooli…), "trusted by thousands", testimonials made of stock praise ("game-changer", "highly recommend"). | FTC rule on fake reviews (16 CFR 465, 2024); UK DMCC Act (2025); Google review-snippet policy. |
| `unverified-claims` | "Award-winning", "#1", "industry-leading", "as seen in", "sektörün lideri", "ödüllü" with no named award or source. | Rater Guidelines 5.6; Merchant Center misrepresentation policy. |
| `weasel` | "Experts say", "studies show", "uzmanlar … gösteriyor", "bilinen bir gerçektir" with no source. | Wikipedia (vague attributions). |
| `fake-urgency` | "Only 3 left", "someone just bought", FOMO widget scripts. | FTC/DMCC (fake social indicators). |
| `suspicious-rating` | JSON-LD rating of 4.9–5.0 with a round review count. | Google review-snippet guidelines (self-serving reviews). |
| `ai-images` | Generator filenames (`ChatGPT Image`, `Gemini_Generated_Image_`, `DALL·E 2026-…`), generator CDNs, IPTC `trainedAlgorithmicMedia` in markup. | Google image metadata docs; C2PA. Missing metadata proves nothing, because CDNs strip it. |
| strengths | Real email, phone, address, legal entity, a named person with a role, opening hours, prices, dated content, links to independent reviews, an about/team page. | Rater Guidelines (who is behind the site); Stanford Web Credibility guidelines. |

## Language patterns

| Check | How it is detected | Notes and sources |
|---|---|---|
| `lexicon` | Strong list (low human rate) plus weak list (counts only once dense), in English and Turkish, matched from the start of a word. Points come from the rate per 1000 words and the number of distinct terms. | EQ-Bench Slop Score (human baseline about 6.9 slop words per 1k); Kobak et al. 2025 (excess vocabulary); GPTZero phrase ratios; Wikipedia era lists. |
| `neg-parallel` | "Not just X, but Y", "it's not X, it's Y", "sadece … değil, aynı zamanda", "-mekle kalmayıp". Needs 2 or more. | EQ-Bench contrast regexes (human ≈0.25 per 1k words); Pangram (×3 in AI text). |
| `ing-tail` | ", highlighting / underscoring / showcasing …" and the Turkish equivalent ", … vurgulayarak". 3 or more. | Wikipedia (superficial analyses). |
| `triads` | "X, Y and Z" lists at more than 4 per 1k words, with 3 or more on the page. | Pangram: human 0.5 vs AI 1.9 per 1k. |
| `false-range` | "From startups to enterprises", "KOBİ'lerden büyük kurumlara kadar" with no real scale. | Wikipedia (false ranges). |
| `everyone` | "Whether you're a … or a …", "businesses of all sizes", "ister … ister … olun". | Pangram TR; copywriting practice. |
| `em-dash` | More than 5 em dashes per 1k words, 3 or more in total. | Pangram: human 0.2–0.5 vs AI 1.7 per 1k. Weak on its own. |
| `emoji-headings` | Emoji in headings or buttons (2 or more). | Pangram (✅ 167×, 🚀 26×); Krebs. |
| `generic-headings` | "Why choose us?", "How it works", "What our customers say", "Neden biz?", two-word feature titles such as "Lightning Fast". | Alan West; Krebs. |
| `generic-cta` | "Get started", "Learn more", "Hemen başla" as the only label. | Copywriting practice; NN/g. |
| `formulaic-frame` | Paragraphs opening with "In conclusion,", "Sonuç olarak,", "Have you ever wondered". | Wikipedia (section summaries). |
| `tr-register` | Turkish only. More than 40% of sentences using "-mektedir" verbs, or more than 15% opening with a stock connector. | daktilo1984, howmanywords. Unmeasured; calibrate. |
| `bold`, `exclaim`, `repetition`, `uniform-sentences` | Bold overuse; "!" in UI; gzip compression ratio above 3.3; sentence-length coefficient of variation below 0.42 over 15 or more sentences. | Shaib et al. (repetition: compression ratio); Pangram (bold). |

## Template design

| Check | How it is detected | Notes and sources |
|---|---|---|
| `purple-gradient` | Tailwind gradient utilities with purple, violet, indigo or fuchsia stops, or CSS gradients with an HSL hue of 245–300°. | Krebs (gradients 28%); Fountain Institute; CodeMySpec; Anthropic ("distributional convergence"). |
| `gradient-text` | `bg-clip-text text-transparent`, `background-clip: text`. | Impeccable. |
| `glow-glass` | `backdrop-blur`, `blur-3xl` blobs, colored or zero-offset shadows, pulsing badges, `radial-gradient` washes. | Krebs (glassmorphism 17%); Fountain; YC Design Review. |
| `perma-dark` | Near-black ground plus 3 or more gray-400/500 text styles, with no light theme. | Krebs (20%); Fountain. |
| `emoji-icons` | Emoji used as feature or section icons (3 or more). | Krebs; Fountain; YC. |
| `card-template` | Repeated sibling cards (icon + title + one line), `{icon, title, description}` data arrays, three- or four-column grids. | Krebs (20%); Impeccable. |
| `icon-tiles` | A stock icon in a pale rounded square above every heading. | Krebs (the shadcn/lucide signature). |
| `accent-stripe` | A thick coloured left or top border on cards. | Krebs (13%); Fountain (rainbow side tabs). |
| `pill-badges` | "✨ New" eyebrow pills. | Krebs; Anthropic frontend skill. |
| `motion-everywhere` | Scroll-reveal on every section, hover lift on every card, no reduced-motion setting. | YC; Anthropic; Impeccable. |
| `gimmick-effects` | Meteors, BackgroundBeams, SparklesCore, AuroraBackground and similar effect-kit components. | YC Design Review. |
| `default-font` | Inter or Geist as the voice, or trend faces (Space Grotesk, Instrument Serif, Syne, Fraunces…). | Anthropic cookbook; Krebs (23.5% and 15.8%). |
| `default-theme` | shadcn/ui default theme tokens left untouched. | Krebs (shadcn defaults 23.5%); shadcn theming docs. |
| `cream-terracotta`, `acid-on-black` | The "anti-purple" fallbacks: cream, serif and terracotta; or near-black with one neon accent. | Anthropic frontend-design skill; CodeMySpec; Impeccable. |
| `rounded-everything` | A large radius on 10 or more elements. | Alan West; CodeMySpec. |
| `landing-template` | At least 5 of the 10 standard sections: hero with two generic buttons, logo strip, feature grid, "how it works", testimonials or ★★★★★, stats row (10K+, 99.9%, 24/7), three pricing plans with "Most popular", FAQ accordion, "Ready to…" closing CTA, Product/Company/Resources/Legal footer. 5 → +2, up to +7. | Sailop, 21 signs (2026); Slopdar; 925 Studios. |
| `portfolio-template` | At least 3 of: "Hi, I'm" greeting, typing job titles, About/Skills/Experience/Contact menu, "3+ years" cards, Frontend/Backend skill boxes, timeline. | CodeMySpec; hustletoai. |
| `default-palette` | 5 or more Tailwind default palette colours written as hex in hand-made CSS (slate-400, purple-500, blue-500…), or 10+ default colour classes, with no named brand tokens. | Sailop signs 1 and 19. |
| `accent-underline` | A short coloured `::after` bar (20–129px × 2–6px) under section titles. | Theme-template convention. |
| `stock-icons` | Six or more Lucide icons, or Lucide with the Sparkles icon. | Sailop sign 20; Slopdar. |
| `gimmick-effects` (extended) | Also typing effects (`isDeleting`, Typed.js), custom cursors, particles, floating shapes, tilt cards, glitch text, in HTML, CSS or JS. | 925 Studios ("overcorrection"). |

## Unfinished details

These are placeholders (lorem, "Company Name", John Doe, `[Insert …]`, example.com), placeholder images, narrating section comments (`<!-- Hero Section -->`, `{/* Features */}`), links to `#` or to bare social roots, several H1s, missing or generic alt text, raw markdown, chatbot sentences ("Certainly! Here is…", "Umarım yardımcı olur"), chat citation residue (`utm_source=chatgpt.com`, `oaicite`, `turn0search1`), a stale copyright year, a starter-template title or description ("Vite + React + TS", "Lovable Generated Project"), the default favicon, missing metadata, a leftover `noindex`, hidden instructions aimed at AI assistants, gray-400 text on white (≈2.5:1), and removed focus outlines.

Sources: hustletoai (vibe-coded checklist), kaplich (100-site analysis), Google gen-AI guidance (fact-check titles, descriptions and alt text too), Google spam policies (cloaking applies to AI Overviews, May 2026), WCAG 2.2.

New in this version (language and finish):

| Check | How it is detected | Notes and sources |
|---|---|---|
| `headline-formula` | h1/h2 matching formulas such as "Supercharge your…", "…, reimagined", "Your all-in-one…", "Build faster", "for the modern…", "Everything you need to…", "Yapay zekâ destekli…". | Sailop sign 13; 925 Studios. |
| `stock-microcopy` | Four or more stock phrases: "Get started", "Watch demo", "No credit card required", "Cancel anytime", "Trusted by", "Most popular", "All rights reserved", "Kredi kartı gerekmez"… | Sailop sign 13. |
| `centred-everything` (design, browser) | 75% or more of headings and paragraphs centred (90% → +3). | Layout convention of AI builders; 925 Studios. |
| `low-contrast` (browser) | With a browser: 3+ text elements and 6%+ of all text below WCAG 4.5:1 (3:1 for large text), measured on the computed colours. | WCAG 2.2, 1.4.3. |
| `no-work-shown` (substance) | A portfolio template with no project images and no project or code links. | hustletoai ("no human surfaces"). |
| `client-shell` (unfinished) | The server sent an empty `#root` shell; the words only appear after JavaScript runs. | Slopdar; hustletoai (SEO). |

## Builder traces

Lovable markers:
- `cdn.gpteng.co/gptengineer.js`
- "Lovable Generated Project"
- `lovable-tagger`
- `vite_react_shadcn_ts`
- `*.lovable.app`

The other builders:
- **Bolt:** `*.bolt.host`, "Made in Bolt"
- **v0:** "v0 App", "Created with v0", `*.vusercontent.net`
- **Replit:** `*.replit.app`, `@replit/vite-plugin-*`
- **Base44:** `*.base44.app`
- **Create:** `*.created.app`

These count only toward the 5-point information category. Having no builder markers proves nothing, because IDE agents leave none.

## Known limits

- **Turkish lists and thresholds are not measured yet.** They come from Turkish sources plus translations of English tells. They need calibrating against pre-November-2022 Turkish web text using Kobak's excess-frequency method. Contributions are welcome.
- **Static scans miss what JavaScript renders.** URL scans try to render with the Chrome or Edge on your machine. Project scans read source files directly.
- **Every numeric threshold is a heuristic.** Calibrate them on a labelled set of known hand-made sites and fresh builder output.

## Sources

- Shaib, Chakrabarty, Garcia-Olano, Wallace (2025). *Measuring AI "Slop" in Text.* arXiv:2509.19163
- Wikipedia: Signs of AI writing (WikiProject AI Cleanup)
- EQ-Bench Slop Score: eqbench.com/slop-score.html; github.com/sam-paech/slop-score
- Paech et al. (2025). *Antislop.* arXiv:2510.15061
- Kobak et al. (2025). *Delving into LLM-assisted writing in biomedical publications through excess vocabulary.* arXiv:2406.07016
- Pangram: AI phrases and Turkish signs-of-AI-writing pages
- Adrian Krebs, design slop report (adriankrebs.ch)
- Fountain Institute: 7 signs a UI has been vibe coded
- Alan West: how to fix the AI-generated look (dev.to)
- CodeMySpec: vibe coded websites look the same
- Anthropic: prompting for frontend aesthetics (cookbook); improving frontend design through skills; frontend-design skill
- Y Combinator Design Review: Common Mistakes With Vibe Coded Websites
- Impeccable (pbakaus): impeccable.style/slop
- Google Search Central: helpful content; using generative AI content (Oct 2026); spam policies (Aug 2026); review snippets; image metadata
- Google Search Quality Rater Guidelines (Sept 2025 edition)
- FTC 16 CFR Part 465 (2024); UK DMCC Act 2024 (in force April 2025)
- Sailop: Detect an AI-generated site in 30 seconds, 21 objective signs (2026)
- Slopdar: How to tell if a website is AI-generated
- 925 Studios: AI slop web design guide (2026)
- hustletoai: How to tell if a website is vibe coded
- Turkish: howmanywords.app, daktilo1984.com, webtekno.com, marketingturkiye.com.tr
