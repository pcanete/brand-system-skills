# Changelog

## Unreleased

`brand-dna-scanner` 0.3.0 · `reference-scanner` 0.7.0 · `reference-to-astro` 0.7.0

### The gates were evadable

Every gate shipped so far read a number the author wrote about their own work:
`confidence`, `salience`, `coverage`. A gate driven by a self-reported score is
satisfied by reporting a lower score — and omitting the field was cheaper
still, since a missing `salience` excused the claim entirely.

The demonstration is now a permanent fixture. `tests/rejected-evasive/` holds a
`STYLE_DNA` that breaks no schema and states no falsehood about itself: every
score is modest, capabilities are declared absent, coverage sits just under the
threshold. It also asserts an exact typeface with tracking, a twelve-column
grid, and a named easing curve, with no evidence anywhere. It passed every gate
in both the scanner and the builder.

**New gate — claimed areas are backed.** If a block asserts anything about the
reference or the brand, that area needs at least one observation carrying
evidence. It ignores confidence, salience and coverage entirely. Saying
`unknown` is not a claim and stays free; the two ways through are recording
where the claim came from, or not making it.

Lowering a score is not lowering a claim: `family: "Söhne"` asserts the same
thing at 0.55 as at 0.99. The documentation said there were two honest answers
to a rejection; only now is the cheap third one closed.

Also: a missing `salience` no longer excuses a claim. Omitting a field must
never be cheaper than declaring one, or the gates teach authors to write less.

### Behavior gates now apply on both sides

`behavior-gates.mjs` lived only in `reference-scanner`, so the scanner held
itself to behavior forensics while the builder accepted any
`REFERENCE_EVIDENCE` without checking. It is now duplicated byte-identically
into `reference-to-astro`, wired into `validate-inputs.mjs`, and covered by the
repository's drift check like the other shared contracts.

### Fixtures

Backing the new gate exposed unsupported claims in the repository's own
fixtures — an art-direction summary, a primary journey, a fullscreen-media
behavior, and the brand example's personality traits, all asserted with nothing
recorded behind them. Each now carries its evidence, which is what those
examples should have shown from the start.

---

## Earlier

`brand-dna-scanner` 0.2.0 · `reference-scanner` 0.4.0 · `reference-to-astro` 0.5.0

### Implementation knowledge for the builder

`reference-to-astro` named the behaviors it had to reproduce — scroll scenes,
scrubbing, pinning, canvas renderers, page transitions — without ever saying
how any of them are built. An agent following the skill knew what to look for
and had to improvise the rest.

New `references/scroll-scenes.md` covers the gap: classifying triggered vs
linked vs scene before implementing, ScrollTrigger configuration for scrub,
pinning and snapping, the ancestor `transform` that silently breaks a pin, the
full scroll-scrubbed frame-sequence pipeline with its memory budget and video
fallback, CSS `animation-timeline` as progressive enhancement with its current
support boundary, when smooth scroll is evidence and what it breaks when it is
not, teardown across client-side navigation, and a defined reduced state for
every kind of scroll motion.

Expanded with the same standard:

- **`media-strategy.md`** — reserving the box against layout shift, LCP and
  loading priority, autoplay constraints, pausing off-screen video, font
  loading and metric-adjusted fallbacks, and measuring only after
  `document.fonts.ready`.
- **`webgl-policy.md`** — colour management, which is why a correctly loaded
  model looks dark: output colour space, tone mapping, per-texture colour
  space, and environment lighting. Plus payload compression, pixel-ratio caps,
  context loss and disposal.
- **`accessibility-performance.md`** — a reduced state per motion category
  rather than "durations to zero", the interaction highly art-directed
  references routinely omit (focus, escape, focus return, discrete equivalents
  for drag), and the three performance failures that break fidelity itself.
- **`responsive-reconstruction.md`** — `svh`/`lvh`/`dvh` and the mobile URL bar,
  and gating on capability (`hover`, `pointer`) instead of width.
- **`astro-architecture.md`** — what client-side navigation changes: scripts
  that do not re-run, teardown on swap, and what `transition:persist` protects.

Every API named here was verified against current documentation rather than
recalled: GSAP 3.13+ (the whole toolset now free for commercial use),
ScrollTrigger, Astro's ClientRouter lifecycle, three.js `toneMapping` and
`outputColorSpace`, Lenis, and the browser support boundary for CSS
scroll-driven animations as of mid-2026.

---

`brand-dna-scanner` 0.2.0 · `reference-scanner` 0.4.0 · `reference-to-astro` 0.4.0

Contracts are unchanged: Brand DNA stays `0.1.x` and the web schemas stay
`0.3.x`. Documents that validated before still validate — but a document with
no evidence behind it no longer passes.

### The gates

The validators now check support, not only shape. Across both contract
families:

- an observation recorded as `exact` or `derived` must carry `evidence_refs`;
- declared coverage must be backed by observations in that dimension, and for
  motion, responsive and interaction by recorded samples;
- claims the contract itself marks as salient and confident must appear in
  `observations`, where they can be traced;
- a contract that records nothing is rejected.

In `brand-dna-scanner`, one more: **recurrence must be earned**. Anything
scored recurrent has to trace back to at least two distinct sources — the
skill's founding rule, made executable.

`--lenient` restores shape-only checking for work in progress.

### Wiring

The skills now invoke their own tooling. Every SKILL.md names the schemas,
templates and scripts it ships, and states where each one runs: an input gate
before building, a verification gate before delivering. Previously those files
existed in the repository without any path from the skill's instructions to
them.

- `reference-scanner` gained `scripts/validate-style-dna.mjs`. It can now
  verify its own output without `reference-to-astro` installed.
- `reference-to-astro` runs `validate-inputs.mjs` as a gate before
  construction, and names `build-check`, `audit-assets` and `visual-qa` at
  their QA steps.
- `brand-dna-scanner` runs `validate-brand-dna.mjs` before presenting results.

### Visual QA

- Page loads no longer wait for network idle, which a continuously animated or
  WebGL reference never reaches. Load is bounded and then settled.
- Console errors now fail the run. Known third-party noise goes in the
  profile's `ignore_console`, where the decision stays visible.
- The reduced-motion pass covers every route, not just the first one.
- `audit-assets.mjs` and `visual-qa.mjs` accept `--project`, like
  `build-check.mjs`.
- The report states plainly that captures are evidence, not a verdict: nothing
  here compares the result to the reference automatically.

### Repository

- The repository check now fails on unreferenced bundled files, version drift
  between `SKILL.md`, `package.json` and the docs, and drift in the duplicated
  `scripts/lib/web-contracts.mjs`.
- `tests/rejected/` holds fixtures that must be rejected. If they ever pass,
  the gates stopped working and CI fails.
- Examples and assets are held to the same synthetic-source rule as fixtures.

### Both engines

Skills install into Claude and Codex alike; installation documents both.
Descriptions now state when a skill applies and when it does not, so the wrong
one is not picked. `brand-dna-scanner` moved its optional channels and its
synthesis detail into `references/`, keeping SKILL.md to what is always
needed.

## Initial skill versions

- `brand-dna-scanner` 0.1.0
- `reference-scanner` 0.3.0
- `reference-to-astro` 0.3.0
