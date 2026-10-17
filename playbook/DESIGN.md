# Leaving the template look behind

Models drift toward the statistical middle of the web: Inter, a purple gradient, a centred hero, three icon cards, glass and glow. Tell one to "avoid purple" and it moves to the next default. The way out is to make a few decisions from the subject, write them down, and make the agent follow them.

## 1. Brief (five lines)
- **Product.**
- **Audience.**
- **The page's single job.**
- **Three adjectives.**
- **Sites it must not resemble.**
- **The mode:**
  - persuade (landing page)
  - operate (app)
  - read (docs)
  - experience (portfolio)
  - Ambition differs by mode. Inter is fine inside an app.

## 2. Derive the world from the subject
- List ten concrete nouns from the subject's physical or cultural world: materials, tools, places, era, signage, packaging, paperwork.
- Pick one as the visual anchor. Open the hero with the subject's most characteristic artifact, such as a real product state, a real photo, a worked example or an invoice. Not a slogan over a gradient.
- Write one sentence about where the page is used and in what light. Choose light or dark from that sentence, not from habit.

## 3. Palette
- Pick a strategy:
  - **Restrained:** tinted neutrals and one accent.
  - **Committed:** one hue covers a large surface.
  - **Full:** 3–4 named roles.
- Define 4–6 tokens with roles and a reason each, sampled from the anchor nouns (fountain-pen blue, iron-oxide red, safety orange…).
- Tint neutrals toward the accent. Don't use #111 as a stand-in for black.
- Body text at 4.5:1 contrast or better. Gray-400 on white fails.
- Use the colours as solid fields. A gradient is only for something that is a gradient.

## 4. Typography
- Use a display face with character plus a quiet text face. Or use one variable family at its extremes (200 vs 900), with size jumps of 3× or more.
- Use a 4–6 step scale, body text of 16px or larger, and a line length under 75 characters.
- Do not let these faces be the whole voice of a landing page: Inter, Geist, Space Grotesk, Instrument Serif/Sans, Syne, Fraunces, Playfair, DM Sans/Serif, Plus Jakarta, Outfit, Poppins.
- Example pairings outside the over-used set. Rotate them, and justify each one by the subject:
  - Archivo (condensed or expanded) + Public Sans or Spectral: industrial, civic, paperwork
  - Big Shoulders Display + Atkinson Hyperlegible: signage, transport
  - Young Serif + Onest: warm consumer, without the cream cliché
  - Schibsted Grotesk + Source Serif 4: news, finance
  - Bodoni Moda + Public Sans: fashion
  - Barlow Condensed + Barlow: sports, logistics
  - Gloock + Hanken Grotesk: boutique hospitality
  - Zilla Slab + Mulish: crafts, tools
  - Chivo + Chivo Mono: only when mono shows real data or code

## 5. Layout
- Delete sections that exist only because templates have them.
- Give each section the shape of its content:
  - a comparison table;
  - one large feature demo with a real screenshot;
  - numbered steps only for a real sequence;
  - a full-bleed band;
  - one pull-quote case study.
- Use at most one card level. Pick alignment per section; not everything centred.
- Choose a radius and spacing scale that fits the tone, for example 2–4px for a tool, with a larger radius kept for one hero object.

## 6. Imagery and icons
- Real photos and screenshots beat illustrations. No AI faces presented as real people.
- Use one icon family with a consistent stroke, or no icons. No emoji icons.
- Style the browser surfaces in the palette: selection colour, focus ring, caret, underline offset, tabular numbers. This is the cheapest way to make a page feel built rather than assembled.

## 7. Motion
- Keep one deliberate moment, such as a page-load reveal or a single interactive demo.
- Keep content visible without JavaScript and respect `prefers-reduced-motion`.
- Avoid:
  - fade-up on every section;
  - hover lift on every card;
  - meteors, beams and cursor followers;
  - scroll hijacking;
  - bounce easing.

## 8. Lock it
- Write `DESIGN.md` in the project: tokens, faces, scale, radius, shadow, motion rules, and an "avoid → instead" list.
- Replace Tailwind's `colors`, `fontFamily`, `fontSize` and `spacing` rather than extending them, so stock `indigo-600` no longer compiles.
- Tell the agent to read DESIGN.md before any UI change.

## Default looks to avoid (including the "anti-defaults")
1. Purple/indigo → blue/pink gradient, Inter, centred hero.
2. Perma-dark zinc-950 with grey text, aurora glow and glowing borders.
3. Cream ground, italic serif display and a terracotta accent: the anti-purple fallback.
4. Near-black with one acid-green, lime or vermilion accent.
5. Broadsheet editorial: hairline rules, tiny tracked mono labels, "A · B · C" meta lines.
6. Faux-neobrutalism: hard offset shadows and heavy condensed type with no reason.
7. The SaaS card kit: identical rounded cards, one radius, a soft shadow, an icon tile on every card.
8. Neon multi-hue "AI palette".
9. Glass over blurred blobs.
10. A bento grid on a gradient wash.
11. Untouched shadcn neutral.
12. The "technical" costume: mono everywhere, blinking cursor, dot grid.

If someone could guess the look from the product category alone, it is still a default.
