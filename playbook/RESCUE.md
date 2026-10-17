# The AI Slop Meter rescue method

This is for the AI agent (or the person) turning a sloppy page into a specific, trustworthy one. The scan says *what* is wrong. This file says *how* to fix it without making new slop.

## The one rule that matters most

**Never invent facts.** Slop exists because the specifics were never supplied. An agent that fills the gaps with plausible numbers, customers, quotes or awards just makes a more convincing kind of slop. Fake reviews are also illegal in the US (FTC, 2024) and the UK (DMCC Act, 2025).

When a fact is missing, do one of three things:

- ask the owner;
- write a `[placeholder in brackets]` the owner can see and fill;
- cut the claim.

## The loop

1. **Scan.**
   - Call `slop_scan` on the project folder if you can edit the code, or on the URL for a live site.
   - Before a long task, ask the user once whether you may open the visual report in their browser when you finish, since they may be away.
2. **Read the top three findings** with the user, in plain words. Do not dump the whole list on them.
3. **Plan.** Call `slop_rescue_plan`. It orders the work:
   - facts first;
   - then quick clean-ups;
   - then copy, design, trust;
   - then re-measure.
4. **Collect facts.** Ask the plan's questions **in one message**. Prefer the six most important; the rest are optional.
   - Save the answers in one file (e.g. `SLOP_FACTS.md` or the project's content file), so every page uses the same numbers.
5. **Apply one phase at a time.** Edit the exact `file:line` locations from the scan. Keep what the owner said to keep.
6. **Re-scan after each phase.** `slop_scan` prints a before/after table automatically.
   - If a fix created a new finding, for example swapping purple for cream + terracotta, undo it and think again.
7. **Stop** when the score reaches the target (default 20), or when what remains needs facts only the owner has.
8. **Report.** Call `slop_report` with the latest scan, and open it only if the user agreed. Summarise:
   - the score before and after;
   - what changed;
   - what is still open and why;
   - where the report is.

## Phase notes

### Clean up (quick, mechanical)
- Delete narrating comments (`<!-- Hero Section -->`, `{/* Features */}`).
- Replace or remove placeholders: lorem, John Doe, Company Name, pravatar avatars, Logoipsum strips, `href="#"`.
- Fix the `<title>`, meta description, favicon and copyright year. Remove a leftover `noindex`.
- Strip chatbot residue: "Certainly! Here is", `utm_source=chatgpt.com`, citation markers.
- Social links: link real profiles or remove them. Never link a bare `https://twitter.com`.

### Copy (see COPY.md)
- Rewrite the hero first. It carries most of the judgement.
- Every claim gets a fact, or it goes.
- Cut sections that only exist because templates have them.

### Design (see DESIGN.md)
- Write a five-line brief and derive the look from the subject before touching CSS.
- Remove the defaults: gradient, glow, glass, emoji icons, identical cards, eyebrow pills, fade-up on everything.
- Lock the result in a `DESIGN.md` the agent reads before any later UI edit, so the next prompt does not undo it.

### Trust
- Add the people: name, role, one true line about them, and a photo they own.
- Give a direct way to reach a human. Show the address or city, the legal entity, prices or a starting price, and dates.
- Link to independent proof: Google Business Profile, G2, Trustpilot, press, GitHub.

## When the target is a live URL you cannot edit
Give the owner:
1. rewritten copy for each section, keyed to the current text;
2. a compact design spec (palette with roles, type pair, layout per section, what to delete);
3. a prompt they can paste into their builder (Lovable, Bolt, v0, Framer…). The visual report's "Copy the whole plan as a prompt" button does this.

## Things that look like fixes but are not
- Replacing "seamless" with "frictionless". It is the same cliché with a new word.
- Replacing the purple gradient with a teal gradient, or with cream + serif + terracotta.
- Adding invented numbers so the specificity check passes.
- Hiding text, or writing for the scanner instead of the reader.
- Removing builder badges while shipping the same template.
